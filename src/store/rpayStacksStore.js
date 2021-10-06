import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'
import {
  makeSTXTokenTransfer,
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction,
  makeContractDeploy,
  bufferCV,
  cvToValue,
  uintCV,
  intCV,
  serializeCV,
  PostConditionMode
} from '@stacks/transactions'
import { openSTXTransfer, openContractDeploy, openContractCall } from '@stacks/connect'
import {
  StacksTestnet,
  StacksMainnet
} from '@stacks/network'
import axios from 'axios'
import BigNum from 'bn.js'

const network = new StacksTestnet()
const precision = 1000000
const contractDeployFee = 60000
const testnet = new StacksTestnet()
const mainnet = new StacksMainnet()

const captureResult = function (dispatch, rootGetters, result) {
  result.opcode = 'stx-transaction-sent'
  result.txStatus = 'pending'
  try {
    if (result.functionName === 'mint-token') {
      result.assetHash = cvToValue(result.functionArgs[0]).substring(2)
      const configuration = rootGetters['rpayStore/getConfiguration']
      const application = rootGetters['rpayStacksContractStore/getApplicationFromRegistryByContractId'](configuration.risidioProjectId)
      result.amount = application.tokenContract.mintPrice * 1000000
      // console.log(typeof result.assetHash)
    } else {
      result.nftIndex = cvToValue(result.functionArgs[0])
      if (typeof result.nftIndex === 'bigint') {
        result.nftIndex = Number(result.nftIndex)
      }
      if (result.functionName === 'set-sale-data') {
        result.saleType = Number(cvToValue(result.functionArgs[1]))
        result.amount = Number(cvToValue(result.functionArgs[4]))
      } else if (result.functionName === 'buy-now') {
        try {
          result.amount = Number(cvToValue(result.stacksTransaction.postConditions.values[0].amount))
        } catch (e) {
          // should be amount in the post condition
        }
        result.from = cvToValue(result.functionArgs[1])
        result.to = cvToValue(result.functionArgs[2])
      } else if (result.functionName === 'transfer') {
        result.from = cvToValue(result.functionArgs[1])
        result.to = cvToValue(result.functionArgs[2])
      } else if (result.functionName === 'opening-bid' || result.functionName === 'place-bid') {
        result.amount = Number(cvToValue(result.functionArgs[1]))
      }
    }
  } catch (err) {
    console.log('no nft index in first arg for function - ' + result.functionName)
  }
  result.contractId = result.contractAddress + '.' + result.contractName
  result.timestamp = new Date().getTime()
  dispatch('rpayTransactionStore/registerTransaction', result, { root: true }).then(() => {
    dispatch('rpayStacksContractStore/updateCache', result, { root: true })
    window.eventBus.$emit('rpayEvent', result)
    const timer1 = setInterval(function () {
      dispatch('rpayTransactionStore/fetchTransactionFromChainByTxId', result.txId, { root: true }).then((txData) => {
        result.txStatus = txData.txStatus
        dispatch('rpayTransactionStore/updateTransaction', result, { root: true })
        if (txData.txStatus !== 'pending') {
          window.eventBus.$emit('rpayEvent', result)
          dispatch('rpayStacksContractStore/updateCache', result, { root: true })
          clearInterval(timer1)
        }
      })
    }, 15000)
  })
}

const resolveError = function (commit, reject, error) {
  let errorMessage = null
  if (!error) {
    errorMessage = 'Error happened'
  }
  if (error.response && error.response.data) {
    if (error.response.data.error) {
      errorMessage = 'Transaction rejected: ' + error.response.data.reason
      if (error.response.data.reason_data) {
        errorMessage += JSON.stringify(error.response.data.reason_data)
      }
    } else if (error.response.data.message) {
      if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
        errorMessage = 'Not enough funds in the wallet to send this - try decreasing the amount?'
      } else if (error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
        errorMessage = 'Conflicting Nonce In Mempool!'
      } else {
        errorMessage = error.response.data.message
      }
    } else {
      if (error.response && error.response.data) {
        errorMessage = error.response.data
      } else {
        errorMessage = 'no error.response.data'
      }
    }
  } else if (error.message) {
    errorMessage = error.message
  } else {
    errorMessage = error
  }
  commit(APP_CONSTANTS.SET_MINTING_MESSAGE, { opcode: 'stx-mint-error', message: errorMessage }, { root: true })
  if (window.eventBus) window.eventBus.$emit('rpayEvent', { opcode: 'stx-mint-error', message: errorMessage })
  reject(new Error(errorMessage))
}
const handleFetchWalletInternal = function (wallet, response, commit, resolve) {
  wallet.nonce = response.data.nonce
  wallet.balance = utils.fromMicroAmount(response.data.balance)
  resolve(wallet)
}

const rpayStacksStore = {
  namespaced: true,
  state: {
    provider: 'connect',
    result: null,
    contracts: [],
    appName: 'NFTS on Bitcoin',
    appLogo: '/img/logo/logo.png',
    macsWallet: null,
    skysWallet: null
  },
  getters: {
    getWalletMode: state => {
      return state.provider
    },
    getMacsWallet: state => {
      return state.macsWallet
    },
    getSkysWallet: state => {
      return state.skysWallet
    }
  },
  mutations: {
    setMacsWallet (state, newMac) {
      state.macsWallet = newMac
    },
    setSkysWallet (state, newSky) {
      state.skysWallet = newSky
    },
    setResult (state, result) {
      state.result = result
    },
    toggleWalletMode (state) {
      if (state.provider === 'risidio') {
        state.provider = 'connect'
      } else {
        state.provider = 'risidio'
      }
    }
  },
  actions: {
    cleanup ({ state }) {
      return new Promise((resolve, reject) => {
        resolve(null)
      })
    },
    fetchMacSkyWalletInfo ({ commit, dispatch, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const walletMac = JSON.parse(configuration.risidioWalletMac)
        const walletSky = JSON.parse(configuration.risidioWalletSky)
        commit('setMacsWallet', walletMac)
        commit('setSkysWallet', walletSky)
        dispatch('fetchWalletInternal', walletMac).then((wallet) => {
          if (wallet) {
            commit('setMacsWallet', wallet)
            resolve(wallet)
            dispatch('fetchWalletInternal', walletSky).then((wallet) => {
              commit('setSkysWallet', wallet)
              resolve(wallet)
            }).catch((err) => {
              reject(new Error(err))
            })
          } else {
            resolve()
          }
        }).catch((err) => {
          reject(new Error(err))
        })
      })
    },
    fetchWalletInternal ({ commit, rootGetters }, wallet) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const data = {
          path: '/v2/accounts/' + wallet.keyInfo.address,
          httpMethod: 'get',
          postData: {
            sender: '',
            arguments: []
          }
        }
        if (configuration.network === 'local') {
          // const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
          axios.post(configuration.risidioBaseApi + '/mesh/v2/accounts', data).then(response => {
            handleFetchWalletInternal(wallet, response, commit, resolve)
          }).catch(() => {
            resolve()
          })
        } else {
          resolve()
        }
      })
    },
    callContractBlockstack ({ dispatch, commit, rootGetters, state }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const txOptions = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          postConditions: (data.postConditions) ? data.postConditions : [],
          network: (configuration.network === 'mainnet') ? mainnet : testnet,
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          onFinish: (response) => {
            const result = {
              txId: response.txId,
              txRaw: response.txRaw,
              stacksTransaction: response.stacksTransaction,
              network: 15,
              assetHash: data.assetHash,
              contractAddress: data.contractAddress,
              contractName: data.contractName,
              functionName: data.functionName,
              functionArgs: data.functionArgs
            }
            captureResult(dispatch, rootGetters, result)
            resolve(result)
          }
        }
        openContractCall(txOptions).catch((error) => {
          reject(error)
        })
      })
    },
    callContractRisidio ({ commit, state, dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let sender = state.macsWallet
        if (data.sendAsSky) {
          sender = state.skysWallet
        }
        dispatch('rpayAuthStore/fetchNoncesFor', sender.keyInfo.address, { root: true }).then((nonces) => {
          const txOptions = {
            contractAddress: data.contractAddress,
            contractName: data.contractName,
            functionName: data.functionName,
            functionArgs: (data.functionArgs) ? data.functionArgs : [],
            fee: new BigNum(1800),
            senderKey: sender.keyInfo.privateKey,
            nonce: new BigNum(nonces.possible_next_nonce),
            network,
            postConditionMode: PostConditionMode.Allow,
            postConditions: (data.postConditions) ? data.postConditions : []
          }
          makeContractCall(txOptions).then((transaction) => {
            const txdata = new Uint8Array(transaction.serialize())
            const headers = {
              'Content-Type': 'application/octet-stream'
            }
            axios.post(configuration.risidioBaseApi + '/mesh' + '/v2/broadcast', txdata, { headers: headers }).then(response => {
              const result = {
                txId: response.data,
                network: 15,
                assetHash: data.assetHash,
                contractAddress: data.contractAddress,
                contractName: data.contractName,
                functionName: data.functionName,
                functionArgs: data.functionArgs
              }
              dispatch('fetchMacSkyWalletInfo')
              captureResult(dispatch, rootGetters, result)
              resolve(result)
            }).catch((error) => {
              dispatch('fetchMacSkyWalletInfo')
              resolveError(commit, reject, error)
            })
            if (configuration.network !== 'local') {
              broadcastTransaction(transaction, network).then((result) => {
                result.contractAddress = data.contractAddress
                result.contractName = data.contractName
                result.functionName = data.functionName
                captureResult(dispatch, rootGetters, result)
                resolve(result)
              }).catch((error) => {
                reject(error)
              })
            }
          })
        })
        /**
        let nonce = new BigNum(sender.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(sender.nonce + 1)
        }
        **/
      })
    },
    callContractBlockstackReadOnly ({ state }, data) {
      return new Promise((resolve, reject) => {
        callReadOnlyFunction({
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          senderAddress: state.macsWallet.keyInfo.address
        }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    callContractReadOnly ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = '/v2/contracts/call-read/' + data.contractAddress + '/' + data.contractName + '/' + data.functionName
        const txOptions = {
          path: path,
          httpMethod: 'POST',
          postData: {
            arguments: (data.functionArgs) ? data.functionArgs : [],
            sender: data.contractAddress
          }
        }
        const headers = {
          'Content-Type': 'application/json'
        }
        if (configuration.network === 'local') {
          const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
          axios.post(configuration.risidioBaseApi + '/mesh' + '/v2/accounts', txOptions, authHeaders).then(response => {
            data.result = utils.jsonFromTxResult(response.data.result)
            resolve(data)
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        } else {
          axios.post(configuration.risidioStacksApi + path, txOptions.postData, { headers: headers }).then(response => {
            data.result = utils.jsonFromTxResult(response.data.result)
            resolve(data)
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        }
      })
    },
    lookupTokenContractData: function ({ dispatch }, data) {
      return new Promise(function (resolve) {
        const functionArgs = []
        const config = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-contract-data',
          functionArgs: functionArgs
        }
        dispatch('callContractReadOnly', config).then((result) => {
          resolve(result)
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    lookupAppmapContractData: function ({ dispatch }, data) {
      return new Promise(function (resolve) {
        const functionArgs = []
        const config = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-contract-data',
          functionArgs: functionArgs
        }
        dispatch('callContractReadOnly', config).then((result) => {
          resolve(result)
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    lookupApplicationByIndex: function ({ dispatch }, data) {
      return new Promise(function (resolve) {
        const functionArgs = [`0x${serializeCV(intCV(data.appCounter)).toString('hex')}`]
        const config = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-app',
          functionArgs: functionArgs
        }
        dispatch('callContractReadOnly', config).then((result) => {
          resolve(result)
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    lookupToken: function ({ dispatch, commit }, data) {
      return new Promise(function (resolve) {
        const functionArgs = [`0x${serializeCV(uintCV(data.nftIndex)).toString('hex')}`]
        const config = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-token-by-index',
          functionArgs: functionArgs
        }
        dispatch('callContractReadOnly', config).then((resp) => {
          if (resp.result && (resp.result.nftIndex === 0 || resp.result.nftIndex > 0)) {
            const result = resp.result
            result.network = 15
            result.opcode = 'stx-contract-read'
            resolve(result)
            window.eventBus.$emit('rpayEvent', result)
          } else {
            resolve(null)
          }
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    lookupTokenByIndex: function ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        data.a1 = intCV(data.nftIndex)
        data.a2 = serializeCV(data.a1)
        data.a3 = (data.a2).toString('hex')
        data.functionArgs = [`0x${serializeCV(intCV(data.nftIndex)).toString('hex')}`]
        data.functionName = 'get-token-by-index'
        dispatch('lookupToken', data).then((result) => {
          resolve(result)
        })
      })
    },
    lookupTokenByHash ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        const buffer = `0x${serializeCV(bufferCV(Buffer.from(data.assetHash, 'hex'))).toString('hex')}` // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
        data.functionArgs = [buffer]
        data.functionName = 'get-token-by-hash'
        dispatch('lookupToken', data).then((result) => {
          resolve(result)
        })
      })
    },
    lookupContractInterface ({ commit, rootGetters }, contractId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const contractAddress = contractId.split('.')[0]
        const contractName = contractId.split('.')[1]
        const txOptions = {
          path: '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0',
          httpMethod: 'GET'
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(configuration.risidioBaseApi + '/mesh' + '/v2/accounts', txOptions, authHeaders).then(response => {
          resolve({ contractId: contractId, interface: response.data })
          // commit('addValue', response)
        }).catch(() => {
          axios.get(configuration.risidioStacksApi + '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0').then(response => {
            resolve({ contractId: contractId, interface: response.data })
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        })
      })
    },
    deployContractConnect ({ state, rootGetters }, datum) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const txOptions = {
          codeBody: datum.codeBody,
          contractName: datum.contractId.split('.')[1],
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          network: (configuration.network === 'mainnet') ? mainnet : testnet,
          finished: (response) => {
            const result = {
              txId: response.txId,
              txRaw: response.txRaw,
              network: 15
            }
            resolve(result)
          }
        }
        // 0x80800000000400216b6b9277c5e528fda5b7f3ba138839d4bc4d5d000000000000000000000000000007e20101fe1326c7ab2de2838bde08c01086bf34547cef8ca28e50c1623129b9cf851e1b754bade4c7baf045d273a468bdb32508ce874017fb1a710dce11fb0610a6c841030200000000010d6e66742d696e746572666163650000075c3b3b205061727469616c20737570706f727420666f72204552432d373231204e4654206d6574686f6473202d20617070726f76616c73206e6f742079657420737570706f727465642e0a28646566696e652d7472616974207472616e7366657261626c652d6e66742d74726169740a2020280a202020203b3b207472616e73666572206173736574202d2074782d73656e6465722069732074686520202f206275796572202d2074686973206973200a202020203b3b20646966666572656e742066726f6d2074686520626c6f636b737461636b20696d706c656d6e656e746174696f6e207768657265207468652074782d73656e646572200a202020203b3b2068617320746f2063616c6c2074686973206d6574686f642e0a20202020287472616e736665722d66726f6d20287072696e636970616c207072696e636970616c2075696e74292028726573706f6e73652075696e742075696e7429290a0a202020203b3b207472616e73666572206173736574202d20736166657220666f726d2074782d73656e646572206d7573742062652063757272656e74206f776e65720a20202020287472616e7366657220287072696e636970616c2075696e74292028726573706f6e73652075696e742075696e7429290a0a202020203b3b206e756d626572206f6620746f6b656e73206f776e656420627920616464726573730a202020202862616c616e63652d6f6620287072696e636970616c292028726573706f6e73652075696e742075696e7429290a2020290a290a0a3b3b20436f6e74726163747320726570726573656e74696e672061737365747320666f722073616c6520696e206d61726b6574706c6163652e0a28646566696e652d7472616974207472616461626c652d6e66742d74726169740a2020280a3b3b207365742d73616c652d646174612075706461746573207468652073616c65207479706520616e6420707572636861736520696e666f20666f72206120676976656e204e46542e204f6e6c7920746865206f776e65722063616e2063616c6c2074686973206d6574686f640a3b3b20616e6420646f696e6720736f206d616b6520746865206173736574207472616e7366657261626c652062792074686520726563697069656e74202d206f6e20636f6e646974696f6e206f66206d656574696e672074686520636f6e646974696f6e73206f662073616c650a3b3b2054686973206973206571756976616c656e7420746f2074686520736574417070726f76616c466f72416c6c206d6574686f6420696e204552432037323120636f6e7472616374732e0a202020203b3b2061726773202d20312e2073686132353620617373657420686173680a202020203b3b2020202020202020322e2073616c652d7479706520303d6e6f7420666f722073616c652c20313d627579206e6f772c20323d62696464696e670a202020203b3b2020202020202020332e20696e6372656d6574202d20302069662073616c652d7479706520213d2032200a202020203b3b2020202020202020342e2072657365727665202d20302069662073616c652d7479706520213d2032200a202020203b3b2020202020202020352e206275792d6e6f772d6f722d7374617274696e672d7072696365202d20302069662073616c652d74797065203d2030200a202020203b3b2020202020202020362e2062696464696e672d656e642d64617465202d20696e206d732073696e6365207475726e206f662065706f6368200a20202020287365742d73616c652d6461746120282862756666203332292075696e742075696e742075696e742075696e742075696e74292028726573706f6e73652075696e742075696e7429290a3b3b20496e6469636174657320746865206e756d626572206f66207472616e736665727320666f722074686520676976656e2061737365740a202020203b3b2061726773202d20312e206e66742d696e6465780a20202020286765742d7472616e736665722d636f756e74202875696e74292028726573706f6e73652075696e742075696e7429290a2020290a290a0a3b3b205265616c20776f726c642061737365742e0a28646566696e652d747261697420747261636561626c652d6e66742d74726169740a2020280a3b3b204120747261636561626c65207472616974207265717569726573204e46547320746f206578706f7365206120637265617465206d6574686f647768696368206c696e6b73206120534841323536206861736820746f207468650a3b3b20746f6b656e2d69640a202020202863726561746520282862756666203332292075696e742075696e742075696e742075696e742075696e74292028726573706f6e73652075696e742075696e7429290a3b3b20496e6469636174657320746865206e756d626572206f66207472616e736665727320666f722074686520676976656e2061737365740a202020203b3b2061726773202d20312e206e66742d696e6465780a20202020286765742d7472616e736665722d636f756e74202875696e74292028726573706f6e73652075696e742075696e7429290a2020290a29
        openContractDeploy(txOptions).catch((error) => {
          reject(error)
        })
      })
    },
    deployContractRisidio ({ commit, state, rootGetters }, project) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const contractName = project.contractId.split('.')[1]
        const network = new StacksTestnet()
        const txOptions = {
          contractName: contractName,
          codeBody: project.codeBody,
          senderKey: state.macsWallet.keyInfo.privateKey,
          nonce: new BigNum(state.macsWallet.nonce++), // watch for nonce increments if this works - may need to restart mocknet!
          fee: new BigNum(project.fee), // set a tx fee if you don't want the builder to estimate
          network
        }
        makeContractDeploy(txOptions).then((transaction) => {
          const txdata = new Uint8Array(transaction.serialize())
          const headers = {
            'Content-Type': 'application/octet-stream'
          }

          if (configuration.network === 'local') {
            axios.post(configuration.risidioBaseApi + '/mesh/v2/broadcast', txdata, { headers: headers }).then((response) => {
              const result = {
                txId: response.data,
                txRaw: response.txRaw,
                network: 15
              }
              resolve(result)
            }).catch((error) => {
              resolveError(commit, reject, error)
            })
          } else {
            const useApi = configuration.risidioStacksApi + '/v2/transactions'
            axios.post(useApi, txdata, { headers: { 'Content-Type': 'application/octet-stream' } }).then((response) => {
              const result = {
                txId: response.data,
                txRaw: response.txRaw,
                network: 15
              }
              resolve(result)
            }).catch((error) => {
              resolveError(commit, reject, error)
            })
          }
        }).catch((error) => {
          resolveError(commit, reject, error)
        })
      })
    },
    makeTransferBlockstack ({ state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const amount = Math.round(data.amountStx * precision)
        // amount = parseInt(amount, 16)
        const configuration = rootGetters['rpayStore/getConfiguration']
        const amountBN = new BigNum(amount)
        openSTXTransfer({
          recipient: data.recipient,
          // network: network,
          amount: amountBN,
          network: (configuration.network === 'mainnet') ? mainnet : testnet,
          memo: 'Payment for credits',
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: result => {
            resolve({ result: result })
          }
        }).catch((err) => {
          console.log(err)
          reject(err)
        })
      })
    },
    makeTransferRisidio ({ dispatch, state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (data.amountStx > 500) {
          resolve('no more than 500')
          return
        }
        let sender = state.macsWallet
        if (data.sendAsSky) {
          sender = state.skysWallet
        }
        dispatch('rpayAuthStore/fetchNoncesFor', sender.keyInfo.address, { root: true }).then((nonces) => {
          const txOptions = {
            recipient: data.recipient,
            amount: new BigNum(utils.toOnChainAmount(data.amountStx)),
            network,
            memo: 'Sending payment for game credits.',
            fee: new BigNum(1800),
            senderKey: sender.keyInfo.privateKey,
            nonce: new BigNum(nonces.possible_next_nonce)
          }
          makeSTXTokenTransfer(txOptions).then((transaction) => {
            const txdata = new Uint8Array(transaction.serialize())
            const headers = {
              'Content-Type': 'application/octet-stream'
            }
            axios.post(configuration.risidioBaseApi + '/mesh/v2/broadcast', txdata, { headers: headers }).then(response => {
              resolve(response.data)
            }).catch(() => {
              const useApi = configuration.risidioStacksApi + '/v2/transactions'
              axios.post(useApi, txdata).then((response) => {
                resolve(response.data)
              }).catch((error) => {
                if (error.response && error.response.data) {
                  if (error.response.data.message && error.response.data.message.indexOf('BadNonce') > -1) {
                    reject(new Error('BadNonce! ' + error.response.data.message.substring(100)))
                  } else if (error.response.data.message && error.response.data.message.indexOf('NotEnoughFunds') > -1) {
                    reject(new Error('Not enough funds in the macsWallet to send this - try decreasing the amount?'))
                  } else if (error.response.data.message && error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
                    reject(new Error('Error: ConflictingNonceInMempool'))
                  } else {
                    reject(error.response.data)
                  }
                } else {
                  reject(error.message)
                }
              })
            })
          })
        })
      })
    },
    deployProjectContract ({ dispatch }, datum) {
      return new Promise((resolve, reject) => {
        if (!datum.fee) datum.fee = contractDeployFee
        const methos = (datum.network === 'local') ? 'deployContractRisidio' : 'deployContractConnect'
        dispatch(methos, datum).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksStore

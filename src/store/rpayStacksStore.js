import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'
import {
  makeSTXTokenTransfer,
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction,
  makeContractDeploy,
  bufferCV,
  uintCV,
  intCV,
  serializeCV,
  PostConditionMode
} from '@stacks/transactions'
import { openSTXTransfer, openContractDeploy, openContractCall } from '@stacks/connect'
import {
  StacksTestnet
} from '@stacks/network'
import axios from 'axios'
import BigNum from 'bn.js'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
// import { connectWebSocketClient } from '@stacks/blockchain-api-client'

let socket = null
let stompClient = null

const network = new StacksTestnet()
const precision = 1000000
const contractDeployFee = 60000

/**
const client = await connectWebSocketClient('ws://stacks-node-api.blockstack.org/')
const sub = await client.subscribeAddressTransactions(contractCall.txId, event => {
  console.log(event)
})
await sub.unsubscribe()
**/

const unsubscribeApiNews = function () {
  if (socket && stompClient) {
    stompClient.disconnect()
  }
}

const subscribeApiNews = function (commit, connectUrl, contractId, assetHash, network) {
  if (!socket) socket = new SockJS(connectUrl + '/api-news')
  if (!stompClient) stompClient = Stomp.over(socket)
  socket.onclose = function () {
    console.log('close')
    stompClient.disconnect()
  }
  stompClient.connect({}, function () {
    stompClient.subscribe('/queue/contract-news-' + contractId + '-' + assetHash, function (response) {
      const token = JSON.parse(response.body)
      commit('rpayStacksContractStore/setToken', { network: network, token: token }, { root: true })
    })
  },
  function (error) {
    console.log(error)
  })
}

const pollTxStatus = function (result, stacksApi) {
  return new Promise((resolve) => {
    let counter = 0
    const intval = setInterval(function () {
      axios.get(stacksApi + 'extended/v1/tx/' + result.txId).then(response => {
        const meth1 = 'tx_status'
        if (response[meth1] === 'success') {
          const meth2 = 'tx_status'
          const hexResolved = utils.fromHex(response[meth2].hex)
          resolve(hexResolved)
          clearInterval(intval)
          result.opcode = 'stx-transaction-finished'
          result.response = response
          window.eventBus.$emit('rpayEvent', result)
        }
      }).catch((e) => {
        console.log(e)
        clearInterval(intval)
      })
      if (counter === 90) {
        clearInterval(intval)
        resolve()
      }
      counter++
    }, 2000)
  })
}

const captureResult = function (dispatch, commit, rootGetters, result) {
  const configuration = rootGetters['rpayStore/getConfiguration']
  const contractId = result.contractAddress + '.' + result.contractName
  const stacksTransaction = { contractId: contractId, timestamp: Date.now(), txId: result.txId, assetHash: result.assetHash, type: result.functionName, status: 1 }
  dispatch('rpayStacksContractStore/postStacksTransaction', stacksTransaction, { root: true })
  const useApi = configuration.risidioBaseApi + '/mesh/v2/registry/' + contractId + '/' + result.assetHash
  const connectUrl = configuration.risidioBaseApi + '/mesh'
  result.opcode = 'stx-transaction-sent'
  window.eventBus.$emit('rpayEvent', result)
  if (configuration.risidioStacksApi.indexOf('stacks-node-api') > -1) {
    pollTxStatus(result, configuration.risidioStacksApi)
  }
  subscribeApiNews(commit, connectUrl, contractId, result.assetHash, configuration.network)
  axios.get(useApi).then(response => {
    console.log(response)
  }).catch((error) => {
    console.log(error)
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
    appName: 'Risidio Auctions',
    appLogo: '/img/risidio_white.png',
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
        unsubscribeApiNews()
        resolve(null)
      })
    },
    fetchMacSkyWalletInfo ({ commit, dispatch, rootGetters }) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const walletMac = JSON.parse(configuration.risidioWalletMac)
        const walletSky = JSON.parse(configuration.risidioWalletMac)
        commit('setMacsWallet', walletMac)
        commit('setSkysWallet', walletSky)
        dispatch('fetchWalletInternal', walletMac).then((wallet) => {
          commit('setMacsWallet', wallet)
          resolve(wallet)
          dispatch('fetchWalletInternal', walletSky).then((wallet) => {
            commit('setSkysWallet', wallet)
            resolve(wallet)
          })
        })
      })
    },
    fetchWalletInternal ({ state, commit, rootGetters }, wallet) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const data = {
          path: '/v2/accounts/' + wallet.keyInfo.address,
          httpMethod: 'get',
          postData: null
        }
        if (configuration.network === 'local') {
          axios.post(configuration.risidioBaseApi + '/mesh/v2/accounts', data).then(response => {
            handleFetchWalletInternal(wallet, response, commit, resolve)
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        } else {
          const useApi = configuration.risidioStacksApi + '/v2/accounts/' + wallet.keyInfo.address
          axios.get(useApi).then(response => {
            handleFetchWalletInternal(wallet, response, commit, resolve)
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        }
      })
    },
    callContractBlockstack ({ dispatch, commit, rootGetters, state }, data) {
      return new Promise((resolve, reject) => {
        const txOptions = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          postConditions: (data.postConditions) ? data.postConditions : [],
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: (response) => {
            const result = {
              txId: response.txId,
              txRaw: response.txRaw,
              network: 15,
              assetHash: data.assetHash,
              contractAddress: data.contractAddress,
              contractName: data.contractName,
              functionName: data.functionName,
              functionArgs: data.functionArgs
            }
            captureResult(dispatch, commit, rootGetters, result)
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
        let nonce = new BigNum(sender.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(sender.nonce + 1)
        }
        const txOptions = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          fee: new BigNum(1800),
          senderKey: sender.keyInfo.privateKey,
          nonce: new BigNum(nonce),
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
            captureResult(dispatch, commit, rootGetters, result)
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
              result.assetHash = data.assetHash
              captureResult(dispatch, commit, rootGetters, result)
              resolve(result)
            }).catch((error) => {
              reject(error)
            })
          }
        })
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
    callContractReadOnly ({ commit, state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (state) {
          console.log(state)
        }
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
          axios.post(configuration.risidioBaseApi + '/mesh' + '/v2/accounts', txOptions).then(response => {
            data.result = utils.fromHex(data.functionName, response.data.result)
            resolve(data)
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        } else {
          axios.post(configuration.risidioStacksApi + path, txOptions.postData, { headers: headers }).then(response => {
            // dispatch('fetchMacSkyWalletInfo')
            data.result = utils.fromHex(data.functionName, response.data.result)
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
            commit('rpayStacksContractStore/addContractWriteResult', result, { root: true })
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
    lookupContractInterface ({ commit, rootGetters }, projectId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const contractAddress = projectId.split('.')[0]
        const contractName = projectId.split('.')[1]
        const txOptions = {
          path: '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0',
          httpMethod: 'GET'
        }
        axios.post(configuration.risidioBaseApi + '/mesh' + '/v2/accounts', txOptions).then(response => {
          resolve({ projectId: projectId, interface: response.data })
          // commit('addValue', response)
        }).catch(() => {
          axios.get(configuration.risidioStacksApi + '/v2/contracts/interface/' + contractAddress + '/' + contractName + '?proof=0').then(response => {
            resolve({ projectId: projectId, interface: response.data })
          }).catch((error) => {
            resolveError(commit, reject, error)
          })
        })
      })
    },
    deployContractConnect ({ state }, datum) {
      return new Promise((resolve, reject) => {
        const txOptions = {
          codeBody: datum.codeBody,
          contractName: datum.projectId.split('.')[1],
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
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
        const contractName = project.projectId.split('.')[1]
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
        const amountBN = new BigNum(amount)
        openSTXTransfer({
          recipient: data.paymentAddress,
          // network: network,
          amount: amountBN,
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
    makeTransferRisidio ({ state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (data.amountStx > 500) {
          resolve('no more than 500')
          return
        }
        const amount = Math.round(data.amountStx * precision)
        // amount = parseInt(String(amount), 16)
        const amountBN = new BigNum(amount)

        // amount = amount.div(new BigNum(1000000))
        const senderKey = state.macsWallet.keyInfo.privateKey

        let nonce = new BigNum(state.macsWallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.macsWallet.nonce + 1)
        }

        const txOptions = {
          recipient: data.paymentAddress,
          amount: amountBN,
          senderKey: senderKey,
          network,
          memo: 'Sending payment for game credits.',
          nonce: nonce, // set a nonce manually if you don't want builder to fetch from a Stacks node
          fee: new BigNum(2000) // set a tx fee if you don't want the builder to estimate
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

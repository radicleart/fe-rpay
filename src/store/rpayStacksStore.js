import store from '@/store/rpayStore'
import bufferUtils from '@/services/bufferUtils'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import {
  makeSTXTokenTransfer,
  makeContractCall,
  callReadOnlyFunction,
  broadcastTransaction,
  makeContractDeploy,
  bufferCV,
  serializeCV
} from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'
import { openSTXTransfer, openContractDeploy, openContractCall } from '@stacks/connect'
import axios from 'axios'
import BigNum from 'bn.js'

const contractDeployFee = 8000
const network = new StacksTestnet()

// const mac = JSON.parse(process.env.VUE_APP_WALLET_MAC || '')
const precision = 1000000

const resolveError = function (reject, error) {
  if (!error) {
    reject('Error happened')
  }
  if (error.response && error.response.data) {
    if (error.response.data.error) {
      let msg = 'Transaction rejected: ' + error.response.data.reason
      if (error.response.data.reason_data) {
        msg += JSON.stringify(error.response.data.reason_data)
      }
      reject(new Error(msg))
    } else if (error.response.data.message) {
      if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
        reject(new Error('Not enough funds in the wallet to send this - try decreasing the amount?'))
      } else if (error.response.data.message.indexOf('ConflictingNonceInMempool') > -1) {
        reject(new Error('Conflicting Nonce In Mempool!'))
      } else {
        reject(new Error(error.response.data.message))
      }
    } else {
      if (error.response && error.response.data) {
        reject(new Error(error.response.data))
      } else {
        reject(new Error('no error.response.data'))
      }
    }
  } else if (error.message) {
    reject(error.message)
  } else {
    reject(error)
  }
}

const getAmountStx = function (amountMicroStx) {
  try {
    if (typeof amountMicroStx === 'string') {
      amountMicroStx = Number(amountMicroStx)
    }
    if (amountMicroStx === 0) return 0
    amountMicroStx = amountMicroStx / precision
    return Math.round(amountMicroStx * precision) / precision
  } catch {
    return 0
  }
}
const rpayStacksStore = {
  namespaced: true,
  state: {
    myProfile: {
      username: null,
      loggedIn: false,
      showAdmin: false
    },
    provider: 'risidio',
    appName: 'Loopbomb',
    appLogo: '/img/logo/Risidio_logo_256x256.png',
    macsWallet: null
  },
  getters: {
    getMacsWallet: state => {
      return state.macsWallet
    }
  },
  mutations: {
    setMacsWallet (state, newMac) {
      state.macsWallet = newMac
    }
  },
  actions: {
    fetchMacsWalletInfo ({ state, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const macsWallet = JSON.parse(rootGetters['rpayStore/getConfiguration'].risidioWalletMac)
        commit('setMacsWallet', macsWallet)
        const data = {
          path: '/v2/accounts/' + macsWallet.keyInfo.address,
          httpMethod: 'get',
          postData: null
        }
        axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh/v2/accounts', data).then(response => {
          macsWallet.nonce = response.data.nonce
          macsWallet.balance = getAmountStx(parseInt(response.data.balance, 16))
          commit('setMacsWallet', macsWallet)
          resolve(macsWallet)
        }).catch(() => {
          const macsWallet = state.macsWallet
          const useApi = rootGetters['rpayStore/getConfiguration'].risidioStacksApi + '/v2/accounts/' + macsWallet.keyInfo.address
          axios.get(useApi).then(response => {
            macsWallet.nonce = response.data.nonce
            macsWallet.balance = getAmountStx(parseInt(response.data.balance, 16))
            commit('setMacsWallet', macsWallet)
            resolve(macsWallet)
          }).catch((error) => {
            reject(error)
          })
        })
      })
    },
    callContractBlockstack ({ state }, data) {
      return new Promise((resolve, reject) => {
        const txoptions = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          // network: network,
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
        openContractCall(txoptions).catch((error) => {
          reject(error)
        })
      })
    },
    callContractRisidio ({ state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        let nonce = new BigNum(state.macsWallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.macsWallet.nonce + 1)
        }
        // 5000 000 000 000 000
        const txOptions = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: (data.functionArgs) ? data.functionArgs : [],
          fee: new BigNum(1800),
          senderKey: state.macsWallet.keyInfo.privateKey,
          nonce: new BigNum(nonce),
          validateWithAbi: false,
          network
        }
        makeContractCall(txOptions).then((transaction) => {
          if (state.provider !== 'risidio') {
            broadcastTransaction(transaction, network).then((result) => {
              resolve(result)
            }).catch((error) => {
              reject(error)
            })
          } else {
            const txdata = new Uint8Array(transaction.serialize())
            const headers = {
              'Content-Type': 'application/octet-stream'
            }
            axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh' + '/v2/broadcast', txdata, { headers: headers }).then(response => {
              const result = {
                txId: response.data,
                network: 15
                // tokenId: Math.floor(Math.random() * Math.floor(1000000000))
              }
              resolve(result)
            }).catch(() => {
              axios.post(rootGetters['rpayStore/getConfiguration'].risidioStacksApi + '/v2/transactions', txdata, { headers: headers }).then(response => {
                const result = {
                  txId: response.data,
                  network: 15
                  // tokenId: Math.floor(Math.random() * Math.floor(1000000000))
                }
                resolve(result)
              }).catch((error) => {
                resolveError(reject, error)
              })
            })
          }
        })
      })
    },
    callContractRisidioReadOnly ({ state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const postData = {
          arguments: (data.functionArgs) ? data.functionArgs : [],
          sender: state.macsWallet.keyInfo.address
        }
        const apiPath = '/v2/contracts/call-read/' + data.contractAddress + '/' + data.contractName + '/' + data.functionName
        const txoptions = {
          path: apiPath,
          httpMethod: 'POST',
          postData: postData
        }
        const headers = {
          'Content-Type': 'application/json'
        }
        axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh' + '/v2/accounts', txoptions, { headers: headers }).then(response => {
          if (!response.data.okay) {
            reject(new Error('not okay - ' + response.data.cause))
            return
          }
          data.result = bufferUtils.fromHex(data.functionName, response.data.result)
          // const res = getAmountStx(parseInt(response.data.result, 16))
          resolve(data)
        }).catch(() => {
          axios.post(rootGetters['rpayStore/getConfiguration'].risidioStacksApi + apiPath, postData, { headers: headers }).then(response => {
            if (!response.data.okay) {
              reject(new Error('not okay - ' + response.data.cause))
              return
            }
            data.result = bufferUtils.fromHex(data.functionName, response.data.result)
            resolve(data)
          }).catch((error) => {
            if (error.response && error.response.data && error.response.data.message) {
              if (error.response.data.message.indexOf('NotEnoughFunds') > -1) {
                reject(new Error('Not enough funds in the macsWallet to send this - try decreasing the amount?'))
              } else {
                reject(error.response.data.message)
              }
            } else {
              reject(error.message)
            }
          })
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
    lookupNftTokenId ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        const buffer = `0x${serializeCV(bufferCV(Buffer.from(data.assetHash, 'hex'))).toString('hex')}` // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
        const config = {
          contractId: data.contractAddress + '.' + data.contractName,
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-index',
          functionArgs: [buffer]
        }
        dispatch('callContractRisidioReadOnly', config).then((data) => {
          const result = {}
          result.network = 15
          result.opcode = 'nft-lookup-success'
          result.nftIndex = data.result
          resolve(result)
        }).catch((e) => {
          this.message = (e.message) ? 'Error ' + e.message : 'Minting error in nftIndex lookup - reason unknown'
          this.page = 'error'
          reject(new Error({ opcode: 'nft-lookup-error', message: this.message }))
        })
      })
    },
    makeTransferRisidio ({ state, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const paymentChallenge = store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
        let amount = Math.round(paymentChallenge.xchange.amountStx * precision)
        amount = parseInt(amount, 16)
        amount = new BigNum(amount)

        // amount = amount.div(new BigNum(1000000))
        const senderKey = state.macsWallet.keyInfo.privateKey
        let recipient = data.paymentAddress
        const configuration = store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
        if (configuration.minter && configuration.minter.stxPaymentAddress) {
          recipient = configuration.minter.stxPaymentAddress
        }

        let nonce = new BigNum(state.macsWallet.nonce)
        if (data && data.action === 'inc-nonce') {
          nonce = new BigNum(state.macsWallet.nonce + 1)
        }

        const txOptions = {
          recipient: recipient,
          amount: amount,
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
          axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh' + '/v2/broadcast', txdata, { headers: headers }).then(response => {
            resolve(response.data)
          }).catch(() => {
            const useApi = rootGetters['rpayStore/getConfiguration'].risidioStacksApi + '/v2/transactions'
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
    makeTransferBlockstack ({ state }, data) {
      return new Promise((resolve, reject) => {
        const configuration = store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
        let recipient = data.paymentAddress
        if (configuration.minter && configuration.minter.stxPaymentAddress) {
          recipient = configuration.minter.stxPaymentAddress
        }
        openSTXTransfer({
          recipient: recipient,
          // network: network,
          amount: configuration.payment.amountStx,
          memo: 'Payment for ' + configuration.payment.creditAttributes.start + ' credits',
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
    fetchFeeEstimate ({ state, commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const data = { path: '/v2/fees/transfer', httpMethod: 'get', postData: null }
        axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh' + '/v2/accounts', data).then(response => {
          resolve(response.data)
          commit('setFeeEstimate', response.data)
        }).catch(() => {
          axios.get(rootGetters['rpayStore/getConfiguration'].risidioStacksApi + '/v2/fees/transfer').then((response) => {
            resolve(response.data)
          }).catch((error) => {
            if (error.response && error.response.data) {
              const msg = error.response.data.status + ' - ' + error.response.data.message
              reject(msg)
            } else {
              reject(error)
            }
          })
        })
      })
    },
    deployContractBlockstack ({ state }, data) {
      return new Promise((resolve) => {
        // const authOrigin = (state.provider === 'local-network') ? 'http://localhost:20443' : null
        openContractDeploy({
          contractName: data.contractName,
          codeBody: data.codeBody,
          // authOrigin,
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: (trans) => {
            console.log(trans.txid)
            store.dispatch('rstackStore/saveToGaia', trans).then(() => {
              data.result = trans
              store.dispatch('rpayStacksStore/fetchMacsWalletInfo')
              resolve(data)
            })
          }
        })
      })
    },
    deployContractRisidio ({ state, commit, dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const sender = state.macsWallet
        if (!data.fee) {
          data.fee = contractDeployFee
        }
        const txOptions = {
          contractName: data.contractName,
          codeBody: data.codeBody,
          senderKey: sender.keyInfo.privateKey,
          nonce: new BigNum(sender.nonce++), // watch for nonce increments if this works - may need to restart mocknet!
          fee: new BigNum(data.fee), // set a tx fee if you don't want the builder to estimate
          network
        }
        makeContractDeploy(txOptions).then((transaction) => {
          const txdata = new Uint8Array(transaction.serialize())
          const headers = {
            'Content-Type': 'application/octet-stream'
          }
          axios.post(rootGetters['rpayStore/getConfiguration'].risidioBaseApi + '/mesh' + '/v2/broadcast', txdata, { headers: headers }).then(response => {
            txOptions.senderKey = null
            txOptions.fromAddress = data.address
            txOptions.result = response.data
            txOptions.provider = 'risidio'
            txOptions.txtype = 'deployment'
            dispatch('rpayStacksStore/fetchMacsWalletInfo')
            resolve(txOptions)
          }).catch(() => {
            const useApi = rootGetters['rpayStore/getConfiguration'].risidioStacksApi + '/v2/transactions'
            axios.post(useApi, txdata).then((response) => {
              txOptions.senderKey = null
              txOptions.fromAddress = data.address
              txOptions.result = response.data
              txOptions.provider = 'risidio'
              txOptions.txtype = 'deployment'
              dispatch('rpayStacksStore/fetchMacsWalletInfo')
              resolve(txOptions)
            }).catch((error) => {
              reject(error)
            })
          })
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksStore

import axios from 'axios'
import utils from '@/services/utils'
// import SockJS from 'sockjs-client'
// import Stomp from '@stomp/stompjs'

// let socket = null
// let stompClient = null

const rpayTransactionStore = {
  namespaced: true,
  modules: {
  },
  state: {
    transactions: [],
    pendingTransactions: []
  },
  getters: {
    getTransaction: state => txId => {
      if (!txId) return { error: 'invalid transaction id' }
      const index = state.transactions.findIndex((o) => o.txId === txId)
      if (index > -1) {
        return state.transactions[index]
      } else {
        return null
      }
    },
    getPending: state => item => {
      let results = []
      if (item.contractAsset) {
        results = state.pendingTransactions.filter((o) => o.nftIndex === item.contractAsset.nftIndex)
      } else {
        results = state.pendingTransactions.filter((o) => o.assetHash === item.assetHash)
      }
      if (results.length === 0) return null
      return results
    },
    getPendingByNftIndex: state => nftIndex => {
      return state.pendingTransactions.filter((o) => o.nftIndex === nftIndex)
    },
    getPendingByAssetHash: state => assetHash => {
      return state.pendingTransactions.filter((o) => o.assetHash === assetHash)
    },
    getTransactionsByNftIndex: state => nftIndex => {
      return state.transactions.filter((o) => o.nftIndex === nftIndex)
    },
    getTransactionsByAssetHash: state => assetHash => {
      return state.transactions.filter((o) => o.assetHash === assetHash)
    },
    getTransactionsByTxStatus: state => txStatus => {
      return state.transactions.filter((o) => o.txStatus === txStatus)
    },
    getTransactionsByFunctionName: state => functionName => {
      return state.transactions.filter((o) => o.functionName === functionName)
    },
    getTransactionsByTxStatusAndNftIndex: state => data => {
      return state.transactions.filter((o) => o.txStatus === data.txStatus && o.nftIndex === data.nftIndex)
    }
  },
  mutations: {
    setPendingTransactions (state, transactions) {
      state.pendingTransactions = transactions
    },
    setTransaction (state, transaction) {
      const index = state.transactions.findIndex((o) => o.txId === transaction.txId)
      if (index > -1) {
        state.transactions.splice(index, 1, transaction)
      } else {
        state.transactions.splice(0, 0, transaction)
      }
    },
    setTransactions (state, transactions) {
      transactions.forEach((transaction) => {
        const index = state.transactions.findIndex((o) => o.txId === transaction.txId)
        if (index > -1) {
          state.transactions.splice(index, 1, transaction)
        } else {
          state.transactions.splice(0, 0, transaction)
        }
      })
    }
  },
  actions: {
    initialiseTransactionListener ({ rootGetters, commit }) {
      return new Promise((resolve) => {
        resolve(null)
      })
    },
    cleanup ({ state }) {
      return new Promise((resolve) => {
        // unsubscribeApiNews()
        resolve(null)
      })
    },
    registerTransaction ({ rootGetters, commit }, txData) {
      return new Promise(function (resolve, reject) {
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        if (!txData.txId || typeof txData.txId !== 'string') {
          throw new Error('txId of txData not a string')
        } else if (!txData.txId.startsWith('0x')) {
          txData.txId = '0x' + txData.txId
        }
        const stacksTx = {
          timestamp: txData.timestamp || new Date().getTime(),
          nftIndex: txData.nftIndex,
          contractId: txData.contractId,
          functionName: txData.functionName,
          assetHash: txData.assetHash,
          assetHashes: txData.assetHashes,
          batchSize: txData.batchSize,
          txId: txData.txId,
          saleType: txData.saleType,
          amount: txData.amount,
          from: (txData.from) ? txData.from : profile.stxAddress,
          to: txData.to,
          txStatus: txData.txStatus
        }
        commit('setTransaction', stacksTx)
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/transaction', stacksTx).then((response) => {
          commit('setTransaction', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateTransaction ({ rootGetters, commit }, txData) {
      return new Promise(function (resolve, reject) {
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        if (!txData.txId || typeof txData.txId !== 'string') {
          throw new Error('txId of txData not a string')
        } else if (!txData.txId.startsWith('0x')) {
          txData.txId = '0x' + txData.txId
        }
        const stacksTx = {
          timestamp: txData.timestamp || new Date().getTime(),
          nftIndex: txData.nftIndex,
          contractId: txData.contractId,
          functionName: txData.functionName,
          assetHash: txData.assetHash,
          assetHashes: txData.assetHashes,
          batchSize: txData.batchSize,
          txId: txData.txId,
          saleType: txData.saleType,
          amount: txData.amount,
          from: (txData.from) ? txData.from : profile.stxAddress,
          to: txData.to,
          txStatus: txData.txStatus
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.put(configuration.risidioBaseApi + '/mesh/v2/transaction', stacksTx).then((response) => {
          commit('setTransaction', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchTransactionFromChainByTxId ({ dispatch, rootGetters }, txId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let onchainTxId = txId
        if (typeof txId === 'object') onchainTxId = txId.txid
        if (!onchainTxId.startsWith('0x')) onchainTxId = '0x' + onchainTxId
        const stacksNode = configuration.risidioStacksApi + '/extended/v1/tx/' + onchainTxId
        axios.get(stacksNode).then((response) => {
          const txData = response.data
          if (txData && txData.tx_status) {
            const result = {}
            result.txId = onchainTxId
            result.txStatus = txData.tx_status
            result.txResult = txData.tx_result
            // result.opcode = 'stx-transaction-update'
            if (txData.tx_type !== 'token_transfer') {
              result.contractId = txData.contract_call.contract_id
              result.functionName = txData.contract_call.function_name
              if (txData.tx_result && txData.tx_status !== 'pending') {
                const jsonRes = utils.jsonFromTxResult(txData)
                if (jsonRes && result.functionName.indexOf('mint-') > 0 && jsonRes.success && jsonRes.value.type === 'uint') {
                  result.nftIndex = jsonRes.value.value
                }
              }
            }
            if (txData.tx_status !== 'pending') {
              dispatch('rpayStacksContractStore/updateCache', result, { root: true })
            }
            dispatch('updateTransaction', result)
            resolve(result)
          } else {
            resolve(false)
          }
        }).catch(() => {
          // the stacks node that services these can be a bit flaky / intermittent
          resolve(false)
        })
      })
    },
    fetchPendingCount ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/transactions-count/' + data.contractId + '/pending/mint-token'
        axios.get(url).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          resolve(new Error('Unable to find token filters: ' + error))
        })
      })
    },
    fetchByContractIdAndFrom ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/transactionsByContractIdAndFrom/' + data.contractId + '/' + data.stxAddress
        axios.get(url).then((response) => {
          const txs = utils.resolveStacksTransactions(configuration.network, response.data)
          resolve(txs)
        }).catch((error) => {
          resolve(new Error('Unable to find token filters: ' + error))
        })
      })
    },
    fetchByFrom ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/transactionsByFrom/' + data.stxAddress
        axios.get(url).then((response) => {
          const txs = utils.resolveStacksTransactions(configuration.network, response.data)
          resolve(txs)
        }).catch((error) => {
          resolve(new Error('Unable to find token filters: ' + error))
        })
      })
    },
    fetchNFTEvents ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/transactions/' + data.contractId + '/' + data.nftIndex
        axios.get(url).then((response) => {
          const txs = utils.resolveStacksTransactions(configuration.network, response.data)
          resolve(txs)
        }).catch((error) => {
          resolve(new Error('Unable to find token filters: ' + error))
        })
      })
    },
    fetchNFTEventsByHash ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/transactionsByAssetHash/' + data.contractId + '/' + data.assetHash
        axios.get(url).then((response) => {
          const txs = utils.resolveStacksTransactions(configuration.network, response.data)
          resolve(txs)
        }).catch((error) => {
          resolve(new Error('Unable to find token filters: ' + error))
        })
      })
    }
  }
}
export default rpayTransactionStore

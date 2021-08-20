import axios from 'axios'
import utils from '@/services/utils'

const rpayTransactionStore = {
  namespaced: true,
  modules: {
  },
  state: {
    transactions: []
  },
  getters: {
    getTransaction: state => txId => {
      if (!txId) return { error: 'invalid transaction id' }
      const index = state.transactions.findIndex((o) => o.tx_id === txId)
      if (index > -1) {
        return state.transactions[index]
      } else {
        return { error: 'transaction not found for id: ' + txId }
      }
    }
  },
  mutations: {
    setTransaction (state, transaction) {
      const index = state.transactions.findIndex((o) => o.tx_id === transaction.tx_id)
      if (index > -1) {
        state.transactions.splice(index, 1, transaction)
      } else {
        state.transactions.splice(0, 0, transaction)
      }
    }
  },
  actions: {
    watchTransactionInfo ({ rootGetters }, txId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const stacksNode = configuration.risidioStacksApi + '/extended/v1/tx/' + txId
        axios.get(stacksNode).then((response) => {
          const txData = response.data
          if (txData && txData.tx_status) {
            const result = {}
            result.txStatus = txData.tx_status
            result.txResult = txData.tx_result
            result.nonce = txData.nonce
            result.opcode = 'stx-transaction-update'
            if (txData.tx_type !== 'token_transfer') {
              result.functionName = txData.contract_call.function_name
              result.timeSent = txData.receipt_time_iso
              result.nftIndex = (txData.tx_status === 'success') ? utils.fromHex(result.functionName, txData.tx_result.repr) : -1
              result.txId = txId
            }
            resolve(result)
          } else {
            resolve(false)
          }
          /**
          axios.post(configuration.risidioBaseApi + '/mesh/v2/register/transaction', result).then(() => {
            commit('setTransaction', result.data)
            resolve(result.data)
          }).catch(() => {
            reject(new Error('Unable watch transaction: ' + txId))
          })
          **/
        }).catch(() => {
          reject(new Error('Unable call stacks node for transaction: ' + stacksNode))
        })
      })
    }
  }
}
export default rpayTransactionStore

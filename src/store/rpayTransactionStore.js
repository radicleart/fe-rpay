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
    readTransactionInfo ({ rootGetters }, txId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const stacksNode = configuration.risidioStacksApi + '/extended/v1/tx/' + txId
        axios.get(stacksNode).then((response) => {
          const txData = response.data
          if (txData && txData.tx_status) {
            const result = {}
            result.txId = txId
            result.txStatus = txData.tx_status
            result.txResult = txData.tx_result
            result.opcode = 'stx-transaction-update'
            if (txData.tx_type !== 'token_transfer') {
              result.contractId = txData.contract_call.contract_id
              result.functionName = txData.contract_call.function_name
              if (txData.tx_result && txData.tx_status !== 'pending') {
                const jsonRes = utils.jsonFromTxResult(txData)
                if (result.functionName.indexOf('mint-') === 0 && jsonRes.success && jsonRes.value.type === 'uint') {
                  result.nftIndex = jsonRes.value.value
                }
              }
            }
            resolve(result)
          } else {
            resolve(false)
          }
        }).catch(() => {
          reject(new Error('Unable call stacks node for transaction: ' + stacksNode))
        })
      })
    }
  }
}
export default rpayTransactionStore

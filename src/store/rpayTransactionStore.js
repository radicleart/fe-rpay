import axios from 'axios'

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
    watchTransactionInfo ({ commit, rootGetters }, txId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const stacksNode = configuration.risidioStacksApi + '/extended/v1/tx/' + txId
        axios.get(stacksNode).then((result) => {
          axios.post(configuration.risidioBaseApi + '/mesh/v2/register/transaction', stacksTransaction).then(() => {
            commit('setTransaction', result.data)
            resolve(result.data)
          }).catch(() => {
            reject(new Error('Unable watch transaction: ' + txId))
          })
        }).catch(() => {
          reject(new Error('Unable call stacks node for transaction: ' + txId))
        })
      })
    }
  }
}
export default rpayTransactionStore

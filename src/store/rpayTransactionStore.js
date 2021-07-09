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
      const index = state.transactions.findIndex((o) => o.tx_id === txId)
      if (index > -1) {
        return state.transactions[index]
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
    fetchTransactionInfo ({ commit }, txId) {
      return new Promise((resolve, reject) => {
        const stacksNode = process.env.VUE_APP_STACKS_API + '/extended/v1/tx/' + txId
        axios.get(stacksNode).then((result) => {
          commit('setTransaction', result.data)
          resolve(result.data)
        }).catch(() => {
          reject(new Error('Address not registered on: ' + process.env.VUE_APP_NETWORK))
        })
      })
    }
  }
}
export default rpayTransactionStore

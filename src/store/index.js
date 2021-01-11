import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

Vue.use(Vuex)
let socket = null
let stompClient = null
const MESH_API = process.env.VUE_APP_RADICLE_API + '/mesh'
const precision = 100000000
const getAmountSat = function (amountBtc) {
  try {
    if (typeof amountBtc === 'string') {
      amountBtc = Number(amountBtc)
    }
    return Math.round(amountBtc * precision)
  } catch {
    return 0
  }
}

const options = [{ text: 'Risidio LSAT', value: 'lsat' }, { text: 'Lightning', value: 'lightning' }, { text: 'Bitcoin', value: 'bitcoin' }, { text: 'Ether', value: 'ethereum' }, { text: 'Stacks', value: 'stacks' }]
const getPaymentOptions = function (configuration) {
  const allowedOptions = []
  options.forEach(function (option) {
    if (option.value === 'lightning') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowLightning) {
        allowedOptions.push({ text: 'Lightning', value: 'lightning' })
      }
    } else if (option.value === 'bitcoin') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowBitcoin) {
        allowedOptions.push({ text: 'Bitcoin', value: 'bitcoin' })
      }
    } else if (option.value === 'lsat') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowLSAT) {
        allowedOptions.push({ text: 'Risidio LSAT', value: 'lsat' })
      }
    } else if (option.value === 'ethereum') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowEthereum) {
        allowedOptions.push({ text: 'Ether', value: 'ethereum' })
      }
    } else if (option.value === 'stacks') {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowStacks) {
        allowedOptions.push({ text: 'Stacks', value: 'stacks' })
      }
    }
  })
  return allowedOptions
}
const subscribeApiNews = function (commit, paymentId) {
  checkPayment(commit, paymentId)
  socket = new SockJS(MESH_API + '/api-news')
  stompClient = Stomp.over(socket)
  stompClient.connect({}, function () {
    stompClient.subscribe('/queue/payment-news-' + paymentId, function (response) {
      const news = JSON.parse(response.body)
      commit('setMiningNews', news)
    })
    stompClient.subscribe('/queue/rates-news', function (response) {
      const news = JSON.parse(response.body)
      commit('setRatesNews', news)
    })
  },
  function (error) {
    console.log(error)
  })
}

const checkPayment = function (commit, paymentId) {
  axios.post(MESH_API + '/v2/checkPayment/' + paymentId).then(response => {
    commit('setResponse', response.data)
  }).catch((error) => {
    console.log(error)
  })
}

export default new Vuex.Store({
  modules: {
  },
  state: {
    xgeRates: null,
    ratesNews: null,
    configuration: null,
    settledInvoice: null,
    invoice: null,
    headers: null,
    displayCard: 0,
    paymentOption: null,
    paymentOptions: []
  },
  getters: {
    getDisplayCard: (state) => {
      return state.displayCard
    },
    getCurrentPaymentOption: (state) => {
      return state.configuration.paymentOption
    },
    getPaymentOptions: state => {
      const paymentOptions = getPaymentOptions(state.configuration)
      return paymentOptions
    },
    getHeaders: state => {
      return state.configuration.authHeaders
    },
    getConfiguration: state => {
      return state.configuration
    },
    getInvoice: state => {
      return state.invoice
    },
    getInvoiceExpired: state => {
      return lsatHelper.lsatExpired(state.invoice)
    },
    getInvoiceExpires: state => {
      return lsatHelper.lsatExpires(state.invoice)
    },
    getInvoiceDuration: state => {
      return lsatHelper.lsatDuration(state.invoice)
    },
    getExchangeRates: state => {
      return state.xgeRates
    },
    getExchangeRate: state => currency => {
      if (!state.xgeRates) {
        return null
      }
      return state.xgeRates.find(item => item.currency === currency)
    }
  },
  mutations: {
    setDisplayCard (state, val) {
      state.displayCard = val
    },
    addConfiguration (state, configuration) {
      state.configuration = configuration
    },
    setPaymentMethod (state, method) {
      state.configuration.payment.method = method
    },
    addPaymentOption (state, o) {
      state.configuration.paymentOption = o
    },
    addPaymentOptions (state, o) {
      state.paymentOptions = getPaymentOptions(state.configuration)
      if (!state.configuration.paymentOption) {
        state.configuration.paymentOption = state.paymentOptions[0].value
      }
    },
    setInvoice (state, invoice) {
      state.invoice = invoice
    },
    setRatesNews (state, ratesNews) {
      state.ratesNews = ratesNews
    },
    setXgeRates (state, xgeRates) {
      state.xgeRates = xgeRates
    }
  },
  actions: {
    initialiseApp ({ state, commit }, configuration) {
      return new Promise((resolve) => {
        axios.get(MESH_API + '/v1/rates-news').then(response => {
          commit('setRatesNews', response.data)
          commit('addConfiguration', configuration)
          commit('addPaymentOptions')
          if (localStorage.getItem('OP_INVOICE')) {
            const savedInvoice = JSON.parse(localStorage.getItem('OP_INVOICE'))
            if (!lsatHelper.lsatExpired(savedInvoice)) {
              commit('setInvoice', savedInvoice)
              subscribeApiNews(commit, savedInvoice.data.id)
              configuration.payment.amountBtc = savedInvoice.data.amount
              commit('addConfiguration', configuration)
              resolve(savedInvoice)
              return
            }
          }
          const rate = state.ratesNews.tickerRates.find((o) => o.currency === configuration.payment.currency)
          const data = {
            amount: getAmountSat((configuration.payment.amountFiat / rate.last)),
            description: (configuration.payment.description) ? configuration.payment.description : 'Donation to project'
          }
          axios.post(MESH_API + '/v2/fetchPayment', data).then(response => {
            const invoice = response.data
            localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
            configuration.payment.amountBtc = invoice.data.amount
            subscribeApiNews(commit, invoice.data.id)
            commit('addConfiguration', configuration)
            commit('setInvoice', invoice)
            resolve(invoice)
          }).catch((error) => {
            console.log(error)
            resolve()
          })
        }).catch((error) => {
          console.log(error)
        })
      })
    },
    stopListening ({ commit }) {
      if (stompClient) stompClient.disconnect()
    }
  }
})

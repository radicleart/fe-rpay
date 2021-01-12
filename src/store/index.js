import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import ethereumStore from './ethereumStore'
import stacksStore from './stacksStore'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

Vue.use(Vuex)
let socket = null
let stompClient = null
const MESH_API = process.env.VUE_APP_RADICLE_API + '/mesh'
const precision = 100000000
const setAmounts = function (tickerRates, configuration) {
  try {
    const rate = tickerRates.find((o) => o.currency === configuration.payment.currency)
    const amountBtc = configuration.payment.amountFiat / rate.last
    configuration.payment.amountBtc = amountBtc
    configuration.payment.amountBtc = Math.round(amountBtc * precision) / precision
    configuration.payment.amountSat = Math.round(amountBtc * precision)
    configuration.payment.amountEth = Math.round((configuration.payment.amountFiat / rate.ethPrice) * precision) / precision
    configuration.payment.amountStx = Math.round((configuration.payment.amountFiat / rate.stxPrice) * precision) / precision
  } catch {
    return 0
  }
}
const getPaymentOptions = function (configuration) {
  const allowedOptions = []
  const options = configuration.paymentOptions
  options.forEach(function (option) {
    if (option.allowLightning) {
      allowedOptions.push({ text: 'Lightning', value: 'lightning', mainOption: configuration.paymentOption === 'lightning' })
    } else if (option.allowBitcoin) {
      allowedOptions.push({ text: 'Bitcoin', value: 'bitcoin', mainOption: configuration.paymentOption === 'bitcoin' })
    } else if (option.allowLSAT) {
      allowedOptions.push({ text: 'Risidio LSAT', value: 'lsat', mainOption: configuration.paymentOption === 'lsat' })
    } else if (option.allowEthereum) {
      allowedOptions.push({ text: 'Ether', value: 'ethereum', mainOption: configuration.paymentOption === 'ethereum' })
    } else if (option.allowStacks) {
      allowedOptions.push({ text: 'Stacks', value: 'stacks', mainOption: configuration.paymentOption === 'stacks' })
    }
  })
  return allowedOptions
}
const subscribeApiNews = function (commit, paymentId) {
  socket = new SockJS(MESH_API + '/api-news')
  stompClient = Stomp.over(socket)
  stompClient.connect({}, function () {
    stompClient.subscribe('/queue/payment-news-' + paymentId, function (response) {
      const news = JSON.parse(response.body)
      commit('setMiningNews', news)
    })
    stompClient.subscribe('/queue/rates-news', function (response) {
      const rates = JSON.parse(response.body)
      commit('setTickerRates', rates.tickerRates)
    })
  },
  function (error) {
    console.log(error)
  })
}

const checkPayment = function (state, commit, paymentId) {
  if (state.timer) {
    clearInterval(state.timer)
  }
  state.timer = setInterval(function () {
    axios.post(MESH_API + '/v2/checkPayment/' + paymentId).then(response => {
      // window.eventBus.$emit('paymentEvent', { opcode: 'crypto-payment-success' })
      const invoice = response.data
      if (invoice.data.status === 'paid' || invoice.data.status === 'processing') {
        clearInterval(state.timer)
        localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
        commit('setInvoice', invoice)
        invoice.opcode = 'crypto-payment-success'
        window.eventBus.$emit('paymentEvent', invoice)
      }
    }).catch((error) => {
      console.log(error)
    })
  }, 3000)
}

export default new Vuex.Store({
  modules: {
    ethereumStore: ethereumStore,
    stacksStore: stacksStore
  },
  state: {
    timer: null,
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
    setCurrentCryptoPaymentOption (state, o) {
      state.configuration.paymentOption = o
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
    setTickerRates (state, tickerRates) {
      state.tickerRates = tickerRates
    },
    setXgeRates (state, xgeRates) {
      state.xgeRates = xgeRates
    }
  },
  actions: {
    initialiseApp ({ state, commit }, configuration) {
      return new Promise((resolve) => {
        axios.get(MESH_API + '/v1/rates/ticker').then(response => {
          commit('setTickerRates', response.data)
          setAmounts(state.tickerRates, configuration)
          commit('addConfiguration', configuration)
          commit('addPaymentOptions')
          if (configuration.payment.forceNew) {
            localStorage.removeItem('OP_INVOICE')
          }
          if (localStorage.getItem('OP_INVOICE')) {
            const savedInvoice = JSON.parse(localStorage.getItem('OP_INVOICE'))
            if (savedInvoice) {
              if (savedInvoice.data.status === 'paid' || savedInvoice.data.status === 'processing') {
                commit('setInvoice', savedInvoice)
                commit('addConfiguration', configuration)
                savedInvoice.opcode = 'crypto-payment-success'
                window.eventBus.$emit('paymentEvent', savedInvoice)
                resolve(savedInvoice)
                return
              }
            }
            if (!lsatHelper.lsatExpired(savedInvoice)) {
              commit('setInvoice', savedInvoice)
              subscribeApiNews(commit, savedInvoice.data.id)
              checkPayment(state, commit, savedInvoice.data.id)
              commit('addConfiguration', configuration)
              resolve(savedInvoice)
              return
            }
          }
          const data = {
            amount: configuration.payment.amountSat,
            description: (configuration.payment.description) ? configuration.payment.description : 'Donation to project'
          }
          axios.post(MESH_API + '/v2/fetchPayment', data).then(response => {
            const invoice = response.data
            localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
            subscribeApiNews(commit, invoice.data.id)
            checkPayment(state, commit, invoice.data.id)
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

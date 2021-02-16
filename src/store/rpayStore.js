// import Vue from 'vue'
// import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

// Vue.use(Vuex)

let socket = null
let stompClient = null
const precision = 100000000
const setAmounts = function (tickerRates, configuration) {
  try {
    let amountFiat = configuration.payment.amountFiat
    if (configuration.payment.allowMultiples) {
      amountFiat = configuration.payment.amountFiat * configuration.creditAttributes.start
    }
    const rate = tickerRates.find((o) => o.currency === configuration.payment.currency)
    const amountBtc = amountFiat / rate.last
    configuration.payment.amountBtc = amountBtc
    configuration.payment.amountBtc = Math.round(amountBtc * precision) / precision
    configuration.payment.amountSat = Math.round(amountBtc * precision)
    configuration.payment.amountEth = Math.round((amountFiat / rate.ethPrice) * precision) / precision
    configuration.payment.amountStx = Math.round((amountFiat / rate.stxPrice) * precision) / precision
    return configuration
  } catch {
    return configuration
  }
}
const getPaymentOptions = function (configuration) {
  const allowedOptions = []
  const options = configuration.paymentOptions
  options.forEach(function (option) {
    if (option.allowLightning) {
      allowedOptions.push({ text: 'Lightning', value: 'lightning', mainOption: configuration.paymentOption === 'lightning' })
    } else if (option.allowFiat) {
      allowedOptions.push({ text: 'Fiat', value: 'fiat', mainOption: configuration.paymentOption === 'fiat' })
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
const subscribeApiNews = function (commit, gatewayUrl, paymentId) {
  socket = new SockJS(gatewayUrl + '/api-news')
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
    axios.post(state.configuration.gatewayUrl + '/v2/checkPayment/' + paymentId).then(response => {
      const invoice = response.data
      if (!invoice.data) return
      if (invoice.data.status === 'paid' || invoice.data.status === 'processing') {
        clearInterval(state.timer)
        localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
        commit('setInvoice', invoice)
        invoice.opcode = 'btc-crypto-payment-success'
        window.eventBus.$emit('paymentEvent', invoice)
      }
    }).catch((error) => {
      console.log(error)
    })
  }, 3000)
}

const rpayStore = {
  namespaced: true,
  // export default new Vuex.Store({
  // modules: {
  // rpayEthereumStore: rpayEthereumStore,
  // rpayStacksStore: rpayStacksStore
  // },
  state: {
    timer: null,
    xgeRates: null,
    ratesNews: null,
    configuration: null,
    settledInvoice: null,
    invoice: null,
    headers: null,
    displayCard: 100,
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
      if (configuration.payment.allowMultiples) {
        if (!configuration.creditAttributes) {
          configuration.creditAttributes = {
            start: 1,
            min: 1,
            max: 10,
            step: 1
          }
        }
      }
      state.configuration = configuration
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
        axios.get(state.configuration.gatewayUrl + '/v1/rates/ticker').then(response => {
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
                savedInvoice.opcode = 'btc-crypto-payment-success'
                window.eventBus.$emit('paymentEvent', savedInvoice)
                resolve(savedInvoice)
                return
              }
            }
            if (!lsatHelper.lsatExpired(savedInvoice)) {
              commit('setInvoice', savedInvoice)
              try {
                subscribeApiNews(commit, configuration.gatewayUrl, savedInvoice.data.id)
              } catch (err) {
                console.log(err)
              }
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
          axios.post(state.configuration.gatewayUrl + '/v2/fetchPayment', data).then(response => {
            const invoice = response.data
            localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
            try {
              subscribeApiNews(commit, configuration.gatewayUrl, invoice.data.id)
            } catch (err) {
              console.log(err)
            }
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
    updateAmount ({ state, commit }, data) {
      localStorage.removeItem('OP_INVOICE')
      let config = state.configuration
      config.creditAttributes.start = data.numbCredits
      config = setAmounts(state.tickerRates, config)
      commit('addConfiguration', config)
      // return this.dispatch('initialiseApp', state.configuration)
    },
    stopListening ({ commit }) {
      if (stompClient) stompClient.disconnect()
    }
  }
}
export default rpayStore

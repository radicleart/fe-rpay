// import Vue from 'vue'
// import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

// Vue.use(Vuex)
let MESH_API = null
let socket = null
let stompClient = null
const precision = 100000000
const setAmounts = function (tickerRates, configuration) {
  try {
    let amountFiat = configuration.payment.amountFiat
    if (configuration.payment.allowMultiples) {
      amountFiat = configuration.payment.amountFiat * configuration.payment.creditAttributes.start
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
  const options = configuration.payment.paymentOptions
  const mainOption = configuration.payment.paymentOption
  options.forEach(function (option) {
    if (option.allowLightning) {
      allowedOptions.push({ text: 'Lightning', value: 'lightning', mainOption: mainOption === 'lightning' })
    } else if (option.allowFiat) {
      allowedOptions.push({ text: 'Fiat', value: 'fiat', mainOption: mainOption === 'fiat' })
    } else if (option.allowBitcoin) {
      allowedOptions.push({ text: 'Bitcoin', value: 'bitcoin', mainOption: mainOption === 'bitcoin' })
    } else if (option.allowLSAT) {
      allowedOptions.push({ text: 'Risidio LSAT', value: 'lsat', mainOption: mainOption === 'lsat' })
    } else if (option.allowEthereum) {
      allowedOptions.push({ text: 'Ether', value: 'ethereum', mainOption: mainOption === 'ethereum' })
    } else if (option.allowStacks) {
      allowedOptions.push({ text: 'Stacks', value: 'stacks', mainOption: mainOption === 'stacks' })
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

const checkPayment = function (resolve, reject, state, commit, paymentId) {
  // if (state.timer) {
  //  clearInterval(state.timer)
  // }
  axios.post(MESH_API + '/v2/checkPayment/' + paymentId).then(response => {
    const invoice = response.data
    if (!invoice.data) return
    if (invoice.data.status === 'paid' || invoice.data.status === 'processing') {
      // clearInterval(state.timer)
      localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
      commit('setInvoice', invoice)
      invoice.opcode = 'btc-crypto-payment-success'
      window.eventBus.$emit('rpayEvent', invoice)
      resolve(invoice)
    }
  }).catch((error) => {
    console.log(error)
  })
  // state.timer = setInterval(function () {
  // }, 30000)
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
    beneficiary: null,
    paymentOption: null,
    paymentOptions: [],
    mintingMessage: null
  },
  getters: {
    getDisplayCard: (state) => {
      return state.displayCard
    },
    getMintingMessage: (state) => {
      return state.mintingMessage
    },
    getEditBeneficiary: (state) => {
      return state.beneficiary
    },
    getPreferredNetwork: (state) => {
      const networkConfig = state.configuration.minter.networks.filter(obj => {
        return obj.network === state.configuration.minter.preferredNetwork
      })[0]
      return networkConfig
    },
    getCurrentPaymentOption: (state) => {
      return state.configuration.payment.paymentOption
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
      if (val !== 100 && val !== 102 && val !== 104 && val !== 106) {
        val = 100
      }
      if (val === 100) {
        if (!state.configuration.payment.allowMultiples) {
          val = 102
        }
      }
      state.displayCard = val
    },
    setEditBeneficiary (state, beneficiary) {
      state.beneficiary = beneficiary
    },
    addConfiguration (state, configuration) {
      if (configuration.risidioCardMode === 'payment-flow') {
        if (configuration.payment.allowMultiples) {
          if (!configuration.payment.creditAttributes) {
            configuration.payment.creditAttributes = {
              start: 1,
              min: 1,
              max: 10,
              step: 1
            }
          }
        }
      }
      state.configuration = configuration
    },
    setMintingMessage (state, o) {
      state.mintingMessage = o
    },
    setPreferredNetwork (state, o) {
      state.configuration.minter.preferredNetwork = o
    },
    setCurrentCryptoPaymentOption (state, o) {
      state.configuration.payment.paymentOption = o
    },
    addPaymentOption (state, o) {
      state.configuration.payment.paymentOption = o
    },
    addPaymentOptions (state, o) {
      state.paymentOptions = getPaymentOptions(state.configuration)
      if (!state.configuration.payment.paymentOption) {
        state.configuration.payment.paymentOption = state.payment.paymentOptions[0].value
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
      return new Promise((resolve, reject) => {
        MESH_API = configuration.risidioBaseApi + '/mesh'
        axios.get(MESH_API + '/v1/rates/ticker').then(response => {
          commit('setTickerRates', response.data)
          setAmounts(state.tickerRates, configuration)
          commit('addConfiguration', configuration)
          this.dispatch('rpayStacksStore/fetchMacsWalletInfo', { root: true })
          commit('addPaymentOptions')
          if (configuration.payment.forceNew) {
            localStorage.removeItem('OP_INVOICE')
          }
          commit('addConfiguration', configuration)
          if (localStorage.getItem('OP_INVOICE')) {
            const savedInvoice = JSON.parse(localStorage.getItem('OP_INVOICE'))
            if (savedInvoice) {
              if (savedInvoice.data.status === 'paid' || savedInvoice.data.status === 'processing') {
                commit('setInvoice', savedInvoice)
                savedInvoice.opcode = 'btc-crypto-payment-success'
                window.eventBus.$emit('rpayEvent', savedInvoice)
                resolve(savedInvoice)
                return
              }
            }
            if (!lsatHelper.lsatExpired(savedInvoice)) {
              commit('setInvoice', savedInvoice)
              try {
                subscribeApiNews(commit, MESH_API, savedInvoice.data.id)
              } catch (err) {
                console.log(err)
              }
              checkPayment(resolve, reject, state, commit, savedInvoice.data.id)
              commit('addConfiguration', configuration)
              resolve(savedInvoice)
              return
            }
          }
          let allowed = configuration.payment.paymentOptions[1].allowBitcoin
          allowed = allowed || configuration.payment.paymentOptions[2].allowLightning
          if (!allowed) {
            resolve({ data: { status: 'unpaid' } })
            return
          }
          const data = {
            amount: configuration.payment.amountSat,
            description: (configuration.payment.description) ? configuration.payment.description : 'Donation to project'
          }
          axios.post(MESH_API + '/v2/fetchPayment', data).then(response => {
            const invoice = response.data
            localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
            try {
              subscribeApiNews(commit, MESH_API, invoice.data.id)
            } catch (err) {
              console.log(err)
            }
            checkPayment(resolve, reject, state, commit, invoice.data.id)
            commit('addConfiguration', configuration)
            commit('setInvoice', invoice)
            resolve(invoice)
          }).catch((error) => {
            console.log(error)
            configuration.payment.paymentOptions[1].allowBitcoin = false
            configuration.payment.paymentOptions[2].allowLightning = false
            commit('addConfiguration', configuration)
            resolve({ data: { status: 'unpaid' } })
          })
        }).catch((error) => {
          console.log(error)
          configuration.payment.paymentOptions[1].allowBitcoin = false
          configuration.payment.paymentOptions[2].allowLightning = false
          commit('addConfiguration', configuration)
          commit('addConfiguration', configuration)
          resolve({ data: { status: 'unpaid' } })
        })
      })
    },
    checkPayment ({ state, commit }) {
      return new Promise((resolve, reject) => {
        if (localStorage.getItem('OP_INVOICE')) {
          const savedInvoice = JSON.parse(localStorage.getItem('OP_INVOICE'))
          if (savedInvoice) {
            if (savedInvoice.data.status !== 'paid' || savedInvoice.data.status !== 'processing') {
              checkPayment(resolve, reject, state, commit, savedInvoice.data.id)
            } else {
              resolve()
            }
          } else {
            resolve()
          }
        } else {
          resolve()
        }
      })
    },
    stopCheckPayment ({ state }) {
      if (state.timer) {
        clearInterval(state.timer)
      }
    },
    updateAmount ({ state, commit }, data) {
      localStorage.removeItem('OP_INVOICE')
      let config = state.configuration
      config.payment.creditAttributes.start = data.numbCredits
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
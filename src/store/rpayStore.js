import lsatHelper from './lsatHelper'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import { APP_CONSTANTS } from '@/app-constants'

// Vue.use(Vuex)
let MESH_API = null
let socket = null
let stompClient = null
const precision = 100000000
const precisionStx = 1000000
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
    configuration.payment.amountStx = Math.round((amountFiat / rate.stxPrice) * precisionStx) / precisionStx
    return configuration
  } catch {
    return configuration
  }
}
const currencyWhiteList = function (currency) {
  return currency === 'CNY' ||
          currency === 'GBP' ||
          currency === 'JPY' ||
          currency === 'EUR' ||
          currency === 'USD'
}
const getPaymentOptions = function (configuration) {
  const allowedOptions = []
  const options = configuration.payment.paymentOptions
  const mainOption = configuration.payment.paymentOption
  options.forEach(function (option) {
    if (option.allowLightning) {
      allowedOptions.push({ disabled: option.disabled, text: 'Lightning', value: 'lightning', mainOption: mainOption === 'lightning' })
    } else if (option.allowFiat) {
      allowedOptions.push({ disabled: option.disabled, text: 'Fiat', value: 'fiat', mainOption: mainOption === 'fiat' })
    } else if (option.allowPaypal) {
      allowedOptions.push({ disabled: option.disabled, text: 'Paypal', value: 'paypal', mainOption: mainOption === 'paypal' })
    } else if (option.allowBitcoin) {
      allowedOptions.push({ disabled: option.disabled, text: 'Bitcoin', value: 'bitcoin', mainOption: mainOption === 'bitcoin' })
    } else if (option.allowLSAT) {
      allowedOptions.push({ disabled: option.disabled, text: 'Risidio LSAT', value: 'lsat', mainOption: mainOption === 'lsat' })
    } else if (option.allowEthereum) {
      allowedOptions.push({ disabled: option.disabled, text: 'Ether', value: 'ethereum', mainOption: mainOption === 'ethereum' })
    } else if (option.allowStacks) {
      allowedOptions.push({ disabled: option.disabled, text: 'Stacks', value: 'stacks', mainOption: mainOption === 'stacks' })
    }
  })
  return allowedOptions
}
const connectApiNews = function (commit, connectUrl, paymentId) {
  if (!socket) socket = new SockJS(connectUrl + '/api-news')
  if (!stompClient) stompClient = Stomp.over(socket)
  stompClient.debug = () => {}
  socket.onclose = function () {
    stompClient.disconnect()
  }
  stompClient.connect({}, function () {
    stompClient.subscribe('/queue/rates-news', function (response) {
      const rates = JSON.parse(response.body)
      commit('setTickerRates', rates.tickerRates)
    })
  },
  function () {
  })
}
const subscribePayment = function (commit, paymentId) {
  if (!socket || !stompClient || !paymentId) return
  stompClient.subscribe('/queue/payment-news-' + paymentId, function (response) {
    const invoice = { data: JSON.parse(response.body) }
    commit('mergePaidCharge', invoice)
    if (invoice && invoice.data) {
      if (invoice.data.status === 'paid' || invoice.data.status === 'processing') {
        invoice.opcode = 'btc-crypto-payment-success'
        window.eventBus.$emit('rpayEvent', invoice)
      }
    }
  })
}

const disconnectApiNews = function () {
  if (socket && stompClient) {
    stompClient.disconnect()
  }
}

const checkPayment = function (resolve, reject, state, commit, paymentId) {
  axios.post(MESH_API + '/v2/checkPayment/' + paymentId).then(response => {
    const invoice = response.data
    if (invoice.data && (invoice.data.status === 'paid' || invoice.data.status === 'processing')) {
      localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
      commit('mergePaidCharge', invoice)
      invoice.opcode = 'btc-crypto-payment-success'
      window.eventBus.$emit('rpayEvent', invoice)
    }
    resolve(invoice)
  }).catch(() => {
    resolve(false)
  })
}

const rpayStore = {
  namespaced: true,
  state: {
    timer: null,
    tickerRates: null,
    configuration: null,
    settledInvoice: null,
    invoice: null,
    headers: null,
    displayCard: 100,
    beneficiary: null,
    paymentOption: null,
    paymentOptions: [],
    beneficiariesCharity: [
      {
        username: 'charity1.btc',
        role: 'Donations',
        email: 'info@charity1.com',
        royalty: 10,
        chainAddress: 'ST18PE05NG1YN7X6VX9SN40NZYP7B6NQY6C96ZFRC'
      },
      {
        username: 'fullerenes.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@fullerenes.com',
        royalty: 10,
        chainAddress: 'STMYA5EANW6C0HNS1S57VX52M0B795HHFDBW2XBE'
      },
      {
        username: 'seller1.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller2.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'ST18PE05NG1YN7X6VX9SN40NZYP7B6NQY6C96ZFRC'
      },
      {
        username: 'seller3.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller4.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller5.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller6.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller7.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      },
      {
        username: 'seller8.id',
        role: 'Sustainability and Carbon Capture',
        email: 'info@seller.com',
        royalty: 10,
        chainAddress: 'STBENNG3VJR8JQVVMRD9AK56GP2WFYDFSG6N1MH7'
      }
    ],
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
    getEnabledNetworks: (state) => {
      const networks = state.configuration.minter.networks.filter(o => o.enabled)
      return networks
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
    isInvoiceExpired: state => invoice => {
      try {
        console.log(state.invoice.data.id === invoice.data.id)
      } catch (err) {
        console.log(invoice)
      }
      return lsatHelper.lsatExpired(invoice)
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
    getExchangeRateFormatted: state => amountStx => {
      if (!state.tickerRates) {
        return null
      }
      const rate = state.tickerRates.find(item => item.currency === 'EUR')
      const priceInEuro = (1 / rate.amountStx) * amountStx
      return rate.symbol + ' ' + (Math.round(priceInEuro * 100) / 100)
    },
    getStxAmountFormatted: () => amountStx => {
      if (!amountStx) {
        return 0
      }
      return (Math.round(amountStx * 10000) / 10000)
    },
    getTickerRates: state => {
      if (!state.tickerRates) return []
      const currencies = state.tickerRates.filter((o) => currencyWhiteList(o.currency))
      return currencies
    },
    getUnfilteredTickerRates: state => {
      if (!state.tickerRates) return []
      return state.tickerRates
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
      if (!configuration.minter.beneficiaries) {
        configuration.minter.beneficiaries = []
      }
      if (configuration.minter.beneficiaries.length === 0) {
        configuration.minter.beneficiaries.splice(0, 2, ...state.beneficiariesCharity)
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
        state.configuration.payment.paymentOption = state.configuration.payment.paymentOptions[0].value
      }
    },
    setInvoice (state, invoice) {
      state.invoice = invoice
    },
    mergePaidCharge (state, charge) {
      if (charge && charge.data) {
        state.invoice.data = Object.assign(state.invoice.data, charge.data)
      }
    },
    setTickerRates (state, tickerRates) {
      state.tickerRates = tickerRates
    }
  },
  actions: {
    cleanup ({ state }) {
      return new Promise((resolve, reject) => {
        disconnectApiNews()
        resolve(null)
      })
    },
    initialiseRates ({ commit }, configuration) {
      return new Promise(() => {
        try {
          MESH_API = configuration.risidioBaseApi + '/mesh'
          axios.get(MESH_API + '/v1/rates/ticker').then(response => {
            connectApiNews(commit, MESH_API)
            commit('setTickerRates', response.data)
          })
        } catch (err) {
        }
      })
    },
    initialisePaymentFlow ({ dispatch, state, commit, rootGetters }, configuration) {
      return new Promise((resolve, reject) => {
        MESH_API = configuration.risidioBaseApi + '/mesh'
        axios.get(MESH_API + '/v1/rates/ticker').then(response => {
          commit('setTickerRates', response.data)
          setAmounts(state.tickerRates, configuration)
          commit('addConfiguration', configuration)
          this.dispatch('rpayStacksStore/fetchMacSkyWalletInfo', { root: true })
          commit('addPaymentOptions')
          if (configuration.payment.forceNew) {
            localStorage.removeItem('OP_INVOICE')
          }
          commit('addConfiguration', configuration)
          if (localStorage.getItem('OP_INVOICE')) {
            const savedInvoice = JSON.parse(localStorage.getItem('OP_INVOICE'))
            if (savedInvoice && (savedInvoice.data.status === 'paid' || savedInvoice.data.status === 'processing')) {
              localStorage.removeItem('OP_INVOICE')
              // commit('setInvoice', savedInvoice)
              // savedInvoice.opcode = 'btc-crypto-payment-prior'
              // window.eventBus.$emit('rpayEvent', savedInvoice)
              // resolve(savedInvoice)
              // return
            } else if (!lsatHelper.lsatExpired(savedInvoice)) {
              commit('setInvoice', savedInvoice)
              try {
                subscribePayment(commit, savedInvoice.data.id)
              } catch (err) {
              }
              checkPayment(resolve, reject, state, commit, savedInvoice.data.id)
              commit('addConfiguration', configuration)
              resolve(savedInvoice)
              return
            }
          }
          const allowed = configuration.payment.paymentOptions.find((o) => o.allowBitcoin) ||
            configuration.payment.paymentOptions.find((o) => o.allowLightning)
          if (!allowed) {
            resolve({ data: { status: 'unpaid' } })
            return
          }
          dispatch('fetchPayment').then((invoice) => {
            localStorage.setItem('OP_INVOICE', JSON.stringify(invoice))
            if (invoice) subscribePayment(commit, invoice.data.id)
            resolve(invoice)
          }).catch(() => {
            resolve(false)
          })
        }).catch(() => {
          configuration.payment.paymentOptions[1].allowBitcoin = false
          configuration.payment.paymentOptions[2].allowLightning = false
          commit('addConfiguration', configuration)
          resolve({ data: { status: 'unpaid' } })
        })
      })
    },
    fetchPayment ({ state, rootGetters, commit }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const data = {
          amount: configuration.payment.amountSat,
          description: (configuration.payment.description) ? configuration.payment.description : 'Stacksmate STX swap'
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(MESH_API + '/v2/fetchPayment', data, authHeaders).then(response => {
          const invoice = response.data
          subscribePayment(commit, invoice.data.id)
          checkPayment(resolve, reject, state, commit, invoice.data.id)
          commit('setInvoice', invoice)
          resolve(invoice)
        }).catch(() => {
          configuration.payment.paymentOptions[1].allowBitcoin = false
          configuration.payment.paymentOptions[2].allowLightning = false
          commit('addConfiguration', configuration)
          resolve({ data: { status: 'unpaid' } })
        })
      })
    },
    checkPayment ({ state, commit }, paymentId) {
      return new Promise((resolve, reject) => {
        checkPayment(resolve, reject, state, commit, paymentId)
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
      // return this.dispatch('initialisePaymentFlow', state.configuration)
    },
    stopListening ({ commit }) {
      if (stompClient) stompClient.disconnect()
    }
  }
}
export default rpayStore

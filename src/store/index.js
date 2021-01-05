import Vue from 'vue'
import Vuex from 'vuex'
import lsatHelper from './lsatHelper'
import axios from 'axios'

Vue.use(Vuex)

const API_PATH = process.env.VUE_APP_RADICLE_API
const RATES_PATH = process.env.VUE_APP_RATES_API
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
const getPaymentOptions = function (paymentChallenge, configuration) {
  const allowedOptions = []
  options.forEach(function (option) {
    if (option.value === 'lightning') { //  && paymentChallenge.lsatInvoice && paymentChallenge.lsatInvoice.paymentHash) {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowLightning) {
        allowedOptions.push({ text: 'Lightning', value: 'lightning' })
      }
    } else if (option.value === 'bitcoin') { //  && paymentChallenge.bitcoinInvoice && paymentChallenge.bitcoinInvoice.bitcoinAddress) {
      if (!configuration.paymentOptions || configuration.paymentOptions.allowBitcoin) {
        allowedOptions.push({ text: 'Bitcoin', value: 'bitcoin' })
      }
    } else if (option.value === 'lsat') { //  && paymentChallenge.bitcoinInvoice && paymentChallenge.bitcoinInvoice.bitcoinAddress) {
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

const updatePaymentChallenge = function (authHeaders, paymentChallenge) {
  return new Promise(resolve => {
    axios.put(API_PATH + '/lsat/v1/payment', paymentChallenge, { headers: authHeaders }).then(response => {
      resolve(response.data)
    })
  })
}

const initPaymentChallenge = function (rates, fiatCurrency, configuration) {
  if (configuration.mode && configuration.mode === 'rpay-crowdfund') {
    return {
      xchange: {}
    }
  }
  const creditAttributes = configuration.creditAttributes
  let amountFiat = creditAttributes.amountFiatFixed
  if (creditAttributes.useCredits) {
    const start = (creditAttributes.start) ? creditAttributes.start : 2
    amountFiat = (creditAttributes.amountFiatPerCredit > 0) ? creditAttributes.amountFiatPerCredit * start : amountFiat
  }
  const rateObject = rates.find(item => item.currency === fiatCurrency)
  let amountBtc = amountFiat * rateObject.last
  amountBtc = Math.round(amountBtc * precision) / precision
  const pc = {
    serviceKey: configuration.serviceKey,
    serviceData: configuration.serviceData,
    serviceStatus: configuration.serviceStatus || -1,
    paymentId: localStorage.getItem('402-payment-id'),
    xchange: {
      numbCredits: creditAttributes.start,
      fiatCurrency: creditAttributes.fiatCurrency,
      amountFiat: amountFiat,
      amountBtc: amountBtc,
      amountSat: getAmountSat(amountBtc),
      amountEth: Math.round((amountFiat * rateObject.amountEth) * precision) / precision,
      amountStx: Math.round((amountFiat * rateObject.amountStx) * precision) / precision
    },
    bitcoinInvoice: {},
    lsatInvoice: {}
  }
  return pc
}

export default new Vuex.Store({
  modules: {
  },
  state: {
    xgeRates: null,
    payload: null,
    fiatCurrency: 'GBP',
    configuration: null,
    settledInvoice: null,
    tempUserId: false,
    invoice: null,
    headers: null,
    paymentChallenge: null,
    displayCard: 0,
    paymentOption: null,
    paymentOptions: []
  },
  getters: {
    getReturnState: state => data => {
      const result = {
        opcode: data.opcode,
        token: (data.token) ? data.token : state.paymentChallenge.lsatInvoice.token,
        status: (data.status) ? data.status : state.paymentChallenge.status,
        numbCredits: state.configuration.creditAttributes.start,
        paymentId: state.paymentChallenge.paymentId
      }
      if (data.opcode === 'lsat-payment-confirmed') {
        result.lsat = lsatHelper.lsat
      }
      return result
    },
    getDisplayCard: (state) => {
      return state.displayCard
    },
    getPayload: (state) => {
      return state.payload
    },
    getCurrentPaymentOption: (state) => {
      return state.configuration.paymentOption
    },
    getPaymentOptions: state => {
      const paymentOptions = getPaymentOptions(state.paymentChallenge, state.configuration)
      return paymentOptions
    },
    getHeaders: state => {
      return state.configuration.authHeaders
    },
    getConfiguration: state => {
      return state.configuration
    },
    getPaymentChallenge: state => {
      return state.paymentChallenge
    },
    getBitcoinAddress: state => {
      return state.paymentChallenge.bitcoinInvoice.bitcoinAddress
    },
    getLsatObject: state => {
      if (!state.paymentChallenge || !state.paymentChallenge.lsatInvoice.token) {
        return
      }
      const macaroon = 'LSAT macaroon="' + state.paymentChallenge.lsatInvoice.token + '"'
      const fullMac = macaroon + ', invoice="' + state.paymentChallenge.lsatInvoice.paymentRequest + '"'
      return fullMac
    },
    getLsatExpired: state => {
      return lsatHelper.lsatExpired(state.paymentChallenge)
    },
    getLsatExpires: state => {
      return lsatHelper.lsatExpires(state.paymentChallenge)
    },
    getLsatDuration: state => {
      return lsatHelper.lsatDuration(state.paymentChallenge)
    },
    getToken: state => {
      const paymentId = localStorage.getItem('402-payment-id')
      const token = localStorage.getItem('402-token-' + paymentId)
      return token
    },
    getFiatCurrency: state => {
      return state.fiatCurrency
    },
    getExchangeRates: state => {
      return state.xgeRates
    },
    getExchangeRate: state => {
      if (!state.xgeRates) {
        return null
      }
      return state.xgeRates.find(item => item.fiatCurrency === state.fiatCurrency)
    }
  },
  mutations: {
    setDisplayCard (state, val) {
      state.displayCard = val
    },
    addPaymentChallenge (state, o) {
      if (!o) {
        o = {
          paymentId: localStorage.getItem('402-payment-id'),
          xchange: state.configuration.value,
          bitcoinInvoice: {},
          lsatInvoice: {}
        }
      }
      if (o.paymentId && o.paymentId !== 'null') {
        localStorage.setItem('402-payment-id', o.paymentId)
      }
      state.paymentChallenge = o
    },
    addPaymentOption (state, o) {
      state.configuration.paymentOption = o
    },
    addPaymentOptions (state, o) {
      state.paymentOptions = getPaymentOptions(state.paymentChallenge, state.configuration)
      if (!state.configuration.paymentOption) {
        state.configuration.paymentOption = state.paymentOptions[0].value
      }
    },
    setXgeRates (state, xgeRates) {
      state.xgeRates = xgeRates
    },
    setFiatCurrency (state, fiatCurrency) {
      state.fiatCurrency = fiatCurrency
    },
    addPayload (state, payload) {
      state.payload = payload
    },
    addPaymentConfig (state, configuration) {
      state.configuration = configuration
    }
  },
  actions: {
    reinitialiseApp ({ commit }, configuration) {
      return new Promise((resolve, reject) => {
        const paymentId = localStorage.getItem('402-payment-id')
        localStorage.removeItem('402-token-' + paymentId)
        localStorage.removeItem('402-payment-id')
        this.dispatch('initialiseApp', configuration).then((thingy) => {
          resolve(thingy)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    initialiseOrders ({ state, commit }, configuration) {
      return new Promise((resolve, reject) => {
        if (!configuration.purchaseEndpoint) {
          configuration.purchaseEndpoint = '/assets/buy-now'
        }
        commit('addPaymentConfig', configuration)
        this.dispatch('fetchRates').then(() => {
          const paymentChallenge = initPaymentChallenge(state.xgeRates, state.fiatCurrency, state.configuration)
          commit('addPaymentChallenge', paymentChallenge)
          configuration.opcode = 'payment'
          commit('addPaymentConfig', configuration)
          if (paymentChallenge.paymentId) {
            lsatHelper.checkPayment(state.paymentChallenge).then((paymentChallenge) => {
              commit('addPaymentChallenge', paymentChallenge)
              commit('addPaymentOptions')
              lsatHelper.startListening(paymentChallenge.paymentId)
              resolve({ tokenAcquired: false, resource: paymentChallenge })
            })
          } else {
            resolve({ tokenAcquired: false, resource: state.paymentChallenge })
          }
        }).catch((err) => {
          reject(err)
        })
      })
    },
    initialiseApp ({ state, commit }, configuration) {
      return new Promise((resolve, reject) => {
        if (!configuration.purchaseEndpoint) {
          configuration.purchaseEndpoint = '/assets/buy-now'
        }
        commit('addPaymentConfig', configuration)
        commit('addPaymentChallenge', initPaymentChallenge(state.xgeRates, state.fiatCurrency, state.configuration))
        lsatHelper.checkPayment(state.paymentChallenge).then((paymentChallenge) => {
          commit('addPaymentChallenge', paymentChallenge)
          if (paymentChallenge.lsatInvoice && paymentChallenge.lsatInvoice.state === 'SETTLED' && paymentChallenge.lsatInvoice.preimage) {
            lsatHelper.storeToken(paymentChallenge.lsatInvoice.preimage, paymentChallenge)
            lsatHelper.tokenChallenge(configuration).then((resource) => {
              resolve({ tokenAcquired: true, resource: resource })
            })
          } else if (paymentChallenge.status > 3) {
            resolve({ tokenAcquired: true })
          } else {
            commit('addPaymentChallenge', paymentChallenge)
            lsatHelper.challenge(paymentChallenge, configuration).then((lsatEnabledPC) => {
              commit('addPaymentOptions')
              if (lsatEnabledPC) {
                commit('addPaymentChallenge', lsatEnabledPC)
                if (lsatEnabledPC.paymentId && lsatEnabledPC.paymentId !== 'null') {
                  lsatHelper.startListening(lsatEnabledPC.paymentId)
                  commit('addPaymentChallenge', lsatEnabledPC)
                }
              }
              resolve({ tokenAcquired: false, resource: state.paymentChallenge })
            })
          }
        })
      })
    },
    tokenChallenge ({ state, commit }) {
      return new Promise((resolve, reject) => {
        lsatHelper.tokenChallenge(state.configuration).then((payload) => {
          resolve({ tokenAcquired: true, resource: payload })
          commit('addPayload', payload)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    deleteExpiredPayment ({ state, commit }) {
      return new Promise((resolve, reject) => {
        lsatHelper.deleteExpiredPayment(state.paymentChallenge.paymentId).then(() => {
          resolve()
        })
      })
    },
    updateAmount ({ state, commit }, data) {
      return new Promise((resolve) => {
        const configuration = state.configuration
        const pc = state.paymentChallenge
        if (!pc.paymentId) {
          return
        }
        configuration.creditAttributes.start = data.numbCredits
        let prec = configuration.creditAttributes.precision
        if (!prec) prec = 1
        const numbCredits = Math.round((data.numbCredits) * prec) / prec
        if (!pc.serviceData) pc.serviceData = {}
        pc.serviceData.numbCredits = numbCredits
        configuration.creditAttributes.start = numbCredits
        updatePaymentChallenge(configuration.authHeaders, pc)
        commit('addPaymentConfig', configuration)
        commit('addPaymentChallenge', pc)
        resolve()
      })
    },
    fetchRates ({ commit }, data) {
      return new Promise((resolve, reject) => {
        axios.get(RATES_PATH + '/mesh/v1/rates/ticker').then(response => {
          commit('setXgeRates', response.data)
          resolve()
        }).catch((error) => {
          console.log(error)
          resolve()
        })
      })
    },
    startListening ({ state }) {
      if (state.paymentChallenge.paymentId && state.paymentChallenge.paymentId !== 'null') {
        lsatHelper.startListening(state.paymentChallenge.paymentId)
      }
    },
    stopListening ({ commit }) {
      lsatHelper.stopListening()
    },
    storePreimage ({ state, commit }, response) {
      return new Promise((resolve, reject) => {
        const token = lsatHelper.storeToken(response.settledInvoice.preimage, state.paymentChallenge)
        resolve(token)
      })
    }
  }
})

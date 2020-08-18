import { Lsat } from 'lsat-js'
import store from '@/store'
import moment from 'moment'
import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import { LSAT_CONSTANTS } from '@/lsat-constants'

const AUTHORIZATION = 'Authorization'
const API_PATH = process.env.VUE_APP_RADICLE_API
let socket = null
let stompClient = null
const headers = function () {
  return store.getters[LSAT_CONSTANTS.GET_HEADERS]
}
const getPurchaseOrder = function (paymentChallenge, configuration) {
  return {
    status: 3,
    serviceKey: configuration.serviceKey,
    serviceData: configuration.serviceData,
    serviceStatus: -1,
    paymentId: paymentChallenge.paymentId,
    memo: 'product-id=' + paymentChallenge.paymentId,
    amountSat: paymentChallenge.xchange.amountSat,
    amountBtc: paymentChallenge.xchange.amountBtc
  }
}
const lsatHelper = {
  startListening (paymentId) {
    socket = new SockJS(API_PATH + '/lsat/ws1/mynews')
    stompClient = Stomp.over(socket)
    stompClient.connect({}, function () {
      stompClient.subscribe('/queue/mynews-' + paymentId, function (response) {
        const paymentChallenge = JSON.parse(response.body)
        store.commit('addPaymentChallenge', paymentChallenge)
      })
    },
    function (error) {
      console.log(error)
    })
  },
  stopListening () {
    if (stompClient) stompClient.disconnect()
  },

  debugLsat (paymentChallenge, header) {
    if (!paymentChallenge.lsatInvoice) {
      console.log('no invoice present')
      return null
    }
    const lsat = Lsat.fromHeader(header)
    // console.log('lsat', lsat)
    // const macaroon = 'LSAT macaroon="' + paymentChallenge.lsatInvoice.token + '"'
    // const fullMac = macaroon + ', invoice="' + paymentChallenge.lsatInvoice.paymentRequest + '"'
    // console.log('fullMac', Lsat.fromHeader(fullMac))
    return lsat
  },
  deleteExpiredPayment (paymentId) {
    return new Promise((resolve) => {
      const request = {
        method: 'delete',
        url: API_PATH + '/lsat/v1/payment/' + paymentId,
        headers: headers()
      }
      axios(request).then(response => {
        resolve(response.data)
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },
  tokenChallenge (configuration) {
    return new Promise((resolve) => {
      // the payment challenge has been fullfilled - fetch the goodies..
      const paymentChallenge = store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      // let token = localStorage.getItem('402-token-' + paymentChallenge.paymentId)
      // const lsat = paymentChallenge.lsatInvoice
      // token = lsat.token + ':' + lsat.preimage
      const macaroon = 'LSAT ' + paymentChallenge.lsatInvoice.token
      const fullMac = macaroon + ':' + paymentChallenge.lsatInvoice.preimage
      const request = {
        method: 'post',
        url: API_PATH + configuration.purchaseEndpoint,
        headers: headers(),
        data: getPurchaseOrder(paymentChallenge, configuration)
      }
      request.headers[AUTHORIZATION] = fullMac
      axios(request).then(response => {
        resolve(response.data)
      }).catch((error) => {
        resolve(error.response.data)
      })
    })
  },
  challenge (paymentChallenge, configuration) {
    return new Promise((resolve, reject) => {
      const now = moment().valueOf()
      const expired = now > paymentChallenge.invoiceExpiry
      if (!expired) {
        resolve(paymentChallenge)
        return
      }

      const request = {
        method: 'post',
        url: API_PATH + configuration.purchaseEndpoint,
        headers: headers(),
        data: getPurchaseOrder(paymentChallenge, configuration)
      }
      request.headers[AUTHORIZATION] = null
      axios(request).then(response => {
        resolve(response.data)
      })
        .catch((error) => {
          if (error.response.status === 402) {
            const paymentChallenge = error.response.data
            paymentChallenge.lsat = lsatHelper.debugLsat(paymentChallenge, error.response.headers['www-authenticate'])
            resolve(paymentChallenge)
          } else {
            console.log('Problem calling endpoint ', error)
            resolve()
          }
        })
    })
  },
  checkPayment (paymentChallenge) {
    return new Promise((resolve) => {
      const token = lsatHelper.getToken(paymentChallenge.paymentId)
      if (token) {
        resolve(token)
        return
      }
      const request = {
        headers: headers()
      }
      if (paymentChallenge.paymentId) {
        request.method = 'get'
        request.url = API_PATH + '/lsat/v1/invoice/' + paymentChallenge.paymentId
      } else {
        request.method = 'post'
        request.url = API_PATH + '/lsat/v1/payment'
        request.data = paymentChallenge
      }
      axios(request).then(response => {
        if (typeof response.data === 'object') {
          resolve(response.data)
        } else {
          request.method = 'post'
          request.url = API_PATH + '/lsat/v1/payment'
          request.data = paymentChallenge
          axios(request).then(response => {
            resolve(response.data)
          })
        }
      })
    })
  },
  lsatExpired (paymentChallenge) {
    if (!paymentChallenge.lsatInvoice || !paymentChallenge.lsatInvoice.paymentHash) {
      return false
    }
    var expiry = paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000
    const expired = moment(expiry).isBefore(moment({}))
    return expired
  },
  lsatExpires (paymentChallenge) {
    var expires = paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000
    return moment(expires).format('YYYY-MM-DD HH:mm')
  },
  lsatDuration (paymentChallenge) {
    if (!paymentChallenge.lsatInvoice || !paymentChallenge.lsatInvoice.paymentHash) {
      return {
        hours: 0, // duration.asHours(),
        minutes: 59,
        seconds: 59
      }
    }
    var expires = moment(paymentChallenge.lsatInvoice.timestamp * 1000 + 3600000)
    var duration = moment.duration(expires.diff(moment({})))
    var timeout = {
      hours: 0, // duration.asHours(),
      minutes: duration._data.minutes,
      seconds: duration._data.seconds
    }
    return timeout
  },
  storeToken (preimage, paymentChallenge) {
    if (!preimage) {
      return
    }
    const lsat = paymentChallenge.lsatInvoice
    const token = lsat.baseMacaroon + ':' + preimage
    localStorage.setItem('402-token-' + paymentChallenge.paymentId, token)
    return token
  },
  getToken (paymentId) {
    const token = localStorage.getItem('402-token-' + paymentId)
    return token
  }
}
export default lsatHelper

import store from '@/store'
import moment from 'moment'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

const API_PATH = process.env.VUE_APP_RADICLE_API
let socket = null
let stompClient = null
const lsatHelper = {
  startListening (paymentId) {
    socket = new SockJS(API_PATH + '/lsat/ws1/mynews')
    stompClient = Stomp.over(socket)
    stompClient.connect({}, function () {
      stompClient.subscribe('/queue/mynews-' + paymentId, function (response) {
        const invoice = JSON.parse(response.body)
        store.commit('addPaymentChallenge', invoice)
      })
    },
    function (error) {
      console.log(error)
    })
  },
  stopListening () {
    if (stompClient) stompClient.disconnect()
  },

  lsatExpired (invoice) {
    if (!invoice || !invoice.data || !invoice.data.lightning_invoice) {
      return false
    }
    var expiry = invoice.data.lightning_invoice.expires_at * 1000 // + 3600000
    const expired = moment(expiry).isBefore(moment({}))
    return expired
  },
  lsatExpires (invoice) {
    if (!invoice || !invoice.data || !invoice.data.lightning_invoice) {
      return moment({})
    }
    var expires = invoice.data.lightning_invoice.expires_at * 1000 // + 3600000
    return moment(expires).format('YYYY-MM-DD HH:mm')
  },
  lsatDuration (invoice) {
    if (!invoice.data || !invoice.data.lightning_invoice) {
      return {
        hours: 0, // duration.asHours(),
        minutes: 59,
        seconds: 59
      }
    }
    var expires = moment(invoice.data.lightning_invoice.expires_at * 1000)
    var duration = moment.duration(expires.diff(moment({})))
    var timeout = {
      hours: 0, // duration.asHours(),
      minutes: duration._data.minutes,
      seconds: duration._data.seconds
    }
    return timeout
  }
}
export default lsatHelper

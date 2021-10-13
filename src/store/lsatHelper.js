import rpayStore from '@/store/rpayStore'
import { Duration, DateTime } from 'luxon'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

let socket = null
let stompClient = null
const lsatHelper = {
  startListening (paymentId) {
    socket = new SockJS('API_PATH' + '/lsat/ws1/mynews')
    stompClient = Stomp.over(socket)
    stompClient.debug = () => {}
    stompClient.connect({}, function () {
      stompClient.subscribe('/queue/mynews-' + paymentId, function (response) {
        const invoice = JSON.parse(response.body)
        rpayStore.commit('addPaymentChallenge', invoice)
      })
    },
    function () {
    })
  },
  stopListening () {
    if (stompClient) stompClient.disconnect()
  },

  lsatExpired (invoice) {
    if (!invoice || !invoice.data || !invoice.data.lightning_invoice) {
      return false
    }
    const expiry = invoice.data.lightning_invoice.expires_at * 1000 // + 3600000
    const now = new Date().getTime()
    const expired = expiry < now
    return expired
  },
  lsatExpires (invoice) {
    if (!invoice || !invoice.data || !invoice.data.lightning_invoice) {
      return new Date().getTime()
    }
    const expires = invoice.data.lightning_invoice.expires_at * 1000 // + 3600000
    return DateTime.fromMillis(expires).format('YYYY-MM-DD HH:mm')
  },
  lsatDuration (invoice) {
    if (!invoice.data || !invoice.data.lightning_invoice) {
      return {
        hours: 0, // duration.asHours(),
        minutes: 59,
        seconds: 59
      }
    }
    const duration = Duration.fromMillis(invoice.data.lightning_invoice.expires_at * 1000)
    const timeout = {
      hours: 0, // duration.asHours(),
      minutes: duration.minutes,
      seconds: duration.seconds
    }
    return timeout
  }
}
export default lsatHelper

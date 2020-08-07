<template v-if="loaded">
<div>
  <div v-if="page === 'invoice'" :key="componentKey">
    <framework-flow :lookAndFeel="lookAndFeel" @paymentEvent="paymentEvent($event)"/>
  </div>
  <div class="" v-else-if="page === 'result'" >
    <result-page :lookAndFeel="lookAndFeel" :result="result" />
  </div>
  <div class="" v-else-if="page === 'token'" >
    <token :token="token" @startOver="startOver"/>
  </div>
  <div class="" v-else >
    <p v-html="message"></p>
  </div>
  <notifications position="top right" width="30%" />
</div>
</template>

<script>
import Vue from 'vue'
import store from './store'
import Notifications from 'vue-notification'
import BootstrapVue from 'bootstrap-vue'
import Token from './views/Token'
import FrameworkFlow from './views/FrameworkFlow'
import ResultPage from './views/ResultPage'
import { LSAT_CONSTANTS } from './lsat-constants'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faCheck, faCamera, faQrcode, faPlus, faMinus, faEquals, faCopy, faAngleDoubleUp, faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCheck)
library.add(faCamera)
library.add(faQrcode)
library.add(faTimes)
library.add(faMinus)
library.add(faPlus)
library.add(faEquals)
library.add(faCopy)
library.add(faAngleDoubleUp)
library.add(faAngleDoubleDown)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(BootstrapVue)
Vue.config.productionTip = false
Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.mixin({ store })

export default {
  name: 'LsatEntry',
  components: {
    Token,
    FrameworkFlow,
    ResultPage
  },
  props: ['paymentConfig'],
  data () {
    return {
      page: 'waiting',
      result: null,
      lookAndFeel: null,
      loaded: false,
      componentKey: 0,
      message: 'Loading invoice data - please wait...'
    }
  },
  watch: {
    paymentChallenge (paymentChallenge, oldInvoice) {
      console.log(`We have ${paymentChallenge} fruits now, yay!`)
      if (!paymentChallenge) {
        return
      }
      if (oldInvoice && paymentChallenge.paymentId === oldInvoice.paymentId && paymentChallenge.status === oldInvoice.status) {
        this.componentKey++
        return
      }
      if (paymentChallenge.status > 3) {
        const data = { opcode: 'lsat-payment-confirmed', status: paymentChallenge.status }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        this.page = 'invoice'
        this.componentKey++
      } else if (paymentChallenge.status === 3) {
        const data = { opcode: 'lsat-payment-begun', status: paymentChallenge.status }
        const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', paymentEvent)
        console.log('paymentEvent', paymentEvent)
      } else {
        const data = {
          opcode: 'lsat-status-change',
          status: (paymentChallenge) ? paymentChallenge.status : -1,
          orderCode: (paymentChallenge) ? paymentChallenge.paymentId : -1,
          token: (paymentChallenge && paymentChallenge.lsatInvoice) ? paymentChallenge.lsatInvoice.token : null
        }
        this.$emit('paymentEvent', data)
        console.log('paymentEvent', data)
      }
    }
  },
  mounted () {
    const paymentConfig = this.parseConfiguration()
    this.lookAndFeel = paymentConfig.lookAndFeel
    if (paymentConfig.paymentId && this.paymentSent(paymentConfig)) {
      const data = { opcode: 'lsat-payment-confirmed' }
      const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
      this.$emit('paymentEvent', paymentEvent)
    } else {
      this.$store.dispatch('initialiseOrders', paymentConfig).then((result) => {
        this.page = 'invoice'
        this.loaded = true
      })
      // this.initialiseApp(paymentConfig)
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  methods: {
    fetchRates: function () {
      this.$store.dispatch('fetchRates').then((rates) => {
        this.$emit('ratesEvent', { opcode: 'rates-result', rates: rates })
      }).catch((e) => {
        console.log('ratesEvent', { opcode: 'rates-error' })
      })
    },
    parseConfiguration: function () {
      let paymentConfig = {}
      if (typeof this.paymentConfig === 'object') {
        paymentConfig = this.paymentConfig
      } else {
        try {
          paymentConfig = JSON.parse(this.paymentConfig)
        } catch {
          paymentConfig = JSON.parse(window.risidioPaymentConfig)
        }
      }
      if (paymentConfig.lookAndFeel) {
        this.lookAndFeel = paymentConfig.lookAndFeel
      }
      return paymentConfig
    },
    paymentSent: function (configuration) {
      const token = this.$store.getters[LSAT_CONSTANTS.KEY_TOKEN]
      if (token) {
        const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
        this.page = 'token'
        const data = { opcode: 'lsat-payment-confirmed', token: token, paymentChallenge: paymentChallenge }
        // const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
        this.$emit('paymentEvent', data)
        return true
      }
    },
    initialiseApp: function (paymentConfig) {
      const methodName = (paymentConfig.paymentId) ? 'initialiseApp' : 'reinitialiseApp'
      this.$store.dispatch(methodName, paymentConfig).then((result) => {
        if (result.tokenAcquired) {
          this.message = 'resource has been acquired. <br/><br/>'
          this.page = 'token'
          const data = { opcode: 'lsat-payment-confirmed' }
          const paymentEvent = this.$store.getters[LSAT_CONSTANTS.KEY_RETURN_STATE](data)
          this.$emit('paymentEvent', paymentEvent)
          console.log('paymentEvent', data)
        } else {
          this.$store.dispatch('startListening')
          this.page = 'invoice'
          this.loaded = true
          this.$emit('paymentEvent', { opcode: 'lsat-payment-loaded' })
          console.log('paymentEvent', { opcode: 'lsat-payment-loaded' })
        }
      })
    },
    paymentEvent: function (data) {
      if (data.opcode === 'lsat-payment-expired') {
        this.paymentExpired()
      } else {
        this.page = 'invoice'
        this.result = data
      }
      this.$emit('paymentEvent', data)
      console.log('paymentEvent', data)
    },
    paymentExpired () {
      this.$store.dispatch('fetchRates')
    },
    startOver () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('reinitialiseApp', configuration).then((resource) => {
        this.page = 'invoice'
      })
    }
  },
  computed: {
    paymentChallenge () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge
    },
    token () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge && paymentChallenge.lsatInvoice) ? paymentChallenge.lsatInvoice.token : {}
    }
  }
}
</script>
<style lang="scss">
</style>

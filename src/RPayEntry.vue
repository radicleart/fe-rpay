<template>
<div v-if="loaded">
  <div class="" v-if="!page" >
    loading
  </div>
  <div class="" v-else-if="page === 'result'" >
    <result-page/>
  </div>
  <div v-else :key="componentKey">
    <framework-flow @paymentEvent="paymentEvent($event)"/>
  </div>
  <notifications position="top right" width="30%" />
</div>
</template>

<script>
import FrameworkFlow from './views/FrameworkFlow'
import ResultPage from './views/ResultPage'
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'RPayEntry',
  components: {
    FrameworkFlow,
    ResultPage
  },
  props: ['paymentConfig'],
  data () {
    return {
      page: null,
      loaded: false,
      componentKey: 0,
      message: 'Loading invoice data - please wait...'
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.$store.dispatch('initialiseApp', configuration).then((invoice) => {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (invoice.data.status === 'paid' || invoice.data.status === 'processing') {
        this.page = 'result'
      } else {
        this.page = configuration.payment.method
      }
      this.loaded = true
    })
    const $self = this
    window.eventBus.$on('paymentEvent', function (data) {
      if (data.opcode === 'crypto-payment-success' || data.opcode === 'fiat-payment-success') {
        $self.page = 'result'
      }
      $self.componentKey += 1
    })
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  methods: {
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
      return paymentConfig
    },
    paymentEvent: function (data) {
      if (data.opcode === 'crypto-payment-expired') {
        this.paymentExpired()
      } else if (data.opcode === 'payment-restart') {
        this.paymentExpired()
      } else if (data.opcode === 'switch-method') {
        this.$store.commit('setPaymentMethod', data.method)
      }
      window.eventBus.$emit('paymentEvent', data)
    },
    prev () {
      let displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      if (displayCard === 102) {
        displayCard = 100
        this.$emit('paymentEvent', { action: 'cancelled' })
      } else if (displayCard === 104) {
        displayCard = 102
      } else {
        displayCard = 100
      }
      this.rangeValue = displayCard
      this.$store.commit('setDisplayCard', displayCard)
    },
    paymentExpired () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('initialiseApp', configuration).then(() => {
        this.componentKey += 1
        this.loaded = true
      })
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/custom.scss";
</style>

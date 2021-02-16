<template>
<div class="d-flex justify-content-center" :key="componentKey">
  <div class="mx-auto">
    <b-card-group class="rpay-card-group">
      <b-card header-tag="header" footer-tag="footer" class="rpay-background">
        <crypto-picker v-if="displayCard === 100" @paymentEvent="paymentEvent($event)"/>
        <div v-else-if="displayCard === 102" :style="offsetTop()">
          <order-info v-if="showOrderInfo" class="pb-5"/>
          <div class="d-flex justify-content-center">
            <img class="rpay-sq-logo" :src="logo()"/>
          </div>
          <div class="d-flex flex-column align-items-center">
            <crypto-options class=""/>
            <crypto-payment-screen @paymentEvent="paymentEvent($event)" stye="position: relative; top: 500px;"/>
          </div>
        </div>
        <token-screen v-else-if="displayCard === 104" @paymentEvent="paymentEvent($event)"/>
        <error-screen v-else @paymentEvent="paymentEvent($event)"/>

      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import ErrorScreen from './screens/ErrorScreen'
import TokenScreen from './screens/TokenScreen'
import CryptoPaymentScreen from './screens/CryptoPaymentScreen'
import CryptoPicker from './screens/CryptoPicker'
import CryptoOptions from '@/views/components/CryptoOptions'
import OrderInfo from '@/views/components/OrderInfo'

export default {
  name: 'FrameworkFlow',
  components: {
    TokenScreen,
    CryptoPaymentScreen,
    CryptoPicker,
    ErrorScreen,
    OrderInfo,
    CryptoOptions
  },
  data () {
    return {
      // logo1: require('@/assets/img/sq-logo.png'),
      // logo2: require('@/assets/img/btc1.jpeg'),
      message: null,
      paying: false,
      componentKey: 0,
      loading: true,
      network: process.env.VUE_APP_NETWORK
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
    if (configuration.payment.allowMultiples && displayCard === 100) {
      this.$store.commit('rpayStore/setDisplayCard', 100)
    } else {
      this.$store.commit('rpayStore/setDisplayCard', 102)
    }
    const $self = this
    window.eventBus.$on('paymentEvent', function (data) {
      if (data.opcode.indexOf('-payment-success') > -1) {
        $self.page = 'result'
      }
      $self.componentKey += 1
    })
    this.loading = false
  },
  methods: {
    paymentEvent: function (data) {
      if (data.opcode === 'crypto-payment-expired') {
        this.paymentExpired()
      } else if (data.opcode === 'payment-restart') {
        this.paymentExpired()
      }
      if (data.opcode.indexOf('-payment-success') > -1) {
        this.page = 'result'
      }
      window.eventBus.$emit('paymentEvent', data)
    },
    prev () {
      let displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      if (displayCard === 102) {
        displayCard = 100
        window.eventBus.$emit('paymentEvent', 'payment-cancelled')
      } else if (displayCard === 104) {
        displayCard = 102
      } else {
        displayCard = 100
      }
      this.rangeValue = displayCard
      this.$store.commit('rpayStore/setDisplayCard', displayCard)
    },
    paymentExpired () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStore/initialiseApp', configuration).then(() => {
        this.componentKey += 1
        this.loaded = true
      })
    },
    logo () {
      let logo = 'sq-logo.png'
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption !== 'fiat') {
        logo = 'opennode.png'
      }
      if (this.network === 'testnet') {
        return 'https://trpay.risidio.com/img/' + logo
      } else {
        return 'https://trpay.risidio.com/img/' + logo
      }
    },
    offsetTop () {
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption !== 'fiat') {
        return '' // 'position:relative; top: 52px;'
      }
      return '' // 'position:relative; top: -60px;'
    }
  },
  computed: {
    background () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.background : ''
    },
    showOrderInfo () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.allowMultiples
    },
    id () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.paymentCode
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

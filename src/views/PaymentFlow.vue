<template>
<div v-if="!loading" class="d-flex justify-content-center" :key="componentKey">
  <div class="mx-auto">
    <b-card-group class="">
      <b-card v-if="page === 'payment-page'" header-tag="header" footer-tag="footer" class="rpay-card">
        <div>
          <crypto-picker v-if="displayCard === 100" @rpayEvent="rpayEvent($event)"/>
          <div v-else-if="displayCard === 102" :style="offsetTop()">
            <order-info v-if="showOrderInfo" class="pb-4"/>
            <div class="d-flex flex-column align-items-center">
              <crypto-options class=""/>
              <crypto-payment-screen @rpayEvent="rpayEvent($event)"/>
            </div>
          </div>
          <result-page :result="'error'" v-else @rpayEvent="rpayEvent($event)"/>
        </div>
        <template v-slot:footer>
          <footer-view :rangeValue="getRangeValue()" @rangeEvent="rangeEvent"/>
        </template>
      </b-card>
      <div v-else>
        <result-page/>
      </div>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import CryptoPaymentScreen from './payment-screens/CryptoPaymentScreen'
import CryptoPicker from './payment-screens/CryptoPicker'
import CryptoOptions from '@/views/components/CryptoOptions'
import OrderInfo from '@/views/components/OrderInfo'
import ResultPage from '@/views/ResultPage'
import FooterView from '@/views/components/FooterView'

export default {
  name: 'PaymentFlow',
  components: {
    FooterView,
    CryptoPaymentScreen,
    CryptoPicker,
    OrderInfo,
    CryptoOptions,
    ResultPage
  },
  data () {
    return {
      page: 'payment-page',
      message: null,
      paying: false,
      componentKey: 0,
      loading: true,
      network: process.env.VUE_APP_NETWORK
    }
  },
  mounted () {
    this.initPayment()
    const $self = this
    window.eventBus.$on('rpayEvent', function (data) {
      if (data.opcode.indexOf('-payment-success') > -1) {
        $self.page = 'payment-result'
        $self.$store.commit('rpayStore/setDisplayCard', 104)
      }
      $self.componentKey += 1
    })
  },
  beforeDestroy () {
    this.$store.dispatch('rpayStore/stopCheckPayment')
  },
  methods: {
    initPayment: function (config) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (configuration.payment.allowMultiples && displayCard === 100) {
        this.$store.commit('rpayStore/setDisplayCard', 100)
      } else {
        this.$store.commit('rpayStore/setDisplayCard', 102)
      }
      this.$store.dispatch('rpayStore/initialiseApp', configuration).then((invoice) => {
        this.page = 'payment-page'
        if (invoice) {
          if (invoice.data && (invoice.data.status === 'paid' || invoice.data.status === 'processing')) {
            this.page = 'payment-result'
            window.eventBus.$emit('rpayEvent', { opcode: 'payment-detected' })
          }
        }
        this.loading = false
      })
    },
    rangeEvent (displayCard) {
      this.$store.commit('rpayStore/setDisplayCard', displayCard)
    },
    getRangeValue () {
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (displayCard === 100) return 0
      else if (displayCard === 102) return 1
      else if (displayCard === 104) return 2
    },
    rpayEvent: function (data) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      if (data.opcode === 'crypto-payment-expired') {
        this.paymentExpired()
      } else if (data.opcode === 'payment-restart') {
        this.paymentExpired()
      }
      if (data.opcode.indexOf('-payment-success') > -1) {
        data.numbCredits = configuration.payment.creditAttributes.start
        this.page = 'result'
      }
      window.eventBus.$emit('rpayEvent', data)
    },
    prev () {
      let displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (displayCard === 102) {
        displayCard = 100
        window.eventBus.$emit('rpayEvent', 'payment-cancelled')
      } else if (displayCard === 104) {
        displayCard = 102
      } else {
        displayCard = 100
      }
      this.rangeValue = displayCard
      this.$store.commit('rpayStore/setDisplayCard', displayCard)
    },
    paymentExpired () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStore/initialiseApp', configuration).then(() => {
        this.componentKey += 1
        this.loading = false
      })
    },
    offsetTop () {
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption !== 'fiat') {
        return '' // 'position:relative; top: 52px;'
      }
      return '' // 'position:relative; top: -60px;'
    }
  },
  computed: {
    showOrderInfo () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.allowMultiples
    },
    displayCard () {
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

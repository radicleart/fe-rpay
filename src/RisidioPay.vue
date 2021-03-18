<template>
<div v-if="loaded" id="rpay-pay-card">
  <div class="" v-if="!risidioCardMode" >
    mode should be one of 'payment-flow' or 'minting-flow'
  </div>
  <div v-else-if="risidioCardMode === 'payment-flow'">
    <payment-flow/>
  </div>
  <div v-else-if="risidioCardMode === 'minting-flow'">
    <minting-flow/>
  </div>
  <div v-else-if="risidioCardMode === 'selling-flow'">
    <selling-flow/>
  </div>
</div>
</template>

<script>
import Vue from 'vue'
import PaymentFlow from './views/PaymentFlow'
import MintingFlow from './views/MintingFlow'
import SellingFlow from './views/SellingFlow'
import rpayStore from './store/rpayStore'
import rpayEthereumStore from './store/rpayEthereumStore'
import rpayStacksStore from './store/rpayStacksStore'

if (!window.eventBus) {
  window.eventBus = new Vue()
}
export default {
  name: 'RisidioPay',
  components: {
    PaymentFlow,
    MintingFlow,
    SellingFlow
  },
  props: ['configuration'],
  data () {
    return {
      loaded: false,
      risidioCardMode: 'mode-payments'
    }
  },
  beforeDestroy () {
    this.$store.dispatch('rpayStore/stopCheckPayment')
    this.$store.dispatch('rpayStore/stopListening')
  },
  mounted () {
    // only register the vuex store modules if not already registered..
    const agetter = this.$store.getters['rpayStore/getDisplayCard']
    if (!agetter) {
      this.$store.registerModule('rpayEthereumStore', rpayEthereumStore)
      this.$store.registerModule('rpayStacksStore', rpayStacksStore)
      this.$store.registerModule('rpayStore', rpayStore)
    }
    // parse and store the main configuration object
    let configuration = this.configuration
    if (!configuration) {
      configuration = this.parseConfiguration()
    }
    const lf = (configuration.lookAndFeel) ? configuration.lookAndFeel : this.defLF()
    if (!lf.variant) lf.variant = 'warning'
    if (!lf.variant1) lf.variant1 = 'danger'
    if (!lf.variant2) lf.variant2 = 'info'
    Vue.prototype.$globalLookAndFeel = lf
    this.risidioCardMode = configuration.risidioCardMode
    this.$store.commit('rpayStore/addConfiguration', configuration)
    this.$store.commit('rpayStore/setDisplayCard', 100) // initial screen for each flow.
    this.loaded = true
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
    defLF: function () {
      return {
        labels: {
          numberUnits: 'How many items?',
          orderMsg: 'Place order for \'STX to Lightning\' select number required and pay.',
          successMsg: 'Your order has been received with thanks.',
          title: 'dsfsfsdf',
          subtitle: 'Republic of Movies',
          card1Label: 'Select amount to send',
          card2Label2: 'Select operation',
          card2Label3: 'Make Payment',
          card2Label4: 'Open Channel',
          button1Label: 'Back',
          button2Label: 'Next',
          quantityLabel: 'Tokens'
        }
      }
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
@import '~vue-datetime/dist/vue-datetime.css'

</style>

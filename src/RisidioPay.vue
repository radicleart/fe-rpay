<template>
<div class="" v-if="loaded" id="rpay-pay-card">
    <div class="col-12" v-if="risidioCardMode === 'payment-flow'">
      <payment-flow />
    </div>
    <div class="col-12" v-else-if="risidioCardMode === 'minting-flow'">
      <minting-flow/>
    </div>
    <div class="col-12" v-else-if="risidioCardMode === 'selling-flow'">
      <selling-flow v-if="configured" :gaiaAsset="gaiaAsset"/>
    </div>
    <div class="col-12" v-else-if="risidioCardMode === 'purchase-flow'">
      <purchase-flow v-if="configured" :gaiaAsset="gaiaAsset"/>
    </div>
  <div class="col-12 text-white" v-if="showDebug">
    <debug-flow/>
  </div>
</div>
</template>

<script>
import Vue from 'vue'
import DebugFlow from './views/debug-screens/DebugFlow'
import PaymentFlow from './views/PaymentFlow'
import MintingFlow from './views/MintingFlow'
import SellingFlow from './views/SellingFlow'
import PurchaseFlow from './views/PurchaseFlow'
import rpayStore from './store/rpayStore'
import rpaySearchStore from '@/store/rpaySearchStore'
import rpayEthereumStore from './store/rpayEthereumStore'
import rpayAuthStore from './store/rpayAuthStore'
import rpayCategoryStore from './store/rpayCategoryStore'
import rpayStacksContractStore from './store/rpayStacksContractStore'
import rpayStacksStore from './store/rpayStacksStore'
import rpayPurchaseStore from './store/rpayPurchaseStore'
import { APP_CONSTANTS } from '@/app-constants'

if (!window.eventBus) {
  window.eventBus = new Vue()
}
export default {
  name: 'RisidioPay',
  components: {
    PaymentFlow,
    MintingFlow,
    SellingFlow,
    PurchaseFlow,
    DebugFlow
  },
  props: ['configuration'],
  data () {
    return {
      configured: false,
      loaded: false,
      showDebug: false,
      risidioCardMode: 'mode-payments'
    }
  },
  beforeDestroy () {
    // this.$store.dispatch('rpayStacksContractStore/cleanup')
    // this.$store.dispatch('rpayStore/cleanup')
  },
  mounted () {
    let configuration = this.configuration
    if (!configuration) {
      configuration = this.parseConfiguration()
    }
    // only register the vuex store modules if not already registered..
    const urlParams = new URLSearchParams(window.location.search)
    const showDebug = urlParams.get('debug')
    this.showDebug = showDebug === 'true'
    const agetter = this.$store.getters['rpayStore/getDisplayCard']
    if (!agetter) {
      this.$store.registerModule('rpaySearchStore', rpaySearchStore)
      this.$store.registerModule('rpayEthereumStore', rpayEthereumStore)
      this.$store.registerModule('rpayAuthStore', rpayAuthStore)
      this.$store.registerModule('rpayCategoryStore', rpayCategoryStore)
      this.$store.registerModule('rpayStacksStore', rpayStacksStore)
      this.$store.registerModule('rpayPurchaseStore', rpayPurchaseStore)
      this.$store.registerModule('rpayStacksContractStore', rpayStacksContractStore)
      this.$store.registerModule('rpayStore', rpayStore)
      this.$store.commit('rpayStore/addConfiguration', configuration)
    }
    this.$store.dispatch('rpayStacksContractStore/fetchContractData', configuration).then(() => {
      this.configured = true
    })
    // parse and store the main configuration object
    const lf = (configuration.lookAndFeel) ? configuration.lookAndFeel : this.defLF()
    if (!lf.variant) lf.variant = 'warning'
    if (!lf.variant1) lf.variant1 = 'danger'
    if (!lf.variant2) lf.variant2 = 'info'
    Vue.prototype.$globalLookAndFeel = lf
    this.risidioCardMode = configuration.risidioCardMode
    this.$store.commit('rpayStore/addConfiguration', configuration)
    this.$store.commit('rpayStore/setDisplayCard', 100) // initial screen for each flow.
    this.$store.dispatch('rpayStore/initialiseWebsockets', configuration)
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.loaded = true
    }).catch(() => {
      // error here just means blockchain not running - can ignore and continue.
    })
    this.loaded = true
    if (!agetter) {
      window.eventBus.$emit('rpayEvent', { opcode: 'configured' })
    }
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
    gaiaAsset () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.gaiaAsset
    },
    loginRequired () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return configuration.loginRequired > 0 && !profile.loggedIn
    }
  }
}
</script>
<style lang="scss" scoped>
@import '~vue-datetime/dist/vue-datetime.css'

</style>

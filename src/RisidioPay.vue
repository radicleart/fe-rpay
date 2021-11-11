<template>
<div class="text-white">
</div>
</template>

<script>
import Vue from 'vue'
import rpayStore from './store/rpayStore'
import rpaySearchStore from '@/store/rpaySearchStore'
import rpayAuthStore from './store/rpayAuthStore'
import rpayMyItemStore from './store/rpayMyItemStore'
import rpayCategoryStore from './store/rpayCategoryStore'
import rpayTransactionStore from './store/rpayTransactionStore'
import rpayPrivilegeStore from './store/rpayPrivilegeStore'
import rpayStacksContractStore from './store/rpayStacksContractStore'
import rpayStacksStore from './store/rpayStacksStore'
import rpayPurchaseStore from './store/rpayPurchaseStore'
import rpayProjectStore from './store/rpayProjectStore'
import rpayProfileStore from './store/rpayProfileStore'
// import { hexToCV, cvToJSON } from '@stacks/transactions'
// import rpayEthereumStore from './store/rpayEthereumStore'
// const rpayEthereumStore = () => import(/* webpackChunkName: "rpayEthereumStore" */ '@/views/Index.vue')

if (!window.eventBus) {
  window.eventBus = new Vue()
}
export default {
  name: 'RisidioPay',
  components: {
  },
  props: ['configuration'],
  data () {
    return {
      configured: false,
      loaded: false
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
    const agetter = this.$store.getters['rpayStore/getDisplayCard']
    if (!agetter) {
      this.$store.registerModule('rpaySearchStore', rpaySearchStore)
      // this.$store.registerModule('rpayEthereumStore', rpayEthereumStore)
      this.$store.registerModule('rpayAuthStore', rpayAuthStore)
      this.$store.registerModule('rpayMyItemStore', rpayMyItemStore)
      this.$store.registerModule('rpayTransactionStore', rpayTransactionStore)
      this.$store.registerModule('rpayPrivilegeStore', rpayPrivilegeStore)
      this.$store.registerModule('rpayCategoryStore', rpayCategoryStore)
      this.$store.registerModule('rpayStacksStore', rpayStacksStore)
      this.$store.registerModule('rpayPurchaseStore', rpayPurchaseStore)
      this.$store.registerModule('rpayProjectStore', rpayProjectStore)
      this.$store.registerModule('rpayProfileStore', rpayProfileStore)
      this.$store.registerModule('rpayStacksContractStore', rpayStacksContractStore)
      this.$store.registerModule('rpayStore', rpayStore)
      this.$store.commit('rpayStore/addConfiguration', configuration)
    }
    // this.$store.dispatch('rpayStacksContractStore/fetchContractDataFirstEditions').then(() => {
    this.configured = true
    this.$store.commit('rpayStore/addConfiguration', configuration)
    this.$store.commit('rpayStore/setDisplayCard', 100) // initial screen for each flow.
    this.$store.dispatch('rpayStore/initialiseRates', configuration)
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.loaded = true
    }).catch(() => {
      // error here just means blockchain not running - can ignore and continue.
    })
    this.loaded = true
    if (!agetter) {
      window.eventBus.$emit('rpayEvent', { opcode: 'configured' })
    }
    // })
  },
  methods: {
    deserThis () {
      // return cvToJSON(hexToCV(this.serialed))
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
      return paymentConfig
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

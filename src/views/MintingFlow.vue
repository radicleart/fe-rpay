<template>
<div class="d-flex justify-content-center" v-if="!loading">
  <div class="mx-auto">
    <royalty-screen v-if="!isMinted && displayCard === 100"/>
    <add-beneficiary-screen v-if="!isMinted && displayCard === 102"/>
    <pending-screen v-if="!isMinted && displayCard === 104"/>
    <success-screen v-if="isMinted || displayCard === 106"/>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import SuccessScreen from './minting-screens/SuccessScreen'
import PendingScreen from './minting-screens/PendingScreen'
import RoyaltyScreen from './minting-screens/RoyaltyScreen'
import AddBeneficiaryScreen from './minting-screens/AddBeneficiaryScreen'

export default {
  name: 'MintingFlow',
  components: {
    RoyaltyScreen,
    PendingScreen,
    SuccessScreen,
    AddBeneficiaryScreen
  },
  data () {
    return {
      loading: true
    }
  },
  mounted () {
    this.setPage()
    const $self = this
    window.eventBus.$on('rpayEvent', function (data) {
      if (data.opcode.indexOf('-mint-success') > -1) {
        $self.$store.commit('rpayStore/setDisplayCard', 106)
      }
    })
  },
  methods: {
    setPage () {
      this.loading = false
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (!displayCard) {
        this.$store.commit('rpayStore/setDisplayCard', 100)
      }
    }
  },
  computed: {
    isMinted () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const assetHash = configuration.gaiaAsset.assetHash
      const asset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](assetHash)
      return asset
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

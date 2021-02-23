<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto">
    <royalty-screen v-if="displayCard === 100"/>
    <add-beneficiary-screen v-if="displayCard === 102"/>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import RoyaltyScreen from './minting-screens/RoyaltyScreen'
import AddBeneficiaryScreen from './minting-screens/AddBeneficiaryScreen'

export default {
  name: 'MintingFlow',
  components: {
    RoyaltyScreen,
    AddBeneficiaryScreen
  },
  data () {
    return {
    }
  },
  mounted () {
    this.$store.dispatch('rpayStacksStore/fetchMacsWalletInfo')
    const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
    if (!displayCard) {
      this.$store.commit('rpayStore/setDisplayCard', 100)
    }
  },
  methods: {
  },
  computed: {
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

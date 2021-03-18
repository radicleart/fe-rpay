<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto" v-if="!loading">
    <royalty-screen v-if="displayCard === 100"/>
    <add-beneficiary-screen v-if="displayCard === 102"/>
    <pending-screen v-if="displayCard === 104"/>
    <success-screen v-if="displayCard === 106"/>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
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
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.setPage()
      this.lookupNftTokenId()
    }).catch(() => {
      this.setPage()
    })
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
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      if (!displayCard) {
        this.$store.commit('rpayStore/setDisplayCard', 100)
      }
    },
    lookupNftTokenId: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[LSAT_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupNftTokenId', { assetHash: configuration.minter.item.assetHash, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        console.log(result)
        if (result.nftIndex >= 0) {
          result.message = 'Item #' + result.nftIndex + ' has been minted to your Stacks wallet'
          this.$store.commit(LSAT_CONSTANTS.SET_MINTING_MESSAGE, result, { root: true })
          this.$store.commit(LSAT_CONSTANTS.SET_DISPLAY_CARD, 106, { root: true })
          window.eventBus.$emit('rpayEvent', result)
        }
      })
    }
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

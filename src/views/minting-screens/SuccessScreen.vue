<template>
<b-card-group class="">
  <b-card header-tag="header" footer-tag="footer" class="rpay-card">
  <b-card-text class="border-bottom d-flex justify-content-center">
    <img height="100%" width="100%" :src="logoDone"/>
  </b-card-text>
  <b-card-text class="text-center mx-4">
    <div class="mb-4 text-two text-success"><b-icon width="4em" height="4em" scale="1" icon="check-circle"></b-icon></div>
    <h2 class="text-h2 mb-3" v-html="getPendingMessage"></h2>
    <p class="mt-4 text-bold text-small">Thanks for coming!</p>
  </b-card-text>
  <template v-slot:footer>
    <div class="footer-container">
      <div>
        <div class="d-flex justify-content-center">
          <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="backData()">Back to the App</b-button>
        </div>
      </div>
    </div>
  </template>
  </b-card>
</b-card-group>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'PendingScreen',
  components: {
  },
  data () {
    return {
      pendingMessage: 'Minting token - please sit tight',
      errorMessage: null,
      mintedMessage: null,
      logoDone: 'https://images.prismic.io/risidio-journal/bf9dce36-1caf-49e3-832c-d6877ac136a7_mint_success.png?auto=compress,format'
    }
  },
  mounted () {
  },
  methods: {
    backData: function () {
      this.$store.commit('rpayStore/setDisplayCard', 100)
    }
  },
  computed: {
    getPendingMessage () {
      const preferredNetwork = this.$store.getters[LSAT_CONSTANTS.KEY_PREFERRED_NETWORK]
      let message = 'Minting on Stacks network can take some time - please keep this tab open so we can moniter progress.'
      if (preferredNetwork.network === 'ethereum') {
        message = 'Minting on ethereum can take a few minutes'
      }
      const mintingObject = this.$store.getters[LSAT_CONSTANTS.KEY_MINTING_MESSAGE]
      if (mintingObject && mintingObject.message) {
        message = mintingObject.message
      }
      return message
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

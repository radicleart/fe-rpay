<template>
<b-card-group class="">
  <b-card header-tag="header" footer-tag="footer" class="rpay-card">
    <header-screen :allowEdit="false" :errorMessage="errorMessage" :mintedMessage="mintedMessage"/>
    <b-card-text class="mx-4 text-center border-bottom">
      <div>
        <img width="100%" src="https://images.prismic.io/risidio-journal/c824b73a-908b-402d-8ee9-b21c297e734e_vector-creator+%288%29%402x.png?auto=compress,format"/>
      </div>
      <div class="">
        <div class="mb-auto">
          <div class="text-danger mb-3 text-bold" v-html="getPendingMessage"></div>
        </div>
      </div>
    </b-card-text>
    <template v-slot:footer>
      <div class="footer-container">
        <div>
          <div class="d-flex justify-content-center">
            <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="backData()">Back</b-button>
          </div>
        </div>
      </div>
    </template>
  </b-card>
</b-card-group>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import HeaderScreen from './HeaderScreen'

export default {
  name: 'PendingScreen',
  components: {
    HeaderScreen
  },
  data () {
    return {
      pendingMessage: 'Minting token - please sit tight',
      errorMessage: null,
      mintedMessage: null
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
      const message = 'Minting on Stacks network can take some time - please keep this tab open so we can moniter progress.'
      // const mintingObject = this.$store.getters[LSAT_CONSTANTS.KEY_MINTING_MESSAGE]
      // if (mintingObject && mintingObject.message) {
      //  message = mintingObject.message
      // }
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

<template>
<div class="mx-5 d-flex justify-content-center" v-if="!loading">
  <div class="mx-auto">
    <b-card-group class="" :key="componentKey">
      <b-card header-tag="header" footer-tag="footer" class="rpay-card" v-if="minted">
        <selling-header :allowEdit="true"/>
        <selling-options v-if="displayCard === 100"/>
        <div class="text-center">
          <div class="text-danger" v-html="errorMessage"></div>
          <div class="text-info" v-html="sellingMessage"></div>
        </div>
        <template v-slot:footer>
          <div class="footer-container">
            <div>
              <div class="d-flex justify-content-between">
                <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="back()">Back</b-button>
                <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="setTradeInfo()">Save</b-button>
              </div>
            </div>
          </div>
        </template>
      </b-card>
      <b-card header-tag="header" footer-tag="footer" class="rpay-card" v-else>
        <div class="mt-5 mx-5 text-center">
          <div class="text-danger">Please mint this item before setting up sale information</div>
        </div>
        <template v-slot:footer>
          <div class="footer-container">
            <div>
              <div class="d-flex justify-content-between">
                <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="back()">Back</b-button>
                <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="setTradeInfo()">Save</b-button>
              </div>
            </div>
          </div>
        </template>
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import SellingOptions from './selling-screens/SellingOptions'
import SellingHeader from './selling-screens/SellingHeader'
// import moment from 'moment'

export default {
  name: 'SellingFlow',
  components: {
    SellingOptions,
    SellingHeader
  },
  data () {
    return {
      minted: false,
      componentKey: 0,
      errorMessage: null,
      sellingMessage: null,
      loading: true
    }
  },
  mounted () {
    this.errorMessage = null
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.$store.commit('setModalMessage', '')
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupTokenByHash', { assetHash: configuration.minter.item.assetHash, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        this.loading = false
        if (result && result.nftIndex >= 0) {
          this.minted = true
          console.log(result)
          configuration.minter.item = Object.assign(configuration.minter.item, result)
          this.$store.commit('rpayStore/addConfiguration', configuration)
          this.$store.commit('rpayStore/setDisplayCard', 100)
          this.loading = false
        }
      })
    }).catch(() => {
      this.loading = false
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
    back: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.opcode = 'save-selling-data'
      window.eventBus.$emit('rpayEvent', configuration)
    },
    setTradeInfo () {
      this.errorMessage = null
      if (!this.isValid()) return
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]

      const asset = {
        assetHash: configuration.minter.item.assetHash,
        nftIndex: configuration.minter.item.nftIndex,
        tradeInfo: configuration.minter.item.tradeInfo,
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName
      }
      if (typeof configuration.minter.item.nftIndex === 'undefined') {
        this.errorMessage = 'This item isn\'t registered on-chain.'
        return
      }
      this.sellingMessage = 'Calling wallet to sign and send... transactions can take a few minutes to confirm!'
      this.$store.dispatch('rpayStacksStore/setTradeInfo', asset).then((result) => {
        this.result = result
        this.sellingMessage = 'Transaction sent! Check the explorer for progress - people will be able to buy this item once it completes!'
      }).catch((error) => {
        console.log(error)
        this.sellingMessage = null
        this.errorMessage = 'There was an error setting trade info'
      })
    },
    isValid: function () {
      this.errorMessage = null
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      if (tradeInfo.saleType === 2) {
        if (!tradeInfo.biddingEndTime) {
          this.errorMessage = 'Please select end time for for bidding'
          return false
        }
        if (!tradeInfo.incrementPrice || tradeInfo.incrementPrice < 0) {
          this.errorMessage = 'Please enter the increment for bidding'
          return false
        }
        if (!tradeInfo.buyNowOrStartingPrice || tradeInfo.buyNowOrStartingPrice < 0) {
          this.errorMessage = 'Please enter the buy now / starting price for bidding'
          return false
        }
        if (!tradeInfo.reservePrice || tradeInfo.reservePrice < 0) {
          this.$notify({ type: 'error', title: 'Reserve Price', text: 'Please enter the reserve.' })
          this.errorMessage = 'Please enter the reserve for this item'
          return false
        }
      } else if (tradeInfo.saleType === 1) {
        if (!tradeInfo.buyNowOrStartingPrice || tradeInfo.buyNowOrStartingPrice < 0) {
          this.errorMessage = 'Please enter the buy now / starting price for bidding'
          return false
        }
      }
      return true
    },
    setPage () {
      this.loading = false
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (!displayCard) {
        this.$store.commit('rpayStore/setDisplayCard', 100)
      }
    }
  },
  computed: {
    tradeInfo () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      return tradeInfo
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

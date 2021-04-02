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
<div v-else>
  Asset not passed.
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
      if (!configuration.gaiaAsset) {
        const asset = this.$store.getters[APP_CONSTANTS.GET_ASSET_FROM_CONTRACT_BY_HASH](configuration.minter.item.assetHash)
        configuration.gaiaAsset = asset
      }
      this.$store.commit('rpayStore/addConfiguration', configuration)
      this.$store.commit('rpayStore/setDisplayCard', 100)
      this.loading = false
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
    minted () {
      return this.configuration.gaiaAsset && this.configuration.gaiaAsset.token && this.configuration.gaiaAsset.token.nftIndex > -1
    },
    setTradeInfo () {
      this.errorMessage = null
      if (!this.isValid()) return
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]

      const asset = {
        assetHash: configuration.minter.item.assetHash,
        nftIndex: configuration.minter.item.nftIndex,
        saleData: configuration.minter.item.saleData,
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
      const saleData = configuration.minter.item.saleData
      if (saleData.saleType === 2) {
        if (!saleData.biddingEndTime) {
          this.errorMessage = 'Please select end time for for bidding'
          return false
        }
        if (!saleData.incrementPrice || saleData.incrementPrice < 0) {
          this.errorMessage = 'Please enter the increment for bidding'
          return false
        }
        if (!saleData.buyNowOrStartingPrice || saleData.buyNowOrStartingPrice < 0) {
          this.errorMessage = 'Please enter the buy now / starting price for bidding'
          return false
        }
        if (!saleData.reservePrice || saleData.reservePrice < 0) {
          this.$notify({ type: 'error', title: 'Reserve Price', text: 'Please enter the reserve.' })
          this.errorMessage = 'Please enter the reserve for this item'
          return false
        }
      } else if (saleData.saleType === 1) {
        if (!saleData.buyNowOrStartingPrice || saleData.buyNowOrStartingPrice < 0) {
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
    saleData () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const saleData = configuration.minter.item.saleData
      return saleData
    },
    configuration () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration
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

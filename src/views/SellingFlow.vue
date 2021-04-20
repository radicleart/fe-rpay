<template>
<div class="mx-5 d-flex justify-content-center" v-if="!loading">
  <div class="mx-auto">
    <b-card-group class="" :key="componentKey">
      <b-card header-tag="header" footer-tag="footer" class="rpay-card" v-if="minted">
        <selling-header :allowEdit="true"/>
        <selling-options v-if="displayCard === 100" @updateSaleDataInfo="updateSaleDataInfo"/>
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
              <div class="d-flex justify-content-end">
                <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="back()">Back</b-button>
              </div>
            </div>
          </div>
        </template>
      </b-card>
    </b-card-group>
  </div>
</div>
<div v-else>
  Waiting for asset.
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import SellingOptions from './selling-screens/SellingOptions'
import SellingHeader from './selling-screens/SellingHeader'

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
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
    configuration.gaiaAsset.saleData = contractAsset.saleData
    // configuration.gaiaAsset.saleData.buyNowOrStartingPrice = utils.fromMicroAmount(configuration.gaiaAsset.saleData.buyNowOrStartingPrice)
    // configuration.gaiaAsset.saleData.incrementPrice = utils.fromMicroAmount(configuration.gaiaAsset.saleData.incrementPrice)
    // configuration.gaiaAsset.saleData.reservePrice = utils.fromMicroAmount(configuration.gaiaAsset.saleData.reservePrice)

    this.$store.commit('rpayStore/addConfiguration', configuration)
    this.$store.commit('rpayCategoryStore/setModalMessage', '')
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.$store.commit('rpayStore/setDisplayCard', 100)
      this.loading = false
    }).catch(() => {
      this.loading = false
      this.setPage()
    })
  },
  methods: {
    back: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.opcode = 'save-selling-data'
      window.eventBus.$emit('rpayEvent', configuration)
    },
    minted () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      return contractAsset
    },
    setTradeInfo () {
      this.errorMessage = null
      if (!this.isValid()) return
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      const network = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const data = {
        contractAddress: network.contractAddress,
        contractName: network.contractName,
        owner: contractAsset.owner,
        assetHash: configuration.gaiaAsset.assetHash,
        nftIndex: contractAsset.nftIndex,
        saleData: configuration.gaiaAsset.saleData
      }
      this.sellingMessage = 'Calling wallet to sign and send... transactions can take a few minutes to confirm!'
      this.$store.dispatch('rpayStacksStore/setTradeInfo', data).then((result) => {
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
      const saleData = configuration.gaiaAsset.saleData
      if (saleData.saleType < 0 || saleData.saleType > 3) {
        this.errorMessage = 'Sale type outside of allowed range'
        return false
      }
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
    },
    updateSaleDataInfo (data) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const saleDataTemp = configuration.gaiaAsset.saleData
      if (data.moneyField) {
        saleDataTemp[data.field] = data.value
      } else {
        saleDataTemp[data.field] = parseInt(data.value)
      }
      if (this.isValid()) {
        configuration.gaiaAsset.saleData = saleDataTemp
        this.$store.commit('rpayStore/addConfiguration', configuration)
      }
    }
  },
  computed: {
    saleData () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      const saleData = gaiaAsset.saleData
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

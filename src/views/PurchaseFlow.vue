<template>
<div class="mx-auto rpay-purchase-card d-flex justify-content-center" v-if="!loading">
  <div class="" v-if="minted">
    <purchase-offer-amount :offerData="offerData" v-if="gaiaAsset.saleData.saleType === 3 && offerStage === 0" @collectEmail="collectEmail"/>
    <purchase-offer-email :offerData="offerData" v-else-if="gaiaAsset.saleData.saleType === 3 && offerStage === 1" @backStep="backStep" @makeOffer="makeOffer"/>
    <div class="text-danger" v-html="errorMessage"></div>
  </div>
  <div header-tag="header" footer-tag="footer" class="rpay-purchase-card" v-else>
    <div class="mt-5 mx-5 text-center">
      <div class="text-danger">Please mint this item before setting up sale information</div>
    </div>
  </div>
</div>
<div v-else>
  Asset not passed.
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import PurchaseOfferAmount from './purchase-screens/PurchaseOfferAmount'
import PurchaseOfferEmail from './purchase-screens/PurchaseOfferEmail'
import moment from 'moment'
import utils from '@/services/utils'

export default {
  name: 'PurchaseFlow',
  components: {
    PurchaseOfferAmount,
    PurchaseOfferEmail
  },
  props: ['gaiaAsset'],
  data () {
    return {
      errorMessage: null,
      loading: true,
      offerStage: 0,
      offerData: {},
      biddingEndTime: null
    }
  },
  mounted () {
    this.errorMessage = null
    this.$store.commit('rpayCategoryStore/setModalMessage', '')
    this.$store.dispatch('rpayStacksStore/fetchMacSkyWalletInfo').then(() => {
      this.$store.commit('rpayStore/setDisplayCard', 100)
      this.setOfferData()
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
    setOfferData: function () {
      this.minimumOffer = utils.fromMicroAmount(this.gaiaAsset.saleData.reservePrice)
      if (!this.offerData.offerAmount) {
        this.offerData.offerAmount = this.minimumOffer
      }
      if (this.gaiaAsset.saleData && this.gaiaAsset.saleData.biddingEndTime) {
        let loaclEndM = moment(this.gaiaAsset.saleData.biddingEndTime)
        if (loaclEndM.isBefore(moment({}))) {
          loaclEndM = moment({}).add(2, 'days')
        }
        const loaclEnd = loaclEndM.format('DD-MM-YY')
        this.offerData.biddingEndTime = loaclEnd
      } else {
        const dd = moment({}).add(2, 'days')
        dd.hour(10)
        dd.minute(0)
        this.offerData.biddingEndTime = dd.format()
      }
    },
    backStep: function () {
      this.offerStage = 0
    },
    collectEmail: function (data) {
      Object.assign(this.offerData, data)
      this.offerStage = 1
    },
    makeOffer: function (data) {
      this.errorMessage = null
      this.offerData.biddingEndTime = moment(this.offerData.biddingEndTime).valueOf()
      this.offerData.email = data.email
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const network = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      this.sellingMessage = 'Sending your request to the blockchain... this takes a few minutes to confirm!'
      this.offerData.contractAddress = network.contractAddress
      this.offerData.contractName = network.contractName
      this.offerData.nftIndex = gaiaAsset.nftIndex
      this.offerData.assetHash = gaiaAsset.assetHash

      this.$store.dispatch('rpayStacksStore/makeOffer', this.offerData).then((result) => {
        gaiaAsset.opcode = 'stx-purchase-offer-made'
        window.eventBus.$emit('rpayEvent', gaiaAsset)
      }).catch((err) => {
        this.errorMessage = err
      })
    },
    minted () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      if (!gaiaAsset) return
      return gaiaAsset.nftIndex > -1
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

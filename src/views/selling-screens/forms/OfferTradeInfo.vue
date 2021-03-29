<template>
<div class="row">
  <div class="col-12 mb-5">
    <div role="group">
      <!-- <p>{{tradeInfoDesc()}}</p> -->
    </div>
    <div class="col-12 mb-5">
      <div role="group">
        <label for="input-live"><span class="">Minimum acceptable offer (STX)</span></label>
        <b-input-group>
          <b-form-input type="number" @change="updateBuyNow" v-model="buyNowOrStartingPrice" class="input" placeholder="STX"></b-form-input>
        </b-input-group>
      </div>
    </div>
    <div><p class="text-danger" v-html="errorMessage"></p></div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'OfferTradeInfo',
  components: {
  },
  data () {
    return {
      offerAmount: 0,
      errorMessage: null,
      buyNowOrStartingPrice: 0
    }
  },
  mounted () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    this.buyNowOrStartingPrice = configuration.minter.item.tradeInfo.buyNowOrStartingPrice
  },
  methods: {
    toDecimals: function (field) {
      if (this.offerAmount !== 0) this.offerAmount = Math.round(this.offerAmount * 1) / 1
    },
    tradeInfoDesc: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.item.offerCounter + ' offers so far'
    },
    updateBuyNow: function () {
      if (!this.buyNowOrStartingPrice || this.buyNowOrStartingPrice <= 0) {
        this.errorMessage = 'Please enter the buy now price.'
        return
      }

      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      tradeInfo.buyNowOrStartingPrice = this.buyNowOrStartingPrice
      this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
    },
    makeOffer: function () {
      if (!this.offerAmount || this.offerAmount <= 0) {
        this.errorMessage = 'Please enter the offer.'
        return
      }

      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      tradeInfo.buyNowOrStartingPrice = this.offerAmount
      this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

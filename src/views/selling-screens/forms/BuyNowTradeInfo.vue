<template>
<div class="row">
  <div class="col-12 mb-5">
    <div role="group">
      <label for="input-live"><span class="">Buy Now Price (STX)</span></label>
      <b-input-group>
        <b-form-input @keyup="toDecimals()" type="number" @change="updateBuyNow" v-model="buyNowOrStartingPrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div><p class="text-danger" v-html="errorMessage"></p></div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'SellBuyNow',
  components: {
  },
  props: ['saleData'],
  watch: {
  },
  data () {
    return {
      buyNowOrStartingPrice: 0,
      errorMessage: null
    }
  },
  mounted () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    this.buyNowOrStartingPrice = configuration.minter.item.saleData.buyNowOrStartingPrice
  },
  methods: {
    toDecimals: function () {
      if (this.buyNowOrStartingPrice !== 0) this.buyNowOrStartingPrice = Math.round(this.buyNowOrStartingPrice * 1) / 1
    },
    updateBuyNow: function () {
      if (!this.buyNowOrStartingPrice || this.buyNowOrStartingPrice <= 0) {
        this.errorMessage = 'Please enter the buy now price.'
        return
      }

      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const saleData = configuration.minter.item.saleData
      saleData.buyNowOrStartingPrice = this.buyNowOrStartingPrice
      this.$store.commit('rpayStore/setTradeInfo', saleData)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

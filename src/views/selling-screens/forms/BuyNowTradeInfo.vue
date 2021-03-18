<template>
<div class="row">
  <div class="col-12 mb-5">
    <div role="group">
      <label for="input-live"><span class="">Buy Now Price (STX)</span></label>
      <b-input-group>
        <b-form-input type="number" @change="updateBuyNow" v-model="buyNowOrStartingPrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'SellBuyNow',
  components: {
  },
  props: ['tradeInfo'],
  watch: {
  },
  data () {
    return {
      buyNowOrStartingPrice: 0
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.buyNowOrStartingPrice = configuration.selling.tradeInfo.buyNowOrStartingPrice
  },
  methods: {
    updateBuyNow: function () {
      if (!this.buyNowOrStartingPrice || this.buyNowOrStartingPrice <= 0) {
        this.$notify({ type: 'error', title: 'Price', text: 'Please enter the buy now price.' })
        return
      }
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.selling.tradeInfo
      tradeInfo.buyNowOrStartingPrice = this.buyNowOrStartingPrice
      this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

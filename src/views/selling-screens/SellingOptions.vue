<template>
<b-card-text class="mx-4">
  <div class="mx-5">
    <span>
      <b-button @click="changeSellingOption(1)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 1) ? 'co-option-on' : 'co-option-off'"><span>Buy Now</span></b-button>
    </span>
    <span>
      <b-button @click="changeSellingOption(2)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 2) ? 'co-option-on' : 'co-option-off'"><span>Bidding</span></b-button>
    </span>
    <span>
      <b-button @click="changeSellingOption(3)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 3) ? 'co-option-on' : 'co-option-off'"><span>Offers</span></b-button>
    </span>
  </div>
  <div class="mt-5 mx-5">
    <buy-now-trade-info v-if="tradeInfo.saleType === 1"/>
    <auction-trade-info  v-else-if="tradeInfo.saleType === 2"/>
    <offer-trade-info v-else/>
  </div>
</b-card-text>
</template>

<script>
import BuyNowTradeInfo from './forms/BuyNowTradeInfo'
import AuctionTradeInfo from './forms/AuctionTradeInfo'
import OfferTradeInfo from './forms/OfferTradeInfo'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import moment from 'moment'

export default {
  name: 'SellingOptions',
  components: {
    AuctionTradeInfo,
    BuyNowTradeInfo,
    OfferTradeInfo
  },
  data () {
    return {
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    const tradeInfo = configuration.selling.tradeInfo
    if (!tradeInfo.biddingEndTime) {
      tradeInfo.biddingEndTime = String(moment().unix())
    }
    this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
  },
  methods: {
    changeSellingOption: function (saleType) {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.selling.tradeInfo
      tradeInfo.saleType = saleType
      this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
    }
  },
  computed: {
    tradeInfo () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.selling.tradeInfo
      return tradeInfo
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

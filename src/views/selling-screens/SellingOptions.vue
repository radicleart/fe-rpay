<template>
<b-card-text class="mx-2">
  <div class="mx-2">
    <span>
      <b-button size="sm" @click="changeSellingOption(0)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 0) ? 'co-option-on' : 'co-option-off'"><span>Not On Sale</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(1)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 1) ? 'co-option-on' : 'co-option-off'"><span>Buy Now</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(2)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 2) ? 'co-option-on' : 'co-option-off'"><span>Bidding</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(3)" :variant="$globalLookAndFeel.variant0" :class="(tradeInfo.saleType === 3) ? 'co-option-on' : 'co-option-off'"><span>Offers</span></b-button>
    </span>
  </div>
  <div class="mt-5 mx-5">
    <not-for-sale v-if="tradeInfo.saleType === 0"/>
    <buy-now-trade-info v-if="tradeInfo.saleType === 1"/>
    <auction-trade-info v-else-if="tradeInfo.saleType === 2"/>
    <offer-trade-info v-else-if="tradeInfo.saleType === 3"/>
  </div>
</b-card-text>
</template>

<script>
import BuyNowTradeInfo from './forms/BuyNowTradeInfo'
import AuctionTradeInfo from './forms/AuctionTradeInfo'
import OfferTradeInfo from './forms/OfferTradeInfo'
import NotForSale from './forms/NotForSale'
import { APP_CONSTANTS } from '@/app-constants'
import moment from 'moment'

export default {
  name: 'SellingOptions',
  components: {
    AuctionTradeInfo,
    BuyNowTradeInfo,
    OfferTradeInfo,
    NotForSale
  },
  data () {
    return {
    }
  },
  mounted () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    const tradeInfo = configuration.minter.item.tradeInfo
    if (!tradeInfo.biddingEndTime) {
      tradeInfo.biddingEndTime = String(moment().unix())
    }
    this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
  },
  methods: {
    changeSellingOption: function (saleType) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      tradeInfo.saleType = saleType
      this.$store.commit('rpayStore/setTradeInfo', tradeInfo)
    }
  },
  computed: {
    tradeInfo () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const tradeInfo = configuration.minter.item.tradeInfo
      return tradeInfo
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

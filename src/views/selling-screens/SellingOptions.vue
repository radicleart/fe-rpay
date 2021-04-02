<template>
<b-card-text class="mx-2">
  <div class="mx-2">
    <span>
      <b-button size="sm" @click="changeSellingOption(0)" :variant="$globalLookAndFeel.variant0" :class="(saleData.saleType === 0) ? 'co-option-on' : 'co-option-off'"><span>Not On Sale</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(1)" :variant="$globalLookAndFeel.variant0" :class="(saleData.saleType === 1) ? 'co-option-on' : 'co-option-off'"><span>Buy Now</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(2)" :variant="$globalLookAndFeel.variant0" :class="(saleData.saleType === 2) ? 'co-option-on' : 'co-option-off'"><span>Bidding</span></b-button>
    </span>
    <span>
      <b-button size="sm" @click="changeSellingOption(3)" :variant="$globalLookAndFeel.variant0" :class="(saleData.saleType === 3) ? 'co-option-on' : 'co-option-off'"><span>Offers</span></b-button>
    </span>
  </div>
  <div class="mt-5 mx-5">
    <not-for-sale v-if="saleData.saleType === 0"/>
    <buy-now-trade-info v-if="saleData.saleType === 1"/>
    <auction-trade-info v-else-if="saleData.saleType === 2"/>
    <offer-trade-info v-else-if="saleData.saleType === 3"/>
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
    const saleData = configuration.minter.item.saleData
    if (!saleData.biddingEndTime) {
      saleData.biddingEndTime = String(moment().unix())
    }
    this.$store.commit('rpayStore/setTradeInfo', saleData)
  },
  methods: {
    changeSellingOption: function (saleType) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const saleData = configuration.minter.item.saleData
      saleData.saleType = saleType
      this.$store.commit('rpayStore/setTradeInfo', saleData)
    }
  },
  computed: {
    saleData () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const saleData = configuration.minter.item.saleData
      return saleData
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

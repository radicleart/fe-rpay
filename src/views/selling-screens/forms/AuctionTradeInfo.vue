<template>
<div class="row mt-5" v-if="!loading">
  <div class="col-12 mb-3">
    <div><p v-html="errorMessage"></p></div>
    <div role="group">
      <label for="input-live"><span class="text2">Starting Price</span></label>
      <b-input-group>
        <b-form-input @change="updateBuyNow" v-model="tradeInfo.buyNowOrStartingPrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div class="col-6">
    <div role="group">
      <label for="input-live"><span class="text2">Reserve Price</span></label>
      <b-input-group class="mb-3">
        <b-form-input @change="updateReservePrice" v-model="tradeInfo.reservePrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div class="col-6">
    <div role="group">
      <label for="input-live"><span class="text2">Increment</span></label>
      <b-input-group class="mb-3">
        <b-form-input @change="updateIncrementPrice" v-model="tradeInfo.incrementPrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div class="col-12 mb-3">
    <div role="group">
      <label for="input-live"><span class="text2">Bidding Ends</span></label>
      <datetime type="datetime" input-id="biddingEndTime1" v-model="biddingEndTime">
        <input @change="updateBiddingEndTime" id="biddingEndTime" style="border-radius: 24px !important;">
      </datetime>
      <!-- {{getLongTime()}} -->
    </div>
  </div>
</div>
</template>

<script>
import moment from 'moment'
import { Datetime } from 'vue-datetime'
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'SellAuction',
  components: {
    Datetime
  },
  props: ['submitData'],
  watch: {
    'biddingEndTime' () {
      this.updateBiddingEndTime()
    }
  },
  data () {
    return {
      biddingEndTime: null,
      errorMessage: null,
      loading: true,
      tradeInfo: {
        saleType: 2,
        incrementPrice: 1,
        buyNowOrStartingPrice: 0,
        reservePrice: 0
      }
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    if (configuration.selling.tradeInfo) this.tradeInfo = configuration.selling.tradeInfo

    if (configuration.selling.tradeInfo && configuration.selling.tradeInfo.biddingEndTime) {
      const loaclEnd = moment(configuration.selling.tradeInfo.biddingEndTime).format()
      this.biddingEndTime = loaclEnd
    } else {
      const dd = moment({}).add(2, 'days')
      dd.hour(10)
      dd.minute(0)
      this.biddingEndTime = dd.format()
    }
    this.loading = false
  },
  methods: {
    updateBuyNow: function () {
      if (!this.tradeInfo.buyNowOrStartingPrice) {
        this.errorMessage = 'start price required'
        return
      }
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      configuration.selling.tradeInfo.buyNowOrStartingPrice = this.tradeInfo.buyNowOrStartingPrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.selling.tradeInfo)
    },
    updateReservePrice: function () {
      if (!this.tradeInfo.reservePrice || this.tradeInfo.reservePrice < 0) {
        this.errorMessage = 'Please enter the reserve'
        return
      }
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      configuration.selling.tradeInfo.reservePrice = this.tradeInfo.reservePrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.selling.tradeInfo)
    },
    updateIncrementPrice: function () {
      if (!this.tradeInfo.incrementPrice || this.tradeInfo.incrementPrice < 0) {
        this.errorMessage = 'Please enter the increment'
        return
      }
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      configuration.selling.tradeInfo.incrementPrice = this.tradeInfo.incrementPrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.selling.tradeInfo)
    },
    updateBiddingEndTime: function () {
      if (!this.biddingEndTime || this.biddingEndTime < 0) {
        this.errorMessage = 'Please enter the bidding end time'
        return
      }
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const localTime = moment(this.biddingEndTime).valueOf()
      configuration.selling.tradeInfo.biddingEndTime = localTime
      this.$store.commit('rpayStore/setTradeInfo', configuration.selling.tradeInfo)
    },
    checkEndTime () {
      const now = moment().unix()
      const diff = this.tradeInfo.biddingEndTime - now
      return diff > 0
    },
    getLongTime () {
      return moment(this.tradeInfo.biddingEndTime).valueOf()
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
</style>

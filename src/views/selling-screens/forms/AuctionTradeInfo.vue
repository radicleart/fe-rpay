<template>
<div class="row mt-5" v-if="!loading">
  <div class="col-12 mb-3">
    <div><p v-html="errorMessage"></p></div>
    <div role="group">
      <label for="input-live"><span class="text2">Starting Price</span></label>
      <b-input-group>
        <b-form-input @keyup="toDecimals('buyNowOrStartingPrice')" @change="updateBuyNow" v-model="saleData.buyNowOrStartingPrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div class="col-6">
    <div role="group">
      <label for="input-live"><span class="text2">Reserve Price</span></label>
      <b-input-group class="mb-3">
        <b-form-input @keyup="toDecimals('reservePrice')" @change="updateReservePrice" v-model="saleData.reservePrice" class="input" placeholder="STX"></b-form-input>
      </b-input-group>
    </div>
  </div>
  <div class="col-6">
    <div role="group">
      <label for="input-live"><span class="text2">Increment</span></label>
      <b-input-group class="mb-3">
        <b-form-input @keyup="toDecimals('incrementPrice')" @change="updateIncrementPrice" v-model="saleData.incrementPrice" class="input" placeholder="STX"></b-form-input>
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
import { APP_CONSTANTS } from '@/app-constants'

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
      saleData: {
        saleType: 2,
        incrementPrice: 1,
        buyNowOrStartingPrice: 0,
        reservePrice: 0
      }
    }
  },
  mounted () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    if (configuration.minter.item.saleData) this.saleData = configuration.minter.item.saleData

    if (configuration.minter.item.saleData && configuration.minter.item.saleData.biddingEndTime) {
      const loaclEnd = moment(configuration.minter.item.saleData.biddingEndTime).format()
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
    toDecimals: function (field) {
      if (field === 'incrementPrice') {
        if (this.saleData.incrementPrice !== 0) this.saleData.incrementPrice = Math.round(this.saleData.incrementPrice * 1) / 1
      } else if (field === 'reservePrice') {
        if (this.saleData.reservePrice !== 0) this.saleData.reservePrice = Math.round(this.saleData.reservePrice * 1) / 1
      } else {
        if (this.saleData.buyNowOrStartingPrice !== 0) this.saleData.buyNowOrStartingPrice = Math.round(this.saleData.buyNowOrStartingPrice * 1) / 1
      }
    },
    updateBuyNow: function () {
      if (!this.saleData.buyNowOrStartingPrice) {
        this.errorMessage = 'start price required'
        return
      }
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.minter.item.saleData.buyNowOrStartingPrice = this.saleData.buyNowOrStartingPrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.minter.item.saleData)
    },
    updateReservePrice: function () {
      if (!this.saleData.reservePrice || this.saleData.reservePrice < 0) {
        this.errorMessage = 'Please enter the reserve'
        return
      }
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.minter.item.saleData.reservePrice = this.saleData.reservePrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.minter.item.saleData)
    },
    updateIncrementPrice: function () {
      if (!this.saleData.incrementPrice || this.saleData.incrementPrice < 0) {
        this.errorMessage = 'Please enter the increment'
        return
      }
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.minter.item.saleData.incrementPrice = this.saleData.incrementPrice
      this.$store.commit('rpayStore/setTradeInfo', configuration.minter.item.saleData)
    },
    updateBiddingEndTime: function () {
      if (!this.biddingEndTime || this.biddingEndTime < 0) {
        this.errorMessage = 'Please enter the bidding end time'
        return
      }
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const localTime = moment(this.biddingEndTime).valueOf()
      configuration.minter.item.saleData.biddingEndTime = localTime
      this.$store.commit('rpayStore/setTradeInfo', configuration.minter.item.saleData)
    },
    checkEndTime () {
      const now = moment().unix()
      const diff = this.saleData.biddingEndTime - now
      return diff > 0
    },
    getLongTime () {
      return moment(this.saleData.biddingEndTime).valueOf()
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
</style>

<template>
<div v-if="!loading">
  <b-row>
    <b-col cols="12">
      <h1>Make An Offer</h1>
    </b-col>
  </b-row>
  <b-row class="row mt-5">
    <b-col cols="4">
      <h1>Express Your Interest</h1>
      <p class="text-small text-bold">Offers close {{offerData.biddingEndTime}}</p>
      <p>This one off artwork is yours for the right offer.
        This one off artwork is yours for the right offer
        This one off artwork is yours for the right offer
      </p>
    </b-col>
    <b-col cols="5" style="border-right: 1pt solid #000;">
      <div>
        <label for="input-live"><span class="">Type Amount</span></label>
      </div>
      <div>
        <b-input-group size="lg" append="STX">
          <template #prepend>
            <b-input-group-text v-html="stxSymbol()"></b-input-group-text>
          </template>
          <b-form-input id="offer" :state="offerState" v-model="offerAmount" placeholder="STX"></b-form-input>
        </b-input-group>
        <p class="text-small text-danger" v-html="errorMessage"></p>
        <!--
        <b-input-group class="w-100">
          <b-form-input @keyup="toDecimals('reservePrice')" v-model="offerAmount" class="w-75 input" placeholder="STX"></b-form-input>
          <b-form-select
            class="w-25"
            :options="rateOptions"
            :value="'STX'"
            v-model="defaultRate"
          ></b-form-select>
        </b-input-group>
        -->
      </div>
    </b-col>
    <b-col cols="3" style="font-size: 0.8em;">
      <div class="mb-3 pb-3 border-bottom">Offers above {{minimumOffer}} STX will be considered</div>
      <div class="pl-0">
        <div v-for="(rate, index) in rates" :key="index" :class="(index % 2 === 0) ? 'bg-light text-black' : ''" class="py-1 d-flex justify-content-between">
          <div style="min-width: 100px;" class="text-right mr-4">{{rate.value}}</div>
          <div style="min-width: 100px;">{{rate.text}}</div>
        </div>
      </div>
    </b-col>
  </b-row>
  <b-row>
    <b-col cols="12">
      <div class="mt-5 footer-container">
        <div class="d-flex justify-content-between">
          <div class="border-bottom w-75"></div>
          <div style="width: 200px; position: relative; top: 15px;">
            <b-button style="width: 200px;" class="square-btn" @click.prevent="next()">NEXT</b-button>
          </div>
        </div>
      </div>
    </b-col>
  </b-row>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'

export default {
  name: 'PurchaseOfferAmount',
  components: {
  },
  props: ['offerData'],
  data () {
    return {
      loading: true,
      formSubmitted: false,
      minimumOffer: 0,
      errorMessage: null,
      offerAmount: 0,
      defaultRate: null
    }
  },
  mounted () {
    const tickerRates = this.$store.getters[APP_CONSTANTS.KEY_TICKER_RATES]
    this.defaultRate = tickerRates[0].currency
    this.minimumOffer = this.offerData.minimumOffer
    this.offerAmount = this.offerData.offerAmount
    this.$emit('updateSaleDataInfo', { field: 'saleType', value: 3 })
    this.loading = false
  },
  methods: {
    stxSymbol: function () {
      return '&#931;'
    },
    next: function () {
      this.errorMessage = null
      if (this.offerAmount < this.minimumOffer) {
        this.errorMessage = 'Offers above ' + this.minimumOffer + ' STX will be considered'
        return
      }
      this.$emit('collectEmail', { offerAmount: this.offerAmount })
    },
    checkAndConvertToDecimals: function () {
      if (this.offerAmount < this.minimumOffer) {
        // this.offerAmount = this.minimumOffer
      }
      if (this.offerAmount !== 0) this.offerAmount = Math.round(this.offerAmount * 100) / 100
    },
    updateOfferAmount: function () {
      if (this.offerAmount < this.minimumOffer) {
        this.offerAmount = this.minimumOffer
      }
    }
  },
  computed: {
    gaiaAsset () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.gaiaAsset
    },
    rateOptions () {
      const tickerRates = this.$store.getters[APP_CONSTANTS.KEY_TICKER_RATES]
      const options = []
      tickerRates.forEach((rate) => {
        options.push({
          text: rate.currency,
          value: rate.currency
        })
      })
      return options
    },
    offerState () {
      return (this.offerAmount >= this.minimumOffer)
    },
    rates () {
      const tickerRates = this.$store.getters[APP_CONSTANTS.KEY_TICKER_RATES]
      const options = []
      const stxToBtc = tickerRates[0].stxPrice / tickerRates[0].last
      options.push({
        text: 'BTC',
        value: utils.toDecimals(stxToBtc * this.offerAmount, 100000)
      })
      const stxToETh = tickerRates[0].stxPrice / tickerRates[0].ethPrice
      options.push({
        text: 'ETH',
        value: utils.toDecimals(stxToETh * this.offerAmount, 100000)
      })
      tickerRates.forEach((rate) => {
        options.push({
          text: rate.currency,
          value: utils.toDecimals(rate.stxPrice * this.offerAmount)
        })
      })
      return options
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

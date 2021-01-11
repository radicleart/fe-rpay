<template>
<b-card-text>
  <div class="mb-2">
    <b-form inline class="d-flex justify-content-between w-100">
      <a href="#" v-if="amountSend && amountSend > 0" class="text-info" @click="showTable = !showTable">Change Amount</a>
      <a href="#" v-else class="text-info" @click="showTable = !showTable">Select Amount to Send</a>
      <b-form-select v-model="currency" :options="currencies"></b-form-select>
    </b-form>
  </div>
  <div class="mb-2 d-flex justify-content-between w-100" v-if="amountSend">
    <div class="text-info">{{symbol}} {{amountSend}} {{currency}}</div>
    <div class="text-info">
      <div>{{amountBtc}} BTC</div>
      <div>{{amountStx}} STX</div>
    </div>
  </div>
  <div class="box container">
    <div class="row text-center" v-if="showTable">
      <div class="col-3 cell bg-info text-white" v-for="(j, index) in fibs" :key="index"><a href="#" class="text-white" @click.prevent="setAmount(fibs[index])">{{fibs[index]}}</a></div>
    </div>
    <div class="row text-center" v-if="showTable">
      <b-form class="d-flex justify-content-between w-100">
        <b-form-input
          type="number"
          id="amountSend"
          placeholder="Enter amount"
          v-model="amountSend"
          ></b-form-input>
      </b-form>
    </div>
  </div>
  <div v-if="amountSend > 0">
    <p>Send Method</p>
    <div v-for="(option, index) in options" :key="index">
      <p><b-button variant="warning" class="d-flex justify-content-between w-100" @click.prevent="sendPayment(option.value)" :class="(paymentOption === option.value) ? 'chosen' : ''">{{option.text}} <b-icon icon="arrow-right"></b-icon></b-button></p>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

const precision = 100000000

export default {
  name: 'CryptoPicker',
  components: {
  },
  props: ['paymentOption'],
  data () {
    return {
      selected: null,
      options: null,
      amountSend: null,
      amountBtc: null,
      amountStx: null,
      currency: 'EUR',
      showTable: true,
      fibs: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]
    }
  },
  watch: {
    'paymentOption' () {
      this.selected = this.paymentOption
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.selected = configuration.paymentOption
    this.options = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTIONS]
  },
  methods: {
    sendPayment (value) {
      const payment = {
        opcode: 'cfd-payment-1',
        value: value,
        currency: this.currency,
        amountFiat: this.amountSend,
        amountBtc: this.amountBtc,
        amountStx: this.amountStx
      }
      this.$emit('paymentEvent', payment)
    },
    setAmount (amount) {
      this.showTable = false
      this.amountSend = amount
      const rates = this.$store.getters[LSAT_CONSTANTS.KEY_EXCHANGE_RATES]
      const rateObject = rates.find(item => item.currency === this.currency)
      let amountBtc = this.amountSend / rateObject.last
      amountBtc = Math.round(amountBtc * precision) / precision
      this.amountBtc = amountBtc
      const amountStx = Math.round(this.amountSend * rateObject.stxPrice * 1000000) / 1000000
      this.amountStx = amountStx
    }
  },
  computed: {
    currencies () {
      const rates = this.$store.getters[LSAT_CONSTANTS.KEY_EXCHANGE_RATES]
      if (rates) {
        return rates.map(function (a) { return { value: a.currency, text: a.currency } })
      }
      return []
    },
    symbol () {
      const rates = this.$store.getters[LSAT_CONSTANTS.KEY_EXCHANGE_RATES]
      const rateObject = rates.find(item => item.currency === this.currency)
      if (rateObject) {
        return rateObject.symbol
      }
      return '-'
    }
  }
}
</script>
<style lang="scss">
.box {
  position: relative;
  top: 0px;
  z-index: 2;
  margin: 20px;
}
.cell {
  border: 1pt solid #fff;
  min-height: 20px;
  max-width: 20px;
  padding: 10px;
  cursor: pointer;
  color: #fff;
  font-weight: 700;
}
.chosen {
  background: #F9B807 0% 0% no-repeat padding-box;
}

</style>

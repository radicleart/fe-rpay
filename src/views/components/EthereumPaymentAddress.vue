<template>
<div class="vld-parent d-flex flex-column align-items-center">
  <!--
    <loading :active.sync="loading"
    :can-cancel="true"
    :on-cancel="onCancel"
    :is-full-page="fullPage"></loading>
    -->
  <div class="text-center">
    <canvas ref="lndQrcode"></canvas>
  </div>

  <div class="mt-3 rd-text d-flex flex-column align-items-center" style="" v-if="loading">
     <span class="text-danger" v-html="waitingMessage"></span>
  </div>
  <div class="rd-text mt-3 d-flex flex-column align-items-center" v-else>
    <b-button variant="info" class="mb-5" style="white-space: nowrap; width: 200px;" @click.prevent="sendPayment()">Connect with Ethereum</b-button>
    <span class="text-danger">{{errorMessage}}</span>
  </div>
  <div class="text-center">
    <span class="text-danger">> <a target="_blank" href="https://metamask.io/download.html">Meta Mask</a></span>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import QRCode from 'qrcode'

const NETWORK = process.env.VUE_APP_NETWORK
const ETH_PAYMENT_ADDRESS = process.env.VUE_APP_OWNER_ADDRESS

export default {
  name: 'EthereumPaymentAddress',
  components: {
  },
  props: {
  },
  data () {
    return {
      loading: false,
      fullPage: true,
      errorMessage: null,
      waitingMessage: 'Open Meta Mask to proceed (sending transactions to the ethereum network takes a minute or so...)',
      processingMessage: '<div class="mx-5 text-center"><h6>Processing payments</h6><p>Processing payments on the Ethereum takes a few minutes - please sit tight!</p></div>'
    }
  },
  watch: {
  },
  mounted () {
    this.addQrCode()
  },
  computed: {
  },

  methods: {
    paymentUri () {
      // const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return ETH_PAYMENT_ADDRESS
    },
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    sendPayment () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.waitingMessage = this.processingMessage
      this.$store.dispatch('ethereumStore/transact', { opcode: 'send-payment', amount: configuration.payment.amountEth }).then((result) => {
        const data = { status: 10, opcode: 'eth-crypto-payment-success', txId: result.txId }
        this.waitingMessage = 'Processed Payment'
        this.loading = false
        this.$emit('paymentEvent', data)
      }).catch((e) => {
        if (e.message.indexOf('cancelled') === -1) {
          this.errorMessage = 'Please ensure you are logged into your meta mask account on the ' + NETWORK + ' network'
        }
        this.waitingMessage = ''
        this.loading = false
      })
    },
    onCancel () {
      this.loading = false
    }
  }
}
</script>
<style lang="scss" scoped>
.tab-content {
  padding-top: 0px;
}
</style>

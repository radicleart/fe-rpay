paymentId<template>
<div class="d-flex flex-column align-items-center">
  <div class="mb-3 mx-auto">
    <canvas ref="lndQrcode"></canvas>
  </div>
  <div class="rd-text mb-3 d-flex justify-content-center">
    <span><small>Send the indicated amount to the address below</small></span>
  </div>
  <b-input-group class="mb-3">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fab fa-btc"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly ref="paymentAmountBtc" style="height: 50px;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-light" @click="copyAmount($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
  <b-input-group class="mb-3">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fas fa-address-book"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly ref="paymentAddressBtc" style="height: 50px;" :value="paymentAddress" placeholder="Bitcoin address"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-light" @click="copyAddress($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
</div>
</template>

<script>
import QRCode from 'qrcode'
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'BitcoinPaymentAddress',
  components: {
  },
  data () {
    return {
    }
  },
  watch: {
    'paymentAmount' () {
      // this.addQrCode()
    }
  },
  mounted () {
    this.addQrCode()
  },
  computed: {
    paymentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.xchange.amountBtc
    },
    paymentAddress () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.bitcoinInvoice.bitcoinAddress
    }
  },

  methods: {
    paymentUri () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      let uri = 'bitcoin:' + paymentChallenge.bitcoinInvoice.bitcoinAddress
      uri += '?amount=' + paymentChallenge.xchange.amountBtc
      uri += '&label=' + paymentChallenge.paymentId
      return uri
    },
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    copyAmount () {
      var copyText = this.$refs.paymentAmountBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress () {
      var copyText = this.$refs.paymentAddressBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    }
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
</style>

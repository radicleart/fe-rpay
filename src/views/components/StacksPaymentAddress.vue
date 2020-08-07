<template>
<div class="d-flex flex-column align-items-center">
  <div class="rd-text mt-3 mx-auto" v-if="!stacksSupported" style="height: 40vh;">
    <h2 class="mt-0">Coming soon - stay tuned!</h2>
  </div>
  <div class="mb-3 mx-auto" v-if="stacksSupported">
    <canvas id="qrcode"></canvas>
  </div>
  <div class="rd-text my-5 d-flex justify-content-center" v-if="stacksSupported">
    <span><small>Send the indicated amount to the address below</small></span>
  </div>
  <b-input-group class="mb-3" v-if="stacksSupported">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fab fa-btc"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-amount-btc" style="height: 50px;" :value="paymentAmount" placeholder="Bitcoin amount"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-white text-dark" @click="copyAmount($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
  <b-input-group class="mb-3" v-if="stacksSupported">
    <b-input-group-prepend>
      <span class="input-group-text"><i class="fas fa-address-book"></i></span>
    </b-input-group-prepend>
    <b-form-input readonly id="payment-address-btc" style="height: 50px;" :value="paymentAddress" placeholder="Stacks address"></b-form-input>
    <b-input-group-append>
      <b-button class="bg-white text-dark" @click="copyAddress($event)"><font-awesome-icon width="15px" height="15px" icon="copy"/></b-button>
    </b-input-group-append>
  </b-input-group>
</div>
</template>

<script>
import QRCode from 'qrcode'
import moment from 'moment'
import { LSAT_CONSTANTS } from '@/lsat-constants'

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'BitcoinPaymentAddress',
  components: {
  },
  props: {
  },
  data () {
    return {
    }
  },
  watch: {
    'paymentAmount' () {
      this.addQrCode()
    }
  },
  mounted () {
    this.addQrCode()
  },
  computed: {
    myProfile () {
      const blockstackProfile = this.$store.getters['authStore/getMyProfile']
      return blockstackProfile
    },
    currentTime () {
      const serverTime = this.$store.getters.serverTime
      return moment(serverTime).format('HH:mm:ss')
    },
    stacksSupported () {
      return false
    },
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
      if (paymentChallenge.stacksInvoice) uri += '&label=' + paymentChallenge.stacksInvoice.memo
      return uri
    },
    addQrCode () {
      const $qrCode = document.getElementById('qrcode')
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        $qrCode, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    copyAmount () {
      var copyText = document.getElementById('payment-amount-btc')
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress () {
      var copyText = document.getElementById('payment-address-btc')
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

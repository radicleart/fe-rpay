<template>
<div class="d-flex flex-column align-items-center">
  <div class="mb-3 mx-auto">
    <canvas ref="lndQrcode"></canvas>
  </div>
  <div class="rpay-countdown mb-3 d-flex justify-content-center">
    <span class="mr-2">Code is valid for</span>
    <crypto-countdown class="" v-on="$listeners" />
  </div>
  <!--
  <div class="rd-text mb-3 d-flex justify-content-center">
    <span><small>Send the indicated amount to the address below</small></span>
  </div>
  -->

  <div class="d-flex justify-content-center">
    <a ref="myPaymentAddress" class="copyAddress" href="#" @click.prevent="copyAddress(paymentAmount)">
      <span ref="myPaymentAddress" class="mr-2 text-two">&#8383; {{paymentAmount}}</span>
    </a>
  </div>
  <div class="d-flex justify-content-center">
    <a ref="myPaymentAddress" class="copyAddress" href="#" @click.prevent="copyAddress(paymentAddress)">
      <span ref="myPaymentAddress" class="mr-2 text-two">{{paymentAddress}}</span>
    </a>
  </div>
</div>
</template>

<script>
import QRCode from 'qrcode'
import { APP_CONSTANTS } from '@/app-constants'
import CryptoCountdown from '@/views/payment-screens/components/CryptoCountdown'

export default {
  name: 'BitcoinPaymentAddress',
  components: {
    CryptoCountdown
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
      const invoice = this.$store.getters[APP_CONSTANTS.KEY_INVOICE]
      return invoice.data.amount / 100000000
    },
    paymentAddress () {
      const invoice = this.$store.getters[APP_CONSTANTS.KEY_INVOICE]
      return invoice.data.address
    }
  },

  methods: {
    paymentUri () {
      const invoice = this.$store.getters[APP_CONSTANTS.KEY_INVOICE]
      let uri = 'bitcoin:' + invoice.address
      uri += '?amount=' + invoice.amount
      uri += '&label=' + invoice.description
      return uri
    },
    addQrCode () {
      const element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    copyAmount () {
      const copyText = this.$refs.paymentAmountBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    },
    copyAddress (value) {
      // const invoice = this.$store.getters[APP_CONSTANTS.KEY_INVOICE]
      const tempInput = document.createElement('input')
      // tempInput.style = 'position: absolute; left: -1000px; top: -1000px'
      tempInput.value = value // invoice.data.address
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)
      // const flasher = document.getElementById('flash-me')
      const flasher = this.$refs.lndQrcode
      flasher.classList.add('flasher')
      setTimeout(function () {
        flasher.classList.remove('flasher')
      }, 1000)
      // copyText.select()
      // document.execCommand('copy')
    },

    copyAddress2 () {
      const copyText = this.$refs.paymentAddressBtc
      copyText.select()
      document.execCommand('copy')
      this.$notify({ type: 'success', title: 'Copied Address', text: 'Copied the address to clipboard: ' + copyText.value })
    }
  }
}
</script>
<style lang="scss" scoped>
.tab-content {
  padding-top: 0px;
}
</style>

<template>
<div>
  <div>
    <div title="Make Payment">
      <div class="text-center">
        <canvas ref="lndQrcode"></canvas>
      </div>
      <div class="rpay-countdown mb-3 d-flex justify-content-center">
        <span class="mr-2">Code is valid for</span>
        <crypto-countdown class="" v-on="$listeners" />
      </div>
      <div class="mb-5 d-flex justify-content-center">
        <a ref="myPaymentAddress" class="copyAddress" href="#" @click.prevent="copyAddress()" style="text-decoration: underline;">
          <span ref="myPaymentAddress" class="mr-2" :style="$globalLookAndFeel.text1Color">Copy the address</span>
        </a>
        <b-icon width="15px" height="15px" icon="file-earmark" :style="$globalLookAndFeel.text1Color"/>
      </div>
    </div>
    <div class="text-center">
      <b-button v-if="!profile.loggedIn" variant="info" class="mb-5" style="white-space: nowrap; width: 250px;" @click.prevent="doLogin()">Connect to Stacks Network</b-button>
      <b-button v-else variant="info" class="mb-5" style="white-space: nowrap; width: 250px;" @click.prevent="sendPayment()">Donate with Stacks Connect</b-button>
    </div>
    <div class="text-center">
      <span class="text-danger">{{errorMessage}}</span>
    </div>
    <div class="text-center">
      <span class="text-danger">> <a target="_blank" href="https://www.hiro.so/wallet/install-web">Stacks Wallet</a></span>
    </div>
  </div>
</div>
</template>

<script>
import QRCode from 'qrcode'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import CryptoCountdown from '@/views/components/CryptoCountdown'

const STACKS_PAYMENT_ADDRESS = process.env.VUE_APP_STACKS_PAYMENT_ADDRESS

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'StacksPaymentAddress',
  components: {
    CryptoCountdown
  },
  props: {
  },
  data () {
    return {
      errorMessage: null,
      waitingMessage: 'Open Connect Wallet to proceed (sending transactions to the stacks network takes a minute or so...)'
    }
  },
  watch: {
  },
  mounted () {
    this.addQrCode()
  },
  methods: {
    doLogin () {
      this.$store.dispatch('rpayStacksStore/startLogin').then((result) => {
        this.errorMessage = 'Error found'
        this.loading = false
      })
    },
    sendPayment () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.waitingMessage = 'Processing Payment'
      this.$store.dispatch('rpayStacksStore/makeTransfer', { amountStx: configuration.payment.amountStx, paymentAddress: STACKS_PAYMENT_ADDRESS }).then((result) => {
        const data = { status: 10, opcode: 'stx-crypto-payment-success', txId: result.txId }
        this.waitingMessage = 'Processed Payment'
        this.loading = false
        this.$emit('paymentEvent', data)
      }).catch((e) => {
        this.errorMessage = 'Error found'
        this.loading = false
      })
    },
    paymentUri () {
      // const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return STACKS_PAYMENT_ADDRESS
    },
    addQrCode () {
      var element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    copyAddress () {
      var tempInput = document.createElement('input')
      tempInput.value = STACKS_PAYMENT_ADDRESS
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
    }
  },
  computed: {
    profile () {
      const profile = this.$store.getters[LSAT_CONSTANTS.KEY_PROFILE]
      return profile
    },
    paymentAddress () {
      return STACKS_PAYMENT_ADDRESS
    }
  }
}
</script>
<style lang="scss" scoped>
.tab-content {
  padding-top: 0px;
}
</style>

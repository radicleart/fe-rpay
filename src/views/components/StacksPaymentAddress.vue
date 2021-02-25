<template>
<div class="mt-4 d-flex flex-column align-items-center">
  <div>
    <div title="Make Payment">
      <div class="text-center" v-if="desktopWalletSupported">
        <canvas ref="lndQrcode"></canvas>
      </div>
    </div>
    <div class="mb-2 text-center" v-if="desktopWalletSupported">
      <a href="#" @click.prevent="copyAddress()">
        <span ref="myPaymentAddress" class="text-bold text-two mr-2">Copy the address</span>
      </a>
      <b-icon class="text-two" width="20px" height="20px" icon="file-earmark"/>
    </div>
    <div class="mt-5 text-center">
      <!--<b-button v-if="!loggedIn" class="cp-btn-order" :variant="$globalLookAndFeel.variant0" @click.prevent="doLogin()">Connect to Stacks</b-button> -->
      <b-button class="cp-btn-order" :variant="$globalLookAndFeel.variant0" @click.prevent="sendPayment()">Send <span class="" v-html="currentSymbol"></span> {{currentAmount}}</b-button>
    </div>
    <div class="my-3 text-center">
      <span class="text-small text-danger">{{errorMessage}}</span>
    </div>
  </div>
  <div class="text-center">
    <span><a class="text-small text-info" target="_blank" href="https://www.hiro.so/wallet/install-web">Install stacks wallet</a></span>
  </div>
</div>
</template>

<script>
import QRCode from 'qrcode'
import { LSAT_CONSTANTS } from '@/lsat-constants'

const STACKS_PAYMENT_ADDRESS = process.env.VUE_APP_STACKS_PAYMENT_ADDRESS

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'StacksPaymentAddress',
  components: {
  },
  props: ['desktopWalletSupported'],
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
      this.$store.dispatch('rpayStacksStore/makeTransferBlockstack', { amountStx: configuration.payment.amountStx, paymentAddress: configuration.payment.stxPaymentAddress }).then((result) => {
        const data = { status: 10, opcode: 'stx-crypto-payment-success', txId: result.txId }
        this.waitingMessage = 'Processed Payment'
        this.loading = false
        this.$emit('rpayEvent', data)
      }).catch((e) => {
        this.$store.dispatch('rpayStacksStore/makeTransferRisidio', { amountStx: configuration.payment.amountStx, paymentAddress: configuration.payment.stxPaymentAddress }).then((result) => {
          if (!result.opcode) {
            result.opcode = 'stacks-connect-error'
          }
          this.$emit('rpayEvent', result)
        }).catch((e) => {
          this.errorMessage = 'Unable to transfer funds at the moment - please try later or choose an alternate payment method'
          this.loading = false
        })
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
    currentSymbol () {
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#8383;' // '&#x20BF;' // '&#8383;'
      }
    },
    currentAmount () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (configuration && configuration.payment.amountBtc) {
        if (paymentOption === 'ethereum') {
          return configuration.payment.amountEth + ' ETH'
        } else if (paymentOption === 'stacks') {
          return configuration.payment.amountStx + ' STX'
        } else {
          return configuration.payment.amountBtc + ' BTC'
        }
      }
      return 0
    },
    loggedIn () {
      const profile = this.$store.getters[LSAT_CONSTANTS.KEY_PROFILE]
      return (profile) ? profile.loggedIn : false
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

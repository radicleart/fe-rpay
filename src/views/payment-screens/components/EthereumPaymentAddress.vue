<template>
<div class="mt-4 d-flex flex-column align-items-center">
  <!--
    <loading :active.sync="loading"
    :can-cancel="true"
    :on-cancel="onCancel"
    :is-full-page="fullPage"></loading>
    -->
  <div class="text-center" v-if="desktopWalletSupported">
    <canvas ref="lndQrcode"></canvas>
  </div>

  <div class="mt-5 mb-3 text-center">
    <b-button class="cp-btn-order" :variant="$globalLookAndFeel.variant0" @click.prevent="sendPayment()">Connect via Meta Mask</b-button>
  </div>
  <div class="mb-2 text-center" style="" v-if="loading">
     <span class="text-danger" v-html="waitingMessage"></span>
  </div>
  <div class="mb-3 text-center">
    <span class="text-danger">{{errorMessage}}</span>
  </div>
  <div class="text-center">
    <span><a class="text-small text-info" target="_blank" href="https://metamask.io/download.html">Install Meta Mask</a></span>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import QRCode from 'qrcode'

export default {
  name: 'EthereumPaymentAddress',
  components: {
  },
  props: ['desktopWalletSupported'],
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
    const $self = this
    window.eventBus.$on('rpayEvent', function (data) {
      $self.errorMessage = data
    })
  },
  computed: {
  },

  methods: {
    paymentUri () {
      // const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.ethPaymentAddress
    },
    addQrCode () {
      const element = this.$refs.lndQrcode
      const paymentUri = this.paymentUri()
      QRCode.toCanvas(
        element, paymentUri, { errorCorrectionLevel: 'H' },
        function () {})
    },
    sendPayment () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.loading = true
      this.waitingMessage = this.processingMessage
      this.$store.dispatch('rpayEthereumStore/transact', { opcode: 'send-payment', ethPaymentAddress: configuration.payment.ethPaymentAddress, amount: configuration.payment.amountEth }).then((result) => {
        const data = {
          status: 10,
          numbCredits: configuration.payment.creditAttributes.start,
          opcode: 'eth-crypto-payment-success',
          txId: result.txId
        }
        this.waitingMessage = 'Processed Payment'
        this.loading = false
        // this.$emit('rpayEvent', data)
        window.eventBus.$emit('rpayEvent', data)
        this.$store.commit('rpayStore/setDisplayCard', 104)
      }).catch((e) => {
        if (e.message.indexOf('cancelled') === -1) {
          this.errorMessage = 'Please ensure you are logged into your meta mask account on the network'
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

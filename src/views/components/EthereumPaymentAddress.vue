<template>
<div class="vld-parent d-flex flex-column align-items-center">
  <!--
    <loading :active.sync="loading"
    :can-cancel="true"
    :on-cancel="onCancel"
    :is-full-page="fullPage"></loading>
    -->

  <div class="mt-3 rd-text d-flex flex-column align-items-center" style="" v-if="loading">
     <span class="text-danger" v-html="waitingMessage"></span>
  </div>
  <div class="rd-text mt-3 d-flex flex-column align-items-center" v-else>
    <b-button variant="info" class="mb-5" style="white-space: nowrap; width: 200px;" @click.prevent="sendPayment()">Donate with Meta Mask</b-button>
    <span class="text-danger">{{errorMessage}}</span>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

const NETWORK = process.env.VUE_APP_NETWORK

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
      processingMessage: '<h4>Processing payments</h4><p>Processing payments on the Ethereum takes a few minutes - please sit tight!</p>'
    }
  },
  watch: {
  },
  mounted () {
  },
  computed: {
  },

  methods: {
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
        this.errorMessage = 'Please ensure you are logged into your meta mask account on the ' + NETWORK + ' network'
        this.loading = false
      })
    },
    onCancel () {
      this.loading = false
    }
  }
}
</script>
<style lang="scss">
.tab-content {
  padding-top: 0px;
}
</style>

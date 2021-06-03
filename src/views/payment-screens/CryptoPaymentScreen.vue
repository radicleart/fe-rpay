<template>
<b-card-text class="">
  <div class="" v-if="timedOutOrExpired || expired">
    <div class="d-flex justify-content-center">
      <b>Lightning invoice has expired - {{timedOutOrExpired}}</b>
    </div>
    <div class="d-flex justify-content-center">
      <b-button @click="prev()" :variant="$globalLookAndFeel.variant1" class="button1 bg-danger">Start Over</b-button>
    </div>
  </div>
  <div class="" v-else>
    <div class="text-center text-bold" v-if="desktopWalletSupported">Scan the QR code <a v-if="paymentOption === 'lightning'" href="#" class="text-info" @click.prevent="checkChain()">check payment</a></div>
    <div class="text-center text-bold" v-if="paymentOption === 'fiat'">Enter your payment information</div>
    <div class="d-flex justify-content-center">
      <fiat-payment-screen v-on="$listeners" v-if="paymentOption === 'fiat'"/>
      <lightning-payment-address v-on="$listeners" v-if="paymentOption === 'lightning'"/>
      <bitcoin-payment-address v-on="$listeners" v-if="paymentOption === 'bitcoin'"/>
      <stacks-payment-address :desktopWalletSupported="desktopWalletSupported" v-if="paymentOption === 'stacks'"/>
      <ethereum-payment-address :desktopWalletSupported="desktopWalletSupported" v-if="paymentOption === 'ethereum'"/>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import LightningPaymentAddress from '@/views/payment-screens/components/LightningPaymentAddress'
import BitcoinPaymentAddress from '@/views/payment-screens/components/BitcoinPaymentAddress'
import StacksPaymentAddress from '@/views/payment-screens/components/StacksPaymentAddress'
import EthereumPaymentAddress from '@/views/payment-screens/components/EthereumPaymentAddress'
import FiatPaymentScreen from '@/views/payment-screens/FiatPaymentScreen'

export default {
  name: 'CryptoPaymentScreen',
  components: {
    LightningPaymentAddress,
    BitcoinPaymentAddress,
    EthereumPaymentAddress,
    StacksPaymentAddress,
    FiatPaymentScreen
  },
  data () {
    return {
      expired: false,
      message: null,
      paying: false,
      loading: true
    }
  },
  mounted () {
    this.loading = false
  },
  methods: {
    prev () {
      this.$emit('prev')
    },
    checkChain () {
      this.$store.dispatch('rpayStore/checkPayment').then((invoice) => {
        if (invoice && invoice.opcode === 'btc-crypto-payment-success') {
          this.$store.commit('rpayStore/setDisplayCard', 104)
        }
      })
    }
  },
  computed: {
    desktopWalletSupported () {
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      return paymentOption === 'bitcoin' || paymentOption === 'lightning' || paymentOption === 'stacks1'
    },
    paymentOption () {
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      return paymentOption
    },
    timedOutOrExpired () {
      const expired = this.$store.getters[APP_CONSTANTS.KEY_INVOICE_EXPIRED]
      return expired
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

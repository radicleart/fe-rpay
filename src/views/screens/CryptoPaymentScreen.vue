<template>
<b-card-text class="mb-3">
  <div class="d-flex justify-content-center">
    <div class="mt-5 d-flex justify-content-center" v-if="paymentOption === 'bitcoin1'">
      <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color">Scan the QR Code with <br/> your <b>Bitcoin Wallet</b></span>
      <b-icon :style="$globalLookAndFeel.text2Color" style="margin-top: 5px;" width="25px" height="25px" icon="phone"/>
      <!-- <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color" @click="paymentOption = 'lightning'">Use Lightning</span> -->
    </div>
    <div class="mt-5 d-flex justify-content-center" v-else-if="paymentOption === 'lightning1'">
      <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color">Scan the QR Code with <br/> your <b>Lightning Wallet</b></span>
      <b-icon :style="$globalLookAndFeel.text2Color" style="margin-top: 5px;" width="25px" height="25px" icon="phone"/>
      <!-- <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color" @click="paymentOption = 'bitcoin'">Use to Bitcoin</span> -->
    </div>
    <div class="d-flex justify-content-center" v-else-if="paymentOption === 'fiat'">
    </div>
  </div>
  <div class="" v-if="timedOutOrExpired || expired">
    <div class="d-flex justify-content-center" :style="$globalLookAndFeel.text1Color">
      <b>Lightning invoice has expired - {{timedOutOrExpired}}</b>
    </div>
    <div class="mt-3 d-flex justify-content-center" :style="$globalLookAndFeel.text2Color">
      <b-button @click="prev()" variant="danger" class="text-white button1 bg-danger">Start Over</b-button>
    </div>
  </div>
  <div class="mt-3" v-else>
    <div class="d-flex justify-content-center" :style="$globalLookAndFeel.text1Color">
      <fiat-payment-screen v-on="$listeners" v-if="paymentOption === 'fiat'"/>
      <lightning-payment-address v-on="$listeners" v-if="paymentOption === 'lightning'"/>
      <bitcoin-payment-address v-on="$listeners" v-if="paymentOption === 'bitcoin'"/>
      <stacks-payment-address v-on="$listeners" v-if="paymentOption === 'stacks'"/>
      <ethereum-payment-address v-on="$listeners" v-if="paymentOption === 'ethereum'"/>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import LightningPaymentAddress from '@/views/components/LightningPaymentAddress'
import BitcoinPaymentAddress from '@/views/components/BitcoinPaymentAddress'
import StacksPaymentAddress from '@/views/components/StacksPaymentAddress'
import EthereumPaymentAddress from '@/views/components/EthereumPaymentAddress'
import FiatPaymentScreen from '@/views/screens/FiatPaymentScreen'

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
    }
  },
  computed: {
    paymentOption () {
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      return paymentOption
    },
    timedOutOrExpired () {
      const expired = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE_EXPIRED]
      return expired
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

<template>
<b-card-text class="mb-3">
  <div class="mt-2 d-flex justify-content-center mb-4">
    <div class="d-flex justify-content-center" v-if="paymentOption === 'bitcoin'">
      <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color">Scan the QR Code with <br/> your <b>Bitcoin Wallet</b></span>
      <b-icon :style="$globalLookAndFeel.text2Color" style="margin-top: 5px;" width="25px" height="25px" icon="phone"/>
      <!-- <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color" @click="paymentOption = 'lightning'">Use Lightning</span> -->
    </div>
    <div class="d-flex justify-content-center" v-if="paymentOption === 'lightning'">
      <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color">Scan the QR Code with <br/> your <b>Lightning Wallet</b></span>
      <b-icon :style="$globalLookAndFeel.text2Color" style="margin-top: 5px;" width="25px" height="25px" icon="phone"/>
      <!-- <span class="ff-scanner mr-3" :style="$globalLookAndFeel.text1Color" @click="paymentOption = 'bitcoin'">Use to Bitcoin</span> -->
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
  <div class="" v-else>
    <div class="d-flex justify-content-center" :style="$globalLookAndFeel.text1Color">
      <lightning-payment-address v-on="$listeners" v-if="paymentOption === 'lightning'"/>
      <bitcoin-payment-address v-on="$listeners" v-if="paymentOption === 'bitcoin'"/>
      <stacks-payment-address v-on="$listeners" v-if="paymentOption === 'stacks'"/>
      <ethereum-payment-address v-on="$listeners" v-if="paymentOption === 'ethereum'"/>
    </div>
  </div>
  <div class="mt-2 d-flex justify-content-center mt-5">
    <div class="ff-cancel"><a href="#" @click="$emit('paymentEvent', { opcode: 'switch-method', method: 'fiat' })">Switch to Fiat</a></div>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import LightningPaymentAddress from '@/views/components/LightningPaymentAddress'
import BitcoinPaymentAddress from '@/views/components/BitcoinPaymentAddress'
import StacksPaymentAddress from '@/views/components/StacksPaymentAddress'
import EthereumPaymentAddress from '@/views/components/EthereumPaymentAddress'

export default {
  name: 'CryptoPaymentScreen',
  components: {
    LightningPaymentAddress,
    BitcoinPaymentAddress,
    EthereumPaymentAddress,
    StacksPaymentAddress
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

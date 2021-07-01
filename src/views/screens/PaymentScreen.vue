<template>
<b-card-text class="mb-3">
  <order-info :lookAndFeel="lookAndFeel"/>
  <div class="mt-2 d-flex justify-content-between mb-4">
    <div class="ff-cancel"><a href="#" @click.prevent="prev()">Change / Cancel Order</a></div>
  </div>
  <div class="mt-2 d-flex justify-content-center mb-4">
    <div class="d-flex justify-content-center">
      <span class="ff-scanner mr-3" :style="lookAndFeel.text1Color">Scan the QR Code with <br/> your <b>Lightning Wallet</b></span>
      <font-awesome-icon :style="lookAndFeel.text2Color" style="margin-top: 5px;" width="25px" height="25px" icon="camera"/>
    </div>
  </div>
  <div class="" v-if="timedOutOrExpired || expired">
    <div class="d-flex justify-content-center" :style="lookAndFeel.text1Color">
      <b>Lightning invoice has expired</b>
    </div>
    <div class="mt-3 d-flex justify-content-center" :style="lookAndFeel.text2Color">
      <b-button @click="prev()" variant="danger" class="text-white button1 bg-danger">Start Over</b-button>
    </div>
  </div>
  <div class="" v-else>
    <div class="d-flex justify-content-center" :style="lookAndFeel.text1Color">
      <lightning-payment-address :lookAndFeel="lookAndFeel" v-if="paymentOption === 'lightning'"/>
      <bitcoin-payment-address v-if="paymentOption === 'bitcoin'"/>
      <stacks-payment-address v-if="paymentOption === 'stacks'"/>
      <paypal-payment v-if="paymentOption === 'paypal'"/>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import OrderInfo from '@/views/components/OrderInfo'
import LightningPaymentAddress from '@/views/components/LightningPaymentAddress'
import BitcoinPaymentAddress from '@/views/components/BitcoinPaymentAddress'
import StacksPaymentAddress from '@/views/components/StacksPaymentAddress'
import PaypalPayment from '@/views/components/PaypalPayment'

export default {
  name: 'PaymentScreen',
  components: {
    LightningPaymentAddress,
    BitcoinPaymentAddress,
    StacksPaymentAddress,
    PaypalPayment,
    OrderInfo
  },
  props: ['lookAndFeel'],
  data () {
    return {
      expired: false,
      message: null,
      paying: false,
      paymentOption: null,
      loading: true
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.paymentOption = configuration.paymentOption
    if (configuration.opcode === 'lsat-place-order') {
      this.$store.commit('setDisplayCard', 0)
    }
    this.loading = false
  },
  methods: {
    paymentEvent: function (data) {
      if (data.opcode === 'eth-payment-begun1') {
        this.paying = true
        this.message = 'Sending payment ... takes up to a minute.'
      } else if (data.opcode === 'eth-payment-begun2') {
        this.paying = true
        this.message = 'Payment successful - starting...'
      } else if (data.opcode === 'eth-payment-begun3') {
        this.paying = false
      } else {
        this.paying = false
        this.$emit('paymentEvent', data)
      }
    },
    prev () {
      this.$emit('prev')
    },
    evPaymentExpired () {
      this.loading = true
      this.expired = true
      this.$store.dispatch('deleteExpiredPayment').then(() => {
        this.loading = false
      })
    }
  },
  computed: {
    timedOutOrExpired () {
      const expired = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE_EXPIRED]
      return expired
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/customv2.scss";
.ff-symbol {
  font-weight: 700;
}
.ff-scanner {
  text-align: center;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0px;
  color: #000000;
}
.ff-cancel {
  text-align: left;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0px;
}
.ff-cancel a {
  color: $danger;
}
</style>

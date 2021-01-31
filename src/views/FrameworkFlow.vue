<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto">
    <b-card-group :style="$globalLookAndFeel.cardStyle">
      <b-card header-tag="header" footer-tag="footer" :style="background">
        <div class="d-flex justify-content-center">
          <img class="sq-logo" :src="logo()"/>
        </div>
        <!--
        <template v-slot:header class="">
          <div class="d-flex justify-content-center"><span class="ff-title" :style="$globalLookAndFeel.text1Color">{{$globalLookAndFeel.labels.title}}</span>&nbsp;<span class="ff-subtitle" :style="$globalLookAndFeel.text2Color">{{$globalLookAndFeel.labels.subtitle}}</span></div>
        </template>
        -->

        <!-- <order-info/>
        <crypto-picker v-if="displayCard === 100" v-on="$listeners"/>
         -->
        <div class="mt-5 d-flex flex-column align-items-center">
          <crypto-options class="mt-5"/>
          <crypto-payment-screen v-if="displayCard === 102" v-on="$listeners" stye="position: relative; top: 500px;"/>
        </div>
        <token-screen v-if="displayCard === 104" v-on="$listeners"/>

      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import TokenScreen from './screens/TokenScreen'
import CryptoPaymentScreen from './screens/CryptoPaymentScreen'
// import CryptoPicker from './screens/CryptoPicker'
import CryptoOptions from '@/views/components/CryptoOptions'
// import OrderInfo from '@/views/components/OrderInfo'

export default {
  name: 'FrameworkFlow',
  components: {
    TokenScreen,
    CryptoPaymentScreen,
    // CryptoPicker,
    // OrderInfo,
    CryptoOptions
  },
  data () {
    return {
      // logo1: require('@/assets/img/sq-logo.png'),
      // logo2: require('@/assets/img/btc1.jpeg'),
      message: null,
      paying: false,
      loading: true,
      network: process.env.VUE_APP_NETWORK
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    if (configuration.payment && configuration.payment.amountFiat > 0) {
      this.$store.commit('setDisplayCard', 102)
    } else {
      this.$store.commit('setDisplayCard', 100)
    }
    this.loading = false
  },
  methods: {
    logo () {
      let logo = 'sq-logo.png'
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption !== 'fiat') {
        logo = 'btc1.jpeg'
      }
      if (this.network === 'testnet') {
        return 'https://trpay.risidio.com/img/' + logo
      } else {
        return 'https://trpay.risidio.com/img/' + logo
      }
    }
  },
  computed: {
    background () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.background : ''
    },
    id () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.paymentCode
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss">
.sq-logo {
  width: 200px;
  margin-top: 20px;
  padding-bottom: 10px;
  border-radius: 20px;
}
</style>

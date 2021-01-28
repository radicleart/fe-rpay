<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto">
    <b-card-group :style="$globalLookAndFeel.cardStyle">
      <b-card header-tag="header" footer-tag="footer" :style="background">
        <template v-slot:header class="">
          <div class="d-flex justify-content-center"><span class="ff-title" :style="$globalLookAndFeel.text1Color">{{$globalLookAndFeel.labels.title}}</span>&nbsp;<span class="ff-subtitle" :style="$globalLookAndFeel.text2Color">{{$globalLookAndFeel.labels.subtitle}}</span></div>
        </template>

        <order-info/>
        <div class="Message_if_on_Testnet" v-if="return_network == 'testnet' && method != 'fiat'">Careful, you are using a Testnet network.</div><br/>
        <crypto-options v-if="method !== 'fiat'"/>

        <crypto-picker v-if="displayCard === 100" v-on="$listeners"/>
        <crypto-payment-screen v-if="displayCard === 102 && method === 'bitcoin'" v-on="$listeners"/>
        <fiat-payment-screen :id="id" v-if="displayCard === 102 && method === 'fiat'" v-on="$listeners"/>
        <token-screen  v-if="displayCard === 104" v-on="$listeners"/>

        <!--
        <template v-slot:footer>
          <footer-view :$globalLookAndFeel="$globalLookAndFeel" :rangeValue="displayCard" @rangeEvent="rangeEvent"/>
        </template>
        -->
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import TokenScreen from './screens/TokenScreen'
import CryptoPaymentScreen from './screens/CryptoPaymentScreen'
import CryptoPicker from './screens/CryptoPicker'
import FiatPaymentScreen from '@/views/screens/FiatPaymentScreen'
import CryptoOptions from '@/views/components/CryptoOptions'
import OrderInfo from '@/views/components/OrderInfo'

export default {
  name: 'FrameworkFlow',
  components: {
    TokenScreen,
    CryptoPaymentScreen,
    CryptoPicker,
    FiatPaymentScreen,
    OrderInfo,
    CryptoOptions
  },
  data () {
    return {
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
    rangeEvent (screen) {
      this.$store.commit('setDisplayCard', screen)
    }
  },
  computed: {
    return_network () {
      console.log(this.network)
      return (this.network)
    },
    background () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.background : ''
    },
    id () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.paymentCode
    },
    method () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.method
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss">
.ff-title {
  font-weight: 300;
  font-size: 14px;
  letter-spacing: 0px;
  margin-right: 5px;
}
.ff-subtitle {
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0px;
}
.card-group {
  margin: 10px 10px 10px 10px;
  border: none;
  font-family: 'Montserat', sans-serif;
  min-width: 350px;
  min-height: 500px;
}
.card-header {
  background-color: #fff;
}
.card-footer {
  background-color: #fff;
}
.card {
  background-color: #fff !important;
  border: none;
  border-radius: 25px;
}
.Message_if_on_Testnet{
  color: red;
  font-style: italic;
}
</style>

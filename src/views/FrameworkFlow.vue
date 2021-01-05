<template>
<waiting-view v-if="loading" />
<div class="d-flex justify-content-center" v-else>
  <div class="mx-auto">
    <b-card-group :style="lookAndFeel.cardStyle">
      <b-card header-tag="header" footer-tag="footer" :style="background">
        <template v-slot:header class="">
          <div class="d-flex justify-content-center"><span class="ff-title" :style="lookAndFeel.text1Color">{{lookAndFeel.labels.title}}</span>&nbsp;<span class="ff-subtitle" :style="lookAndFeel.text2Color">{{lookAndFeel.labels.subtitle}}</span></div>
        </template>

        <crypto-picker v-if="displayCard === -1" :lookAndFeel="lookAndFeel" @paymentEvent="paymentEvent"/>
        <quantity-screen v-if="displayCard === 0" :lookAndFeel="lookAndFeel" @placeOrder="placeOrder"/>
        <payment-screen  v-if="displayCard === 1" :lookAndFeel="lookAndFeel" @prev="prev"/>
        <token-screen  v-if="displayCard === 2" :lookAndFeel="lookAndFeel" @prev="prev"/>

        <template v-slot:footer>
          <footer-view :lookAndFeel="lookAndFeel" :rangeValue="displayCard" @rangeEvent="rangeEvent"/>
        </template>
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import FooterView from './components/templ/FooterView'
import TokenScreen from './screens/TokenScreen'
import QuantityScreen from './screens/QuantityScreen'
import PaymentScreen from './screens/PaymentScreen'
import WaitingView from './components/WaitingView'
import CryptoPicker from './screens/CryptoPicker'

export default {
  name: 'FrameworkFlow',
  components: {
    TokenScreen,
    QuantityScreen,
    PaymentScreen,
    WaitingView,
    FooterView,
    CryptoPicker
  },
  props: ['lookAndFeel'],
  data () {
    return {
      message: null,
      paying: false,
      loading: true
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
    if (configuration.mode === 'rpay-crowdfund') {
      this.$store.commit('setDisplayCard', -1)
      if (paymentChallenge.status > 3) {
        this.$store.commit('setDisplayCard', 2)
      }
    } else {
      if (paymentChallenge.status > 3) {
        this.$store.commit('setDisplayCard', 2)
      } else if (paymentChallenge.lsatInvoice && paymentChallenge.lsatInvoice.paymentHash) {
        this.$store.commit('setDisplayCard', 0)
      }
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
      } else if (data.opcode === 'cfd-payment-1') {
        this.$store.dispatch('generateInvoice').then((invoice) => {
          this.$store.commit('setDisplayCard', 101)
        })
      } else {
        this.paying = false
        this.$emit('paymentEvent', data)
      }
    },
    rangeEvent (screen) {
      this.$store.commit('setDisplayCard', screen)
    },
    placeOrder () {
      const displayCard = 1
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('reinitialiseApp', configuration).then((paymentChallenge) => {
        this.$emit('paymentEvent', { opcode: 'lsat-payment-begun1', paymentChallenge: paymentChallenge })
        this.loading = false
        this.$store.commit('setDisplayCard', displayCard)
        this.rangeValue = displayCard
      })
    },
    prev () {
      let displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      displayCard--
      if (displayCard < 0 || displayCard === 1) {
        displayCard = 0
      }
      this.rangeValue = displayCard
      this.$store.commit('setDisplayCard', displayCard)
    }
  },
  computed: {
    background () {
      return (this.lookAndFeel) ? this.lookAndFeel.background : ''
    },
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/customv2.scss";
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
</style>

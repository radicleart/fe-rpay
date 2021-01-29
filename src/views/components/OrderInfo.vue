<template>
<b-card-text>
  <div v-if="method === 'fiat' || 'bitcoin'" class="d-column align-items-center text-center">
    <h1 class="mb-2" :style="$globalLookAndFeel.text1Color"><span class="" v-html="fiatSymbol"></span> {{formattedFiat}}</h1>
    <div class="" :style="$globalLookAndFeel.text1Color">[ <span class="" v-html="currentSymbol"></span> {{currentAmount}} ]</div>
  </div>
  <div v-else class="d-column align-items-center text-center">
    <h1 class="" :style="$globalLookAndFeel.text1Color"><span class="" v-html="currentSymbol"></span> {{currentAmount}}</h1>
    <div class="mb-2" :style="$globalLookAndFeel.text1Color">[ <span class="" v-html="fiatSymbol"></span> {{formattedFiat}} ]</div>
  </div>
  <div class="my-2 d-flex justify-content-center ">
    <div class="text-info mb-2" :style="$globalLookAndFeel.text2Color">Thank you for your support!</div>
  </div>
  <div class="text-center border-bottom pb-4 mb-4 text-danger" v-if="network == 'testnet'">testnet</div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'OrderInfo',
  components: {
  },
  data () {
    return {
      value: 0,
      network: process.env.VUE_APP_NETWORK,
      componentKey: 0,
      numbCredits: 2,
      updatingCredits: false,
      timeout: false,
      message: null,
      paying: false,
      paymentOption: null,
      waitingMessage: 'Loading payment options...',
      resizeTimer: null,
      loading: true,
      fullPage: true
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
  },
  computed: {
    method () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.method
    },
    formattedFiat () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const amountFiat = (configuration.payment) ? configuration.payment.amountFiat : '0'
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amountFiat) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const fc = (configuration.payment) ? configuration.payment.currency : '???'
      if (fc === 'EUR') {
        return '&euro;'
      } else if (fc === 'GBP') {
        return '&pound;'
      } else {
        return '&dollar;'
      }
    },
    currentSymbol () {
      const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#x0e3f;' // '&#x20BF;' // '&#8383;'
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
    }
  }
}
</script>
<style lang="scss" scoped>
.ff-symbol {
  font-weight: 700;
}
.ff-placed {
  text-align: left;
  font-weight: 200;
  font-size: 10px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.tokens {
  font-weight: bold;
}
.message-if-on-testnet {
  color: red;
  font-style: italic;
}
</style>

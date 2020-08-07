<template>
<div>
  <div class="mt-2 d-flex justify-content-between border-bottom pb-4 mb-4">
    <div>
      <div class="mb-2 ff-placed">You placed the following order:</div>
      <div class="text-warning">{{currentQuantity}} {{quantityLabel}}</div>
    </div>
    <div class="text-warn">
      <div class="mb-2"><span class="ff-symbol" v-html="fiatSymbol"></span> {{formattedFiat}}</div>
      <div class=""><span class="ff-symbol" v-html="currentSymbol"></span> {{currentAmount}}</div>
    </div>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'OrderInfo',
  components: {
  },
  props: ['lookAndFeel'],
  data () {
    return {
      value: 0,
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
    currentQuantity () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.creditAttributes.start
    },
    quantityLabel () {
      if (this.lookAndFeel && this.lookAndFeel.labels && this.lookAndFeel.labels.quantityLabel) {
        return this.lookAndFeel.labels.quantityLabel
      }
      return 'items'
    },
    formattedFiat () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const amount = (paymentChallenge.xchange) ? paymentChallenge.xchange.amountFiat : '0'
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amount) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      const fc = (paymentChallenge.xchange) ? paymentChallenge.xchange.fiatCurrency : '???'
      if (fc === 'EUR') {
        return '&euro;'
      } else if (fc === 'GBP') {
        return '&pound;'
      } else {
        return '&dollar;'
      }
    },
    currentSymbol () {
      if (this.paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (this.paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#x0e3f;' // '&#x20BF;' // '&#8383;'
      }
    },
    currentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      if (paymentChallenge.xchange) {
        if (this.paymentOption === 'ethereum') {
          return paymentChallenge.xchange.amountEth
        } else if (this.paymentOption === 'stacks') {
          return paymentChallenge.xchange.amountStx
        } else {
          return paymentChallenge.xchange.amountBtc
        }
      } else {
        return 0
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/assets/scss/customv2.scss";
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
.ff-scanner {
  text-align: center;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.ff-cancel {
  text-align: left;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0px;
  color: #FF7272;
  opacity: 1;
}
</style>

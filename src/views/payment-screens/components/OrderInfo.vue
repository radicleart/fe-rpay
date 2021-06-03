<template>
<b-card-text class="oi-card-text">
  <div class="mx-5 pt-5 row">
    <div class="text-right col-6">
      <div @click="backToCredits" class="cursor-pointer text-one">Your <span class="text-danger" v-if="network == 'testnet'">testnet</span> order <b-icon icon="pencil"/></div>
    </div>
    <div class="text-left col-6">
      <div class="text-one"><span class="text-two" v-html="numbUnits"></span> units @ <span class="text-two" v-html="fiatSymbol"></span> {{formattedFiat}}</div>
      <div class="text-one"><span class="text-two" v-html="fiatSymbol"></span> {{formattedTotalFiat}}</div>
      <div class="text-one"><span class="text-two" v-html="currentSymbol"></span> {{currentAmount}}</div>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'OrderInfo',
  components: {
  },
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
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    this.paymentOption = configuration.payment.paymentOption
    this.loading = false
  },
  methods: {
    backToCredits () {
      this.$store.commit('rpayStore/setDisplayCard', 100)
    }
  },
  computed: {
    network () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.network
    },
    numbUnits () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.creditAttributes.start
    },
    method () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.paymentOption
    },
    formattedFiat () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const amountFiat = (configuration.payment) ? configuration.payment.amountFiat : '0'
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amountFiat) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    formattedTotalFiat () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      let amountFiat = (configuration.payment) ? configuration.payment.amountFiat : '0'
      amountFiat = amountFiat * configuration.payment.creditAttributes.start
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amountFiat) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
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
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      if (paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#8383;' // '&#x20BF;' // '&#8383;'
      }
    },
    currentAmount () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
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
.cursor-pointer {
  cursor: pointer;
}
</style>

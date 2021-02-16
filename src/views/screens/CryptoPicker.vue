<template>
    <div class="mt-5" :style="$globalLookAndFeel.text1Color">
      <p class="text-white d-flex justify-content-center">{{$globalLookAndFeel.labels.card2Label1}}</p>
      <div class="mt-5 text-white d-flex justify-content-center" style="margin-top: 20px; text-align: center; width: 100%;">
        <span @click.prevent="countDown" class="stepper" :style="(fadeMin) ? 'opacity: 0.3;' : ''">
          <b-icon class="text-info" width="35px" height="35px" icon="chevron-double-down"/>
        </span>
        <input class="mx-3 input1" @input="updateCredits($event)" id="input-horizontal1" v-model="localCredits" placeholder="$$$"/>
        <span @click.prevent="countUp" class="stepper" :style="(fadeMax) ? 'opacity: 0.3;' : ''">
          <b-icon class="text-info" width="35px" height="35px" icon="chevron-double-up"/>
        </span>
      </div>
      <div v-if="loading" class="mt-5 d-flex justify-content-center">
        <waiting-view/>
      </div>
      <div v-else class="mt-5 text-white d-flex justify-content-center">
        <div>
          <p>Total</p>
          <div>
            <span class="symbol" v-html="fiatSymbol"></span> <span>{{formattedFiat}} {{config.payment.currency}}</span>
          </div>
          <div style="margin-bottom: 20px; margin-top: 20px;">
            <span class="symbol" v-html="currentSymbol"></span> <span>{{currentAmount}} BTC</span>
          </div>
        </div>
      </div>
      <div class="text-center mt-5">
        <b-button variant="danger" @click.prevent="continueToPayment()">Continue <b-icon icon="b-icon-arrow-right"/></b-button>
      </div>
    </div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import WaitingView from '@/views/components/WaitingView'

export default {
  name: 'CryptoStepper',
  components: {
    WaitingView
  },
  props: ['paymentOption'],
  data () {
    return {
      localCredits: 0,
      loading: false
    }
  },
  mounted () {
    const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.localCredits = config.creditAttributes.start
  },
  methods: {
    continueToPayment () {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStore/initialiseApp', config).then(() => {
        this.$store.commit('rpayStore/setDisplayCard', 102)
      })
    },
    countDown () {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (this.localCredits <= config.creditAttributes.min) {
        return
      }
      if (this.localCredits < config.creditAttributes.min + config.creditAttributes.step) {
        this.localCredits = config.creditAttributes.min
      } else {
        this.localCredits -= config.creditAttributes.step
      }
      this.updateCredits()
    },
    countUp () {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (this.localCredits >= config.creditAttributes.max) {
        return
      }
      this.localCredits += config.creditAttributes.step
      this.updateCredits()
    },
    updateCredits (evt) {
      const config = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      let numbC = 0
      try {
        if (this.localCredits.length === 0) {
          return
        }
        if (isNaN(this.localCredits)) {
          // this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be a number between ' + config.creditAttributes.min + ' and ' + config.creditAttributes.max + '!' })
          this.localCredits = config.creditAttributes.start
          return
        }
        numbC = Number(this.localCredits)
        if (numbC < config.creditAttributes.min || numbC > config.creditAttributes.max) {
          // this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be a number between ' + config.creditAttributes.min + ' and ' + config.creditAttributes.max + '!' })
          this.localCredits = config.creditAttributes.start
        }
      } catch (e) {
        // this.$notify({ type: 'warn', title: 'Number of Credits', text: 'Credits must be a number between ' + config.creditAttributes.min + ' and ' + config.creditAttributes.max + '!' })
        this.localCredits = config.creditAttributes.start
      }
      this.$store.dispatch('rpayStore/updateAmount', { numbCredits: this.localCredits })
    }
  },
  computed: {
    quantityLabel () {
      let ql = 'Spins'
      if (this.$globalLookAndFeel.labels && this.$globalLookAndFeel.labels.quantityLabel) {
        ql = this.$globalLookAndFeel.labels.quantityLabel
      }
      return ql
    },
    config () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration
    },
    fadeMin () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return this.localCredits === configuration.creditAttributes.min
    },
    fadeMax () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return this.localCredits === configuration.creditAttributes.max
    },
    currentSymbol () {
      if (this.paymentOption === 'ethereum') {
        return 'Ξ'
      } else if (this.paymentOption === 'stacks') {
        return '&#931;'
      } else {
        return '&#8383;' // '&#x20BF;' // '&#8383;'
      }
    },
    formattedFiat () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const amount = configuration.payment.amountFiat * configuration.creditAttributes.start
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amount) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const fc = configuration.payment.currency
      if (fc === 'EUR') {
        return '&euro;'
      } else if (fc === 'GBP') {
        return '&pound;'
      } else {
        return '&dollar;'
      }
    },
    amountFiat () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const amount = configuration.payment.amountFiat * configuration.creditAttributes.start
      return amount
    },
    fiatCurrency () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.currency
    },
    currentAmount () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const precision = 100000000
      return Math.round(configuration.payment.amountBtc * configuration.creditAttributes.start * precision) / precision
    }
  }
}
</script>
<style lang="scss" scoped>
.ff-label {
  text-align: left;
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
p.ff-total {
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
  margin-bottom: 10px;
}
.input1 {
  width: 48px;
  height: 45px;
  text-align: center;
  background: #FFFFFF 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029;
  border-radius: 5px;
  border: none;
  opacity: 1;
}
.symbol {
  width: 13px;
  height: 13px;
  opacity: 1;
}
.stepper {
  padding: 5px;
  cursor: pointer;
  position: relative;
  top: 7px;
}
</style>

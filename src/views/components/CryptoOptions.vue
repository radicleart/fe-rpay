<template>
<b-card-text class="text-center mx-4">
  <div class="mb-3 d-flex justify-content-center">
    <img height="70px" class="rpay-sq-logo" :src="logo"/>
  </div>
  <div class="text-center text-bold" v-if="options.length > 1">Select your payment method</div>
  <div class="mx-5">
    <span v-for="(option, index) in options" :key="index">
      <b-button @click="changePaymentOption(option.value)" :variant="$globalLookAndFeel.variant0" :class="(currentOption === option.value) ? 'co-option-on' : 'co-option-off'"><span v-if="option.value === 'fiat'">Card</span><span v-else>{{option.value}}</span></b-button>
    </span>
  </div>
</b-card-text>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'CryptoOptions',
  components: {
  },
  data () {
    return {
      selected: 'bitcoin',
      logoSq: 'https://images.prismic.io/risidio-journal/6da1afe7-fb24-4cff-be77-144d4354f41d_square.png?auto=compress,format',
      logoOn: 'https://images.prismic.io/risidio-journal/65a893ce-421d-45bf-b883-8cb77fda2763_Sans-titre-1+%283%29.png?auto=compress,format',
      logoEth: 'https://images.prismic.io/risidio-journal/6b859d7d-c60e-470f-994c-ab2ae1bff130_eht.png?auto=compress,format',
      logoStx: 'https://images.prismic.io/risidio-journal/fc57a581-b1d3-4c2b-9481-cee2f38c3437_stacks.png?auto=compress,format'
    }
  },
  mounted () {
    const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
    this.selected = paymentOption
  },
  methods: {
    changePaymentOption: function (method) {
      this.$store.commit(APP_CONSTANTS.SET_PAYMENT_OPTION_VALUE, method)
    }
  },
  computed: {
    options () {
      const paymentOptions = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTIONS]
      return paymentOptions
    },
    currentOption () {
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      return paymentOption
    },
    logo () {
      const paymentOption = this.$store.getters[APP_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
      let logo = this.logoSq
      if (paymentOption === 'stacks') {
        logo = this.logoStx
      } else if (paymentOption === 'ethereum') {
        logo = this.logoEth
      } else if (paymentOption === 'lightning' || paymentOption === 'bitcoin') {
        logo = this.logoOn
      }
      return logo
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

<template>
<b-card-text class="mt-5 text-center">
  <b-form-group v-slot="{ ariaDescribedby }">
    <b-form-radio-group
      id="radio-group-1"
      v-model="selected"
      v-on:change="changePaymentOption"
      :options="options"
      :aria-describedby="ariaDescribedby"
      name="radio-options"
    ></b-form-radio-group>
  </b-form-group>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'CryptoOptions',
  components: {
  },
  data () {
    return {
      selected: 'bitcoin'
    }
  },
  mounted () {
    const paymentOption = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTION_VALUE]
    this.selected = paymentOption
  },
  methods: {
    changePaymentOption: function (method) {
      this.$store.commit(LSAT_CONSTANTS.SET_PAYMENT_OPTION_VALUE, method)
    }
  },
  computed: {
    options () {
      const paymentOptions = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTIONS]
      return paymentOptions
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

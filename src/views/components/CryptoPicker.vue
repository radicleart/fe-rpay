<template>
<b-card-text>
  <p>{{messages.card1Label}}</p>
  <div v-for="(option, index) in options" :key="index">
    <p class="mx-4 p-4 network" @click.prevent="changePayment(option.value)" :class="(paymentOption === option.value) ? 'chosen' : ''">{{option.text}}</p>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'CryptoPicker',
  components: {
  },
  props: ['paymentOption', 'messages'],
  data () {
    return {
      selected: null,
      options: null
    }
  },
  watch: {
    'paymentOption' () {
      this.selected = this.paymentOption
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    this.selected = configuration.paymentOption
    this.options = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_OPTIONS]
  },
  methods: {
    changePayment (value) {
      this.$emit('updatePaymentOption', value)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
.network {
  background: #F5F5F5 0% 0% no-repeat padding-box;
  border-radius: 11px;
  opacity: 0.51;
  padding: 10px;
  cursor: pointer;
  color: #000000;
  font-weight: 700;
}
.chosen {
  background: #F9B807 0% 0% no-repeat padding-box;
}

</style>

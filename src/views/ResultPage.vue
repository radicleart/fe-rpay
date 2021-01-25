<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto">
    <b-card-group :style="$globalLookAndFeel.cardStyle">
      <b-card header-tag="header" footer-tag="footer" :style="background">
        <template v-slot:header class="">
          <div class="d-flex justify-content-center"><span class="ff-title" :style="$globalLookAndFeel.text1Color">{{$globalLookAndFeel.labels.title}}</span>&nbsp;<span class="ff-subtitle" :style="$globalLookAndFeel.text2Color">{{$globalLookAndFeel.labels.subtitle}}</span></div>
        </template>

        <order-info/>
        <div class="mt-5 text-info text-center">Payment detected with thanks!</div>
        <div class="mt-5 text-light">Status: {{invoiceStatus}}</div>
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import OrderInfo from '@/views/components/OrderInfo'

export default {
  name: 'ResultPage',
  components: {
    OrderInfo
  },
  props: ['result'],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
    invoiceStatus () {
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      return invoice.data.status
    },
    cardStyle () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.cardStyle : ''
    },
    background () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.background : ''
    }
  }
}
</script>
<style lang="scss">
</style>

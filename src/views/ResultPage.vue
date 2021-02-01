<template>
<div class="d-flex justify-content-center">
  <div class="mx-auto">
    <b-card-group :style="$globalLookAndFeel.cardStyle">
      <b-card header-tag="header" footer-tag="footer" :style="background">
        <div style="padding-top: 300px;" class="mt-5 text-info text-center">Payment detected with thanks!</div>
      </b-card>
    </b-card-group>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'ResultPage',
  components: {
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
<style lang="scss" scoped>
</style>

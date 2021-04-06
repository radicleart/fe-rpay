<template>
<div class="row">
  <div class="col-12 mb-5">
    <div role="group">
      <p>Item is not currently on sale!</p>
    </div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'

export default {
  name: 'NotForSale',
  components: {
  },
  data () {
    return {
    }
  },
  mounted () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    this.buyNowOrStartingPrice = utils.toDecimals(utils.fromMicroAmount(configuration.gaiaAsset.saleData.buyNowOrStartingPrice))
    this.$emit('updateSaleDataInfo', { moneyField: true, field: 'buyNowOrStartingPrice', value: 0 })
    this.$emit('updateSaleDataInfo', { moneyField: true, field: 'reservePrice', value: 0 })
    this.$emit('updateSaleDataInfo', { moneyField: true, field: 'incrementPrice', value: 0 })
    this.$emit('updateSaleDataInfo', { field: 'saleType', value: 0 })
  },
  methods: {
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

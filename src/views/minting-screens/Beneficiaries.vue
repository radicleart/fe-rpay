<template>
<b-card-text class="text-center mx-4">
  <div class="d-flex justify-content-between border-bottom">
    <div>Royalties</div>
    <div><b-button variant="info"  @click="addBeneficiary">add beneficiary</b-button></div>
  </div>
  <div class="">
    <span v-for="(beneficiary, index) in beneficiaries" :key="index">
      <beneficiary :index="index"/>
    </span>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import Beneficiary from './Beneficiary'

export default {
  name: 'Beneficiaries',
  components: {
    Beneficiary
  },
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    addBeneficiary: function () {
      this.$store.commit('rpayStore/setEditBeneficiary', null)
      this.$store.commit('rpayStore/setDisplayCard', 102)
    }
  },
  computed: {
    beneficiaries: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.beneficiaries
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

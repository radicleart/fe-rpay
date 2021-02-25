<template>
<b-card-text class="mx-4">
  <h2 class="text-bold">Royalties</h2>
  <div class="">
    <span v-for="(beneficiary, index) in beneficiaries" :key="index">
      <beneficiary :index="index"/>
    </span>
  </div>
  <div class="text-small mt-4 text-right">Add a contributer <a href="#" class="ml-2 text-two" style="font-size: 24px;" @click="addBeneficiary"><b-icon scale="1em" icon="plus-circle"/></a></div>
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

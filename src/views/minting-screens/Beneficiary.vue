<template>
<b-card-text class="">
  <div class="d-flex justify-content-between" v-if="beneficiary">
    <div><a href="#" @click="editBeneficiary()">{{chainAddress()}}</a></div>
    <div>Royalty: {{beneficiary.royalty}} %</div>
    <!--
    role: {{beneficiary.role}},
    email: {{beneficiary.email}},
    royalties: {{beneficiary.royalty}},
    chainAddress: {{beneficiary.chainAddress}},
    -->
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'Beneficiary',
  components: {
  },
  props: ['index'],
  data () {
    return {
    }
  },
  mounted () {

  },
  methods: {
    chainAddress: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const bene = configuration.minter.beneficiaries[this.index]
      return bene.chainAddress.substring(0, 5) + '...' + bene.chainAddress.substring(bene.chainAddress.length - 5)
    },
    editBeneficiary: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.commit('rpayStore/setEditBeneficiary', configuration.minter.beneficiaries[this.index])
      this.$store.commit('rpayStore/setDisplayCard', 102)
    }
  },
  computed: {
    beneficiary: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.beneficiaries[this.index]
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

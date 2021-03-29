<template>
<div>
  <div class="d-flex justify-content-between" v-if="beneficiary">
    <div><a href="#" @click.prevent="showBeneficiary = !showBeneficiary">{{chainAddress()}}</a></div>
    <div class="text-small d-flex justify-content-between">
      <div class="mr-5">{{displayBeneficiary(beneficiary.royalty)}} %</div>
      <div v-if="index > 1" style="width: 40px;">
        <a href="#" @click="editBeneficiary()"><b-icon icon="pencil"/></a>
        <a class="ml-2 text-danger" href="#" @click="removeBeneficiary()"><b-icon icon="trash"/></a>
      </div>
      <div v-else style="width: 40px;">
      </div>
    </div>
  </div>
  <div class="text-small" style="font-size: 0.6rem;" v-if="showBeneficiary">
    <div class="row">
      <div class="col-3">Address</div>
      <div class="col-9">{{beneficiary.chainAddress}}</div>
    </div>
    <div class="row">
      <div class="col-3">Royalty</div>
      <div class="col-9">{{beneficiary.royalty}}</div>
    </div>
    <div class="row">
      <div class="col-3">Role</div>
      <div class="col-9">{{beneficiary.role}}</div>
    </div>
    <div class="row">
      <div class="col-3">Username</div>
      <div class="col-9">{{beneficiary.username}}</div>
    </div>
    <div class="row">
      <div class="col-3">Email</div>
      <div class="col-9">{{beneficiary.email}}</div>
    </div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'Beneficiary',
  components: {
  },
  props: ['index'],
  data () {
    return {
      showBeneficiary: false
    }
  },
  mounted () {

  },
  methods: {
    chainAddress: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const bene = configuration.minter.beneficiaries[this.index]
      if (bene.username) return bene.username
      return bene.chainAddress.substring(0, 5) + '...' + bene.chainAddress.substring(bene.chainAddress.length - 5)
    },
    displayBeneficiary: function (num) {
      return parseFloat(num).toFixed(2)
    },
    editBeneficiary: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.$store.commit('rpayStore/setEditBeneficiary', configuration.minter.beneficiaries[this.index])
      this.$store.commit('rpayStore/setDisplayCard', 102)
    },
    removeBeneficiary: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      configuration.minter.beneficiaries.splice(this.index, 1)
      this.$store.commit('rpayStore/addConfiguration', configuration)
    }
  },
  computed: {
    beneficiary: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.beneficiaries[this.index]
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

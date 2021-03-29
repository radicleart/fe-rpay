<template>
<b-card-group class="">
  <b-card header-tag="header" footer-tag="footer" class="rpay-card">
    <b-card-text class="m-4">
      <b-form>
        <p class="">Add Contributer</p>
        <div class="row">
          <div class="col-md-12">
            <div class="mb-3" role="group">
              <label class="text2" for="chain-address">{{preferredNetwork}} Address</label>
              <b-form-input
                id="chain-address"
                v-model="beneficiary.chainAddress"
                :state="chainAddressState"
                aria-describedby="chain-address-help chain-address-feedback"
                placeholder="Enter wallet address"
                trim
              ></b-form-input>
              <b-form-invalid-feedback id="chain-address-feedback">
                Enter at least 3 letters
              </b-form-invalid-feedback>
              <b-form-text id="chain-address-help">Royalties on sale will be sent to this address</b-form-text>
            </div>

            <div class="mb-4">
              <div class="text-left d-flex justify-content-between">
                <div class="w-50">Desired royalties</div>
                <div class="w-50">
                  <div class="mb-3" role="group">
                    <b-input-group size="sm" append="%">
                      <b-form-input
                        type="number"
                        id="royalty"
                        :state="royaltyState"
                        aria-describedby="royalty-help royalty-feedback"
                        placeholder="Enter royalty"
                        trim
                        @keyup="toDecimals()"
                        v-model.number="beneficiary.royalty">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback id="royalty-feedback">
                      Between 0 and 50
                    </b-form-invalid-feedback>
                    <b-form-text id="royalty-help">To recieve on sale of each edition.</b-form-text>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-3" role="group">
              <label class="text2" for="username">Username</label>
              <b-form-input
                id="username"
                v-model="beneficiary.username"
                aria-describedby="username-help username-feedback"
                placeholder="Enter username"
                trim
              ></b-form-input>
              <b-form-invalid-feedback id="username-feedback">
                Enter at least 3 letters
              </b-form-invalid-feedback>
              <b-form-text id="username-help">Username this person</b-form-text>
            </div>

            <div class="mb-3" role="group">
              <label class="text2" for="email">Email</label>
              <b-form-input
                id="email"
                v-model="beneficiary.email"
                aria-describedby="email-help email-feedback"
                placeholder="Enter email"
                trim
              ></b-form-input>
              <b-form-invalid-feedback id="email-feedback">
                Enter at least 3 letters
              </b-form-invalid-feedback>
              <b-form-text id="email-help">Email for this person</b-form-text>
            </div>

            <div class="mb-3" role="group">
              <label class="text2" for="role">Role</label>
              <b-form-input
                id="role"
                v-model="beneficiary.role"
                aria-describedby="role-help role-feedback"
                placeholder="Enter role"
                trim
              ></b-form-input>
              <b-form-invalid-feedback id="role-feedback">
                Enter at least 3 letters
              </b-form-invalid-feedback>
              <b-form-text id="role-help">Role in relationship to this item</b-form-text>
            </div>
          </div>
        </div>
      </b-form>
    </b-card-text>
    <template v-slot:footer>
      <div class="footer-container my-2">
        <div class="d-flex justify-content-between">
          <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="cancel()">Cancel</b-button>
          <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="addBeneficiary()">Save</b-button>
        </div>
      </div>
    </template>
  </b-card>
</b-card-group>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'AddBeneficiaryScreen',
  components: {
  },
  data () {
    return {
      formSubmitted: false,
      savedChainAddress: null,
      beneficiary: {
        royalty: 0,
        chainAddress: '',
        role: '',
        username: '',
        email: ''
      }
    }
  },
  mounted () {
    const benef = this.$store.getters[APP_CONSTANTS.KEY_EDIT_BENEFICIARY]
    this.toDecimals()
    if (benef) {
      this.beneficiary = benef
      this.savedChainAddress = benef.chainAddress
    }
  },
  methods: {
    toDecimals: function () {
      this.beneficiary.royalty = Math.round(this.beneficiary.royalty * 100) / 100
    },
    cancel: function () {
      this.$store.commit('rpayStore/setDisplayCard', 100)
    },
    isValid: function (param) {
      if (param === 'chainAddress') {
        return (this.beneficiary.chainAddress.length > 10)
      } else if (param === 'royalty') {
        return typeof this.beneficiary.royalty === 'number' && this.beneficiary.royalty > 0 && this.beneficiary.royalty <= 50
      }
      this.$store.commit('rpayStore/setDisplayCard', 100)
    },
    addBeneficiary: function () {
      this.formSubmitted = true
      if (!this.isValid('chainAddress') | !this.isValid('royalty')) return
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const index = configuration.minter.beneficiaries.findIndex((obj) => obj.chainAddress === this.savedChainAddress)
      if (index > -1) {
        configuration.minter.beneficiaries.splice(index, 1, this.beneficiary)
      } else {
        configuration.minter.beneficiaries.push(this.beneficiary)
      }
      this.$store.commit('rpayStore/addConfiguration', configuration)
      configuration.opcode = 'save-mint-data'
      window.eventBus.$emit('rpayEvent', configuration)
      this.$store.commit('rpayStore/setDisplayCard', 100)
    }
  },
  computed: {
    chainAddressState () {
      if (!this.formSubmitted && !this.beneficiary.chainAddress) return false
      return this.isValid('chainAddress')
    },
    royaltyState () {
      if (!this.formSubmitted && !this.beneficiary.royalty) return false
      return this.isValid('royalty')
    },
    preferredNetwork () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.preferredNetwork
    }
  }
}
</script>
<style lang="scss" scoped>
.text2 {
  text-transform: capitalize;
}
</style>

<template>
<b-card-text class="text-center mx-4" v-if="editingNetwork">
  <div class="text-center text-bold">Select a network</div>
  <div class="mt-3 mx-5">
    <span v-for="(option, index) in networks" :key="index">
      <b-button @click="changeNetwork(option.network)" :variant="$globalLookAndFeel.variant0" :class="(preferredNetwork === option.network) ? 'no-option-on mb-4' : 'no-option-off mb-4'"><span>{{option.network}}</span></b-button>
    </span>
  </div>
</b-card-text>
<b-card-text class="text-center mx-4" v-else>
  <div class="text-center text-bold">Network: {{preferredNetwork}}  <a v-if="allowEdit && networks > 1" href="#" class="text-info" @click.prevent="editNetwork()"><b-icon icon="pencil"/></a></div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'NetworkOptions',
  components: {
  },
  props: ['allowEdit'],
  data () {
    return {
      editingNetwork: false
    }
  },
  mounted () {
  },
  methods: {
    changeNetwork: function (method) {
      this.$store.commit(LSAT_CONSTANTS.SET_PREFERRED_NETWORK_VALUE, method)
      this.editingNetwork = false
    },
    editNetwork: function (method) {
      this.editingNetwork = true
    }
  },
  computed: {
    networks: function () {
      const networks = this.$store.getters[LSAT_CONSTANTS.KEY_ENABLED_NETWORKS]
      return networks
    },
    preferredNetwork () {
      const preferredNetwork = this.$store.getters[LSAT_CONSTANTS.KEY_PREFERRED_NETWORK]
      return preferredNetwork.network
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

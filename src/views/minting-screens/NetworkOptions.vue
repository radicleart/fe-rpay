<template>
<b-card-text class="text-center mx-4">
  <div class="text-center text-bold">Select a network</div>
  <div class="mx-5">
    <span v-for="(option, index) in networks" :key="index">
      <b-button @click="changeNetwork(option.network)" variant="warning" :class="(preferredNetwork === option.network) ? 'co-option-on' : 'co-option-off'"><span>{{option.network}}</span></b-button>
    </span>
  </div>
</b-card-text>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'NetworkOptions',
  components: {
  },
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
    changeNetwork: function (method) {
      this.$store.commit(LSAT_CONSTANTS.SET_PREFERRED_NETWORK_VALUE, method)
    }
  },
  computed: {
    networks: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.networks
    },
    preferredNetwork () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.preferredNetwork
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

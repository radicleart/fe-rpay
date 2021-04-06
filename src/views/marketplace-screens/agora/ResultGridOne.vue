<template>
<div class="">
  <div v-for="(result, index) in resultSet" :key="index" :class="gridClasses">
    <result-item-one :result="result" />
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import ResultItemOne from '@/views/marketplace-screens/agora/ResultItemOne'

export default {
  name: 'ResultGrid',
  components: {
    ResultItemOne
  },
  props: ['resultSet', 'gridClasses'],
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {
    application () {
      const application = this.$store.getters[APP_CONSTANTS.KEY_APPLICATION_FROM_REGISTRY_BY_CONTRACT_ID](this.contractId)
      return (application && application.gaiaProject) ? application : null
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

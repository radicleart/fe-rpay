<template>
<div class="row mb-4">
  <div v-for="(result, index) in resultSet" :key="index" :class="gridClasses">
    <result-item :result="result" />
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import ResultItem from '@/views/marketplace-screens/agora/ResultItem'

export default {
  name: 'ResultGrid',
  components: {
    ResultItem
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

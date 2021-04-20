<template>
<div class="row mb-4">
  <div v-for="(result, index) in resultSet" :key="index" :class="gridClasses" class="p-0 m-0">
    <result-item-risidio :result="result" />
  </div>
</div>
</template>

<script>
import ResultItemRisidio from './ResultItemRisidio'

export default {
  name: 'ResultGridRisidio',
  components: {
    ResultItemRisidio
  },
  props: ['resultSet', 'gridClasses'],
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

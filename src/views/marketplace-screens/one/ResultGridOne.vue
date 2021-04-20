<template>
<div>
  <!--
  <div class="d-flex justify-content-center" v-for="(n, i) in gridSize" :key="i">
    <div v-for="(result, index) in results(i)" :key="index">
      <div class="100vh flex-column align-items-center d-flex justify-content-center">
        <result-item :result="result" />
      </div>
    </div>
  </div>
  -->
    <div class="flex-column align-items-center">
      <div class="row" style="width: 100%;">
        <div class="col-6 text-right m-0 p-0" v-for="(result, index) in assets1" :key="index">
          <result-item-one :result="result" />
        </div>
      </div>
      <div class="row" style="width: 100%;">
        <div class="col-6 text-right m-0 p-0" v-for="(result, index) in assets2" :key="index">
          <result-item-one :result="result" />
        </div>
      </div>
    </div>
</div>
</template>

<script>
import ResultItemOne from './ResultItemOne'
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'One',
  components: {
    ResultItemOne
  },
  props: ['resultSet'],
  data () {
    return {
      showControls: false
    }
  },
  methods: {
    gridSize: function () {
      const searchResults = this.$store.getters[APP_CONSTANTS.KEY_SEARCH_RESULTS]
      const numbs = searchResults.length
      if (numbs <= 4) {
        this.gridSize = 2
      } else if (numbs <= 9) {
        this.gridSize = 3
      } else if (numbs <= 16) {
        this.gridSize = 4
      }
    }
  },
  computed: {
    assets1 () {
      const searchResults = this.$store.getters[APP_CONSTANTS.KEY_SEARCH_RESULTS]
      return searchResults.slice(0, 2)
    },
    assets2 () {
      const searchResults = this.$store.getters[APP_CONSTANTS.KEY_SEARCH_RESULTS]
      return searchResults.slice(2)
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

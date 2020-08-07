<template>
<div class="vld-parent mt-5 d-flex flex-column align-items-center">
    <loading :active.sync="loading"></loading>
  <div class="mt-4 d-flex flex-column align-items-center">
    {{waitingMessage}}
  </div>
</div>
</template>

<script>
import Loading from 'vue-loading-overlay'

export default {
  name: 'WaitingView',
  components: {
    Loading
  },
  props: {
    waitingMessage: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      loading: true
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
  }
}
</script>
<style lang="scss">
.vld-parent {
  margin: 45px 30px;
}
</style>

<template>
<div class="container mt-5" v-if="token">
  <div class="d-flex justify-content-center">
    <h2>Congrats! This is a valid LSAT token</h2>
  </div>
  <div  class="my-5 py-5 d-flex justify-content-center">
    <div class="d-flex justify-content-center" v-if="showMessage">
      {{message}}
    </div>
    <div v-else>
      <a href="#" @click.prevent="$emit('startOver')">click here to start again</a>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'Token',
  components: {
  },
  props: ['token'],
  data () {
    return {
      showMessage: false,
      message: 'Generating fresh invoice'
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
<style lang="scss" scoped>
</style>

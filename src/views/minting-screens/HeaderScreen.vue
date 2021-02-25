<template>
<b-card-text class="mx-4 text-center border-bottom">
  <h1 class="mt-5 mb-3">{{$globalLookAndFeel.labels.title}}</h1>
  <network-options :allowEdit="allowEdit"/>
  <div v-if="errorMessage" class="text-danger mb-3 text-bold">{{errorMessage}}</div>
  <div v-else-if="mintedMessage" class="text-info mb-3 text-bold">{{mintedMessage}}</div>
  <div v-else class="text-white mb-3 text-bold">. &nbsp;</div>
</b-card-text>
</template>

<script>
import NetworkOptions from './NetworkOptions'

export default {
  name: 'HeaderScreen',
  components: {
    NetworkOptions
  },
  props: ['allowEdit', 'mintedMessage', 'errorMessage'],
  data () {
    return {
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

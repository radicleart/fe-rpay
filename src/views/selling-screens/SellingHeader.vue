<template>
<b-card-text class="mx-4 text-center border-bottom">
  <h1 class="mt-5 mb-3">{{$globalLookAndFeel.labels.titleSelling}}</h1>
  <network-options :allowEdit="allowEdit"/>
</b-card-text>
</template>

<script>
import NetworkOptions from '../minting-screens/NetworkOptions'

export default {
  name: 'SellingHeader',
  components: {
    NetworkOptions
  },
  props: ['allowEdit'],
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

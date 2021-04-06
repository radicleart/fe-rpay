<template>
<b-card-text class="mx-4">
  <div class="row">
    <div class="col-4"><img style="border-radius: 18px;" width="100%" :src="item.imageUrl"/></div>
    <div class="col-8">
      <div class="text-bold">{{item.name}}</div>
    </div>
  </div>
</b-card-text>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'ItemDisplay',
  components: {
  },
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
    item: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.gaiaAsset
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

<template>
<div>
  <div v-for="(category, index) in categories" :key="index">
    <div class="mb-2"><a href="#" @click.prevent="$emit('set-filter', { category: category, filter: 'category' })"><span class="text-info mr-3"><b-icon :icon="category.icon"/></span> <span class="text-11-500">{{category.displayName}}</span></a></div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'CategoryList',
  components: {
  },
  data () {
    return {
    }
  },
  methods: {
  },
  computed: {
    categories () {
      const categories = this.$store.getters[APP_CONSTANTS.KEY_CATEGORIES]
      if (categories) return categories
      return []
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

<template>
<div class="d-flex justify-content-between border-bottom mx-5 mt-2 pb-3">
  <div>
    <span class="text-center-300 mr-4 d-md-none d-sm-none d-xs-none d-lg-inline">View</span>
    <b-dropdown caret variant="white" class="mx-2 px-1 border-right">
      <!-- Using 'button-content' slot -->
      <template  v-slot:button-content>
        <span class="text3 mr-4">Popular</span>
      </template>
      <div class="dropdown__whitespace"></div>
      <div class="dropdown__filler"></div>
      <div class="dropdown__items">
        <b-dropdown-item></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'recent' })">Recently Added</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sale-type', saleType: 2 })">On Auction</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sale-type', saleType: 1 })">Buy Now</a></b-dropdown-item>
      </div>
    </b-dropdown>
  </div>
  <div>
    <b-dropdown caret variant="white" class="mx-2 px-1 border-right">
      <!-- Using 'button-content' slot -->
      <template v-slot:button-content>
        <span class="text3 mr-4">Sort by</span>
      </template>
      <div class="dropdown__whitespace"></div>
      <div class="dropdown__filler"></div>
      <div class="dropdown__items">
        <b-dropdown-item></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sort-by-application' })">Application</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sort-by-artist' })">Artist</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sort-by-collection' })">Collection</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sale-type', saleType: 2 })">On Auction</a></b-dropdown-item>
        <b-dropdown-item><a href="#" @click.prevent="$emit('set-filter', { filter: 'sale-type', saleType: 1 })">Buy Now</a></b-dropdown-item>
      </div>
    </b-dropdown>
  </div>
  <div class="w-50">
    <div class="main-search">
      <search-bar :showPrepend="false" v-on="$listeners"/>
    </div>
  </div>
</div>
</template>

<script>
import SearchBar from '@/views/marketplace-screens/SearchBar'

export default {
  name: 'MarketplaceFilterBar',
  components: {
    SearchBar
  },
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

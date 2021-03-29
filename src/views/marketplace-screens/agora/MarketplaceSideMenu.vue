<template>
<div>
  <div class="">
    <div class="pt-4 mt-4 d-flex justify-content-between">
      <span class="text3 mb-3" @click="showApps = !showApps">Applications</span>
      <span><b-icon class="text-info" :icon="(showApps) ? 'caret-down-fill' : 'caret-up-fill'"/></span>
    </div>
    <project-list v-on="$listeners" v-if="showApps"/>
    <div class="border-top pt-4 mt-4 d-flex justify-content-between">
      <span class="text3 mb-3" @click="showCats = !showCats">Categories</span>
      <span><b-icon class="text-info"  :icon="(showCats) ? 'caret-down-fill' : 'caret-up-fill'"/></span>
    </div>
    <category-list v-on="$listeners" v-if="showCats"/>
    <div class="border-top pt-4 mt-4 d-flex justify-content-between">
      <span class="text3 mb-3" @click="showAucs = !showAucs">Auctions</span>
      <span><b-icon class="text-info"  :icon="(showAucs) ? 'caret-down-fill' : 'caret-up-fill'"/></span>
    </div>
    <div class="border-bottom pb-4 mb-4 text-11-500" v-if="showAucs"><span >Auctions are planned for Q2 2021. We intend to deliver
      decentralised live webcast auctions as fund raising event - see our <a target="_blank" href="https://discord.com/channels/744935387876819007/771720965720899605/776777669256806420">discord server</a>
      for more info</span></div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import ProjectList from '@/views/marketplace-screens/agora/ProjectList'
import CategoryList from '@/views/marketplace-screens/agora/CategoryList'

export default {
  name: 'MarketplaceSideMenu',
  components: {
    ProjectList,
    CategoryList
  },
  data () {
    return {
      showApps: true,
      showAucs: true,
      showCats: true
    }
  },
  methods: {
  },
  computed: {
    myProjects () {
      const projects = this.$store.getters[APP_CONSTANTS.KEY_MY_PROJECTS]
      return projects
    },
    balance () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return (profile && profile.wallet) ? profile.wallet.balance : 0
    },
    showSysLink () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return (profile) ? profile.superAdmin : false
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

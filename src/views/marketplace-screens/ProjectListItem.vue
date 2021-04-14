<template>
<div v-if="application">
  <div v-if="application.gaiaProject">
    <img class="mr-3" width="30px" height="30px" :src="application.gaiaProject.imageUrl"/>
    <!-- <router-link class="mr-3" to="/admin-app"><b-icon icon="eye"></b-icon></router-link> -->
    <a class="text-11-500" href="#" @click.prevent="$emit('set-filter', { contractId: contractId, filter: 'application' })">{{application.gaiaProject.title}}</a>
  </div>
  <div v-else>
    <!-- <router-link class="mr-3" to="/admin-app"><b-icon icon="eye"></b-icon></router-link> -->
    <img class="mr-3" :src="loopie"/>
    <a class="text-11-500" href="#" @click.prevent="$emit('set-filter', { contractId: contractId, filter: 'application' })">{{projectName()}}</a>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'SideMenu',
  components: {
  },
  props: ['contractId'],
  data () {
    return {
      loopie: require('@/assets/img/Loopbomb Logo.svg')
    }
  },
  methods: {
    projectName () {
      return this.contractId.split('.')[1]
    }
  },
  computed: {
    application () {
      const application = this.$store.getters[APP_CONSTANTS.KEY_APPLICATION_FROM_REGISTRY_BY_CONTRACT_ID](this.contractId)
      return application
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

<template>
<div id="marketplace">
  <div class="d-flex justify-content-start">
    <div class="mp-nav w-25 p-4 px-5" v-if="grid === 'risidio'">
      <marketplace-side-menu v-on="$listeners" style="min-height: 100vh;"/>
    </div>
    <div class="w-75 p-2" v-if="grid === 'risidio'">
      <marketplace-filter-bar v-on="$listeners"/>
      <div class="p-5">
        <result-grid-risidio :resultSet="resultSet" :gridClasses="gridClasses" v-if="resultSet && resultSet.length > 0"/>
        <div v-else v-html="currentSearch">No results: {{currentSearch}}</div>
      </div>
    </div>
    <div class="w-100 p-2 d-flex justify-content-center" v-if="grid !== 'risidio'">
      <div class="w-100">
        <result-grid-risidio :gridClasses="gridClasses" :resultSet="resultSet" v-if="resultSet && resultSet.length > 0"/>
        <div v-else v-html="currentSearch">No results: {{currentSearch}}</div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import moment from 'moment'
import { APP_CONSTANTS } from '@/app-constants'
import ResultGridRisidio from '@/views/marketplace-screens/risidio/ResultGridRisidio'
import MarketplaceSideMenu from '@/views/marketplace-screens/MarketplaceSideMenu'
import MarketplaceFilterBar from '@/views/marketplace-screens/MarketplaceFilterBar'

export default {
  name: 'MarketplaceFlow',
  components: {
    ResultGridRisidio,
    MarketplaceSideMenu,
    MarketplaceFilterBar
  },
  data () {
    return {
      results: null,
      grid: 'risidio',
      query: null,
      gridClasses: ['col-lg-6', 'col-md-6', 'col-sm-6', 'col-12']
    }
  },
  mounted () {
    this.loading = false
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    if (configuration.risidioProjectId && configuration.risidioProjectId.indexOf('numberone') > -1) {
      this.grid = 'one'
    }
    if (this.$route.query && !this.$route.query.filter) {
      this.findAssets()
    }
    const query = Object.assign({}, this.$route.query)
    delete query.filter
    this.$router.replace({ query }).catch(() => {
    })
  },
  methods: {
    findAssets () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      let searchKey = 'rpaySearchStore/findBySearchTerm'
      let arg = Object.assign({}, this.$route.query)
      if (configuration.risidioProjectId) {
        searchKey = 'rpaySearchStore/findByProjectId'
        arg = configuration.risidioProjectId
      }
      this.$store.dispatch(searchKey, arg).then((results) => {
        this.results = results
      })
    },
    truncateProjectId (projectId) {
      if (projectId.indexOf('.') > -1) {
        let addr = projectId.split('.')[0]
        addr = addr.substring(addr.length - 5)
        return addr + '.' + projectId.split('.')[1]
      }
      return projectId
    },
    truncateAssetHash (assetHash) {
      const addr = assetHash.substring(0, 4)
      return addr + '...' + assetHash.substring(assetHash.length - 4)
    },
    owner (id) {
      return id.split('.')[0]
    },
    created (created) {
      return moment(created).format('YYYY-MM-DD HH:mm:SS')
    },
    convertSaleType (saleType) {
      if (saleType === 1) {
        return 'Buy Now'
      } else if (saleType === 2) {
        return 'On Auction'
      }
      return 'Any Sale Type'
    }
  },
  computed: {
    marketConfig () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.marketConfig
    },
    resultSet () {
      return this.$store.getters[APP_CONSTANTS.KEY_SEARCH_RESULTS]
    },
    currentSearch () {
      const currentSearch = this.$store.getters[APP_CONSTANTS.KEY_CURRENT_SEARCH]
      if (!currentSearch) return ''
      if (currentSearch.filter === 'category') {
        return 'No results: for ' + currentSearch.filter + ' <span class="text-info">' + currentSearch.category.displayName + '</span>'
      } else if (currentSearch.filter === 'application') {
        return 'No results: for ' + ' <span class="text-info">' + currentSearch.filter + '</span>'
      } else if (currentSearch.filter === 'sale-type') {
        return 'No results: for <span class="text-info">' + this.convertSaleType(currentSearch.saleType) + '</span>'
      } else {
        return 'No results: for <span class="text-info">' + currentSearch.filter + '</span>'
      }
    }
  }
}
</script>
<style lang="scss">
.mp-nav {
  background: #F5F5F5;
}
.market-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 200px;
  background-color: lightpink;
  text-align: center;
}

#marketplace {
  /* MAIN SEARCH BAR */
  & .main-search {
    margin-top: -5.5px;
    z-index: 2;
  }
  & .main-search--border {
    width: 100%;
    max-width: 1000px;
  }

  /* MAIN SEARCH BAR -- INPUT */
  & .input-group {
    background: #FFFFFF;
    border: 1px solid #F5F5F5;
    align-items: center;
    height: 47px;
  }
  & .input-group input {
    font-size: 1.4rem;
    font-weight: 500;
    color: #000;
    height: 26px;
    padding: 0.25rem 25px;
    border: none;
    z-index: 2;
  }
  & .input-group input:focus {
    box-shadow: none;
  }

  /* MAIN SEARCH BAR -- BTN */
  & .main-search .btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 600;
    color: #000;
    text-transform: none;
    background: transparent;
    border: none;
    padding-left: 30px;
    padding-right: 30px;
    z-index: 2;
  }
  & .main-search .btn:focus {
    box-shadow: none;
  }
  & .main-search .btn.dropdown-toggle::after {
    font-size: 1.6rem;
  }

  /* MAIN SEARCH BAR -- LOOP ICON */
  & .input-group-append svg {
    font-size: 20px;
    font-weight: bold;
    color: #50B1B5;
    margin-right: 22px;
    margin-left: 1px;
  }

}
</style>

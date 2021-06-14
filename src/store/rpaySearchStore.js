
import searchIndexService from '@/services/searchIndexService'
import { APP_CONSTANTS } from '@/app-constants'

const matchContractAssets = function (rootGetters, resultSet) {
  const matched = []
  resultSet.forEach((result) => {
    const contractAsset = rootGetters['rpayStacksContractStore/getAssetFromContractByHash'](result.assetHash)
    if (contractAsset) {
      const gaiaAsset = rootGetters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](result.assetHash)
      if (gaiaAsset && gaiaAsset.nftMedia) result = gaiaAsset
      result.contractAsset = contractAsset
      if (result && result.nftMedia && result.nftMedia.artworkFile && result.nftMedia.artworkFile.fileUrl) {
        matched.push(result)
      }
    }
  })
  return matched
}

const matchContractAsset = function (rootGetters, result) {
  const contractAsset = rootGetters['rpayStacksContractStore/getAssetFromContractByHash'](result.assetHash)
  if (contractAsset) {
    const gaiaAsset = rootGetters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](result.assetHash)
    if (gaiaAsset && gaiaAsset.nftMedia) result = gaiaAsset
    result.contractAsset = contractAsset
  }
  return result
}

const sortResults = function (state, resultSet) {
  const currentSearch = (state.currentSearch) ? state.currentSearch : { filter: 'recent' }
  resultSet = resultSet.sort(function compare (a, b) {
    if (currentSearch.filter === 'recent') {
      if (!b.nftIndex || !a.nftIndex) return -1
      if (parseInt(a.nftIndex) > parseInt(b.nftIndex)) return -1
      if (parseInt(a.nftIndex) < parseInt(b.nftIndex)) return 1
      return 0
    } else if (currentSearch.filter === 'sort-by-application') {
      if (!b.projectId || !a.projectId) return -1
      if (a.projectId > b.projectId) return -1
      if (a.projectId < b.projectId) return 1
      return 0
    } else if (currentSearch.filter === 'sort-by-artist') {
      if (!b.artist) return -1
      if (a.artist > b.artist) return 1
      if (a.artist < b.artist) return -1
      return 0
    }
    return 0
  })
  return resultSet
}

const rpaySearchStore = {
  namespaced: true,
  state: {
    searchResults: null,
    projects: null,
    currentSearch: null,
    doSorting: false
  },
  getters: {
    getSearchResults: (state) => {
      if (state.searchResults && state.doSorting) {
        return sortResults(state, state.searchResults)
      }
      return state.searchResults
    },
    getCurrentSearch: (state) => {
      return state.currentSearch
    },
    getAsset: (state, getters, rootState, rootGetters) => (assetHash) => {
      let item = null
      const contractAsset = rootGetters['rpayStacksContractStore/getAssetFromContractByHash'](assetHash)
      if (assetHash && state.searchResults && state.searchResults.length > 0) {
        const asset = state.searchResults.find(o => o.assetHash === assetHash)
        item = asset
      } if (item) {
        item = rootGetters['rpayStacksContractStore/getGaiaAssetByHash'](assetHash)
      }
      if (item) item.contractAsset = contractAsset
      return item
    },
    getProjects: (state) => {
      return state.projects
    }
  },
  mutations: {
    setSearchResults: (state, searchResults) => {
      state.searchResults = searchResults
    },
    setCurrentSearch: (state, currentSearch) => {
      state.currentSearch = currentSearch
    },
    addSearchResult: (state, result) => {
      if (!state.searchResults) {
        state.searchResults = []
      }
      if (result) state.searchResults.push(result)
    },
    setProjects: (state, projects) => {
      state.projects = projects
    }
  },
  actions: {
    indexUsers ({ commit }, users) {
      return new Promise((resolve, reject) => {
        searchIndexService.indexUsers(users).then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    clearAssets ({ commit }) {
      return new Promise((resolve, reject) => {
        searchIndexService.clearDappsIndex().then((resultSet) => {
          commit('setArtworks', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    clearUsers ({ commit }) {
      return new Promise((resolve, reject) => {
        searchIndexService.clearNamesIndex().then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findAssetByHash ({ commit, rootGetters }, assetHash) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findAssetByHash(configuration.risidioBaseApi, assetHash).then((response) => {
          const asset = matchContractAsset(rootGetters, response.data)
          commit('addSearchResult', asset)
          resolve(asset)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findAssets ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findAssets(configuration.risidioBaseApi).then((resultSet) => {
          const assets = matchContractAsset(rootGetters, resultSet)
          commit('setSearchResults', assets)
          resolve(assets)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findUsers ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.fetchAllNamesIndex(configuration.risidioBaseApi).then((resultSet) => {
          commit('setUsers', matchContractAssets(rootGetters, resultSet))
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySearchTerm ({ commit, rootGetters }, query) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (query && query.length > 0) {
          query += '*'
          searchIndexService.findByTitleOrDescriptionOrCategoryOrKeyword(configuration.risidioBaseApi, query).then((resultSet) => {
            const assets = matchContractAsset(rootGetters, resultSet)
            commit('setSearchResults', assets)
            resolve(assets)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        } else {
          query += '*'
          searchIndexService.findAssets(configuration.risidioBaseApi).then((resultSet) => {
            commit('setSearchResults', matchContractAssets(rootGetters, resultSet))
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        }
      })
    },
    findByProjectId ({ commit, rootGetters }, projectId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findByProjectId(configuration.risidioBaseApi, projectId).then((resultSet) => {
          const contractResults = matchContractAssets(rootGetters, resultSet)
          commit('setSearchResults', contractResults)
          resolve(contractResults)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySaleType ({ commit, rootGetters }, saleType) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findBySaleType(configuration.risidioBaseApi, saleType).then((resultSet) => {
          const assets = matchContractAsset(rootGetters, resultSet)
          commit('setSearchResults', assets)
          resolve(assets)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findByObject ({ commit, rootGetters }, category) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findByObject(configuration.risidioBaseApi, category.name).then((resultSet) => {
          const assets = matchContractAsset(rootGetters, resultSet)
          commit('setSearchResults', assets)
          resolve(assets)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findByOwner ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        searchIndexService.findByOwner(configuration.risidioBaseApi, profile.username).then((resultSet) => {
          const assets = matchContractAsset(rootGetters, resultSet)
          commit('setSearchResults', assets)
          resolve(assets)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    }
  }
}
export default rpaySearchStore

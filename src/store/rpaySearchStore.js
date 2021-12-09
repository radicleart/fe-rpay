
import searchIndexService from '@/services/searchIndexService'
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'

const matchContractAssetsFromJson = function (commit, dispatch, rootGetters, resultSet) {
  const configuration = rootGetters['rpayStore/getConfiguration']
  resultSet.forEach((result) => {
    result.contractAsset = utils.resolvePrincipalsToken(configuration.network, JSON.parse(result.contractAssetJson))
    result.contractAssetJson = null
  })
}

const matchContractAssets = function (commit, dispatch, rootGetters, resultSet) {
  const hashes = resultSet.map((o) => o.assetHash)
  dispatch('rpayStacksContractStore/fetchAssetFirstsByHashes', hashes, { root: true }).then((tokens) => {
    const configuration = rootGetters['rpayStore/getConfiguration']
    resultSet.forEach((result) => {
      if (tokens) {
        let token = tokens.find((o) => o.tokenInfo.assetHash === result.assetHash)
        if (token) {
          token = utils.resolvePrincipalsToken(configuration.network, token)
          commit('addContractAsset', token)
        }
      }
    })
  })
}

const matchContractAsset = function (rootGetters, result) {
  const configuration = rootGetters['rpayStore/getConfiguration']
  const data = { assetHash: result.assetHash, edition: 1 }
  let contractAsset = rootGetters['rpayStacksContractStore/getAssetByHashAndEdition'](data)
  if (contractAsset) {
    const gaiaAsset = rootGetters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](result.assetHash)
    if (gaiaAsset && gaiaAsset.attributes) result = gaiaAsset
    contractAsset = utils.resolvePrincipalsToken(configuration.network, contractAsset)
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
      if (!b.contractId || !a.contractId) return -1
      if (a.contractId > b.contractId) return -1
      if (a.contractId < b.contractId) return 1
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
    searchResults: [],
    projects: null,
    currentSearch: null,
    doSorting: false
  },
  getters: {
    getSearchResults: (state) => {
      if (state.searchResults && state.doSorting) {
        return sortResults(state, state.searchResults)
      }
      return state.searchResults.filter((o) => o.contractAsset)
    },
    getCurrentSearch: (state) => {
      return state.currentSearch
    },
    getAsset: (state, getters, rootState, rootGetters) => (assetHash) => {
      let item = null
      const data = { assetHash: assetHash, edition: 1 }
      const contractAsset = rootGetters['rpayStacksContractStore/getAssetByHashAndEdition'](data)
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
    addContractAsset (state, contractAsset) {
      const index = state.searchResults.findIndex((o) => o.assetHash === contractAsset.tokenInfo.assetHash)
      if (index > -1) {
        state.searchResults[index].contractAsset = contractAsset
      }
      state.searchResults.forEach((sr) => {
        sr.update = new Date().getTime()
      })
    },
    setProjects: (state, projects) => {
      state.projects = projects
    }
  },
  actions: {
    indexUsers ({ commit, rootGetters }, users) {
      return new Promise((resolve, reject) => {
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        if (!profile.superAdmin) {
          resolve(null)
          return
        }
        searchIndexService.indexUsers(users).then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    clearAssets ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        if (!profile.superAdmin) {
          resolve(null)
          return
        }
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
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findByGeneralSearchTerm ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findByGeneralSearchTerm(configuration.risidioBaseApi, data).then((resultSet) => {
          const assets = matchContractAsset(rootGetters, resultSet)
          commit('setSearchResults', assets)
          resolve(assets)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySearchTerm ({ commit, dispatch, rootGetters }, query) {
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
            commit('setSearchResults', resultSet)
            matchContractAssets(commit, dispatch, rootGetters, resultSet)
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        }
      })
    },
    findByProjectId ({ commit, dispatch, rootGetters }, contractId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findByProjectId(configuration.risidioBaseApi, contractId).then((resultSet) => {
          matchContractAssetsFromJson(commit, dispatch, rootGetters, resultSet)
          commit('setSearchResults', resultSet)
          resolve(resultSet)
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


import searchIndexService from '@/services/searchIndexService'
import { APP_CONSTANTS } from '@/app-constants'

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
  })
  return resultSet
}

const rpaySearchStore = {
  namespaced: true,
  state: {
    searchResults: null,
    projects: null,
    currentSearch: null
  },
  getters: {
    getSearchResults: (state) => {
      if (state.searchResults) {
        return sortResults(state, state.searchResults)
      }
      // return state.searchResults
    },
    getCurrentSearch: (state) => {
      return state.currentSearch
    },
    getAsset: (state) => (assetHash) => {
      if (assetHash && state.searchResults && state.searchResults.length > 0) {
        const asset = state.searchResults.find(o => o.assetHash === assetHash)
        return asset
      }
      return null
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
          commit('addSearchResult', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findAssets ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        searchIndexService.findAssets(configuration.risidioBaseApi).then((resultSet) => {
          commit('setSearchResults', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findUsers ({ commit }) {
      return new Promise((resolve, reject) => {
        searchIndexService.fetchAllNamesIndex().then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySearchTerm ({ commit }, query) {
      return new Promise((resolve, reject) => {
        if (query && query.length > 0) {
          query += '*'
          searchIndexService.findByTitleOrDescriptionOrCategoryOrKeyword(query).then((resultSet) => {
            commit('setSearchResults', resultSet)
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        } else {
          query += '*'
          searchIndexService.findAssets().then((resultSet) => {
            commit('setSearchResults', resultSet)
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        }
      })
    },
    findByProjectId ({ commit }, projectId) {
      return new Promise((resolve, reject) => {
        searchIndexService.findByProjectId(projectId).then((resultSet) => {
          if (resultSet.length < 4) {
            commit('setSearchResults', resultSet.slice(0, 1))
          } else if (resultSet.length > 4 && resultSet.length < 9) {
            commit('setSearchResults', resultSet.slice(0, 4))
          } else {
            commit('setSearchResults', resultSet.slice(0, 10))
          }
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySaleType ({ commit }, saleType) {
      return new Promise((resolve, reject) => {
        searchIndexService.findBySaleType(saleType).then((resultSet) => {
          commit('setSearchResults', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findByObject ({ commit }, category) {
      return new Promise((resolve, reject) => {
        searchIndexService.findByObject(category.name).then((resultSet) => {
          commit('setSearchResults', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findByOwner ({ commit, rootGtters }) {
      return new Promise((resolve, reject) => {
        const profile = rootGtters[APP_CONSTANTS.KEY_PROFILE]
        searchIndexService.findByOwner(profile.username).then((resultSet) => {
          commit('setSearchResults', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    }
  }
}
export default rpaySearchStore

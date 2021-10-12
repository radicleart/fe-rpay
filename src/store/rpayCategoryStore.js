import axios from 'axios'
import { DateTime } from 'luxon'
import { APP_CONSTANTS } from '@/app-constants'

const rpayCategoryStore = {
  namespaced: true,
  modules: {
  },
  state: {
    loopRun: null,
    runCounts: [],
    loopRuns: [],
    loopSpins: null,
    waitingImage: 'https://images.prismic.io/dbid/cc7d59a2-65f4-45a2-b6e5-df136e2fd952_OS_thumb.png?auto=compress,format',
    categories: [
      {
        icon: 'easel',
        displayName: 'Digital Art',
        name: 'artwork'
      },
      {
        icon: 'basket',
        displayName: 'Merchandise',
        name: 'merchandise'
      },
      {
        icon: 'badge-tm',
        displayName: 'Brands / Logos',
        name: 'brands'
      },
      {
        icon: 'three-dots-vertical',
        displayName: 'Digital 3D Art',
        name: 'threed'
      },
      {
        icon: 'star',
        displayName: 'Instants in Time',
        name: 'instants'
      },
      {
        icon: 'card-list',
        displayName: 'Trading Cards',
        name: 'trading_cards'
      },
      {
        icon: 'file-earmark',
        displayName: 'Certificates',
        name: 'certificates'
      },
      {
        icon: 'globe',
        displayName: 'Digital Property',
        name: 'digital_property'
      },
      {
        icon: 'file-earmark-richtext',
        displayName: 'Written Word',
        name: 'written_word'
      },
      {
        icon: 'newspaper',
        displayName: 'News and Media',
        name: 'news_media'
      }
    ]
  },
  getters: {
    getAssetImageUrl: state => item => {
      if (item.image) {
        return item.image
      } else if (item.attributes) {
        if (item.attributes.artworkFile && item.attributes.artworkFile.fileUrl && item.attributes.artworkFile.type.indexOf('image') > -1) {
          return item.attributes.artworkFile.fileUrl
        } else if (item.attributes.coverImage && item.attributes.coverImage.fileUrl) {
          return item.attributes.coverImage.fileUrl
        }
      }
      return state.waitingImage
    },
    getMediaAttributes: state => item => {
      let attrs = item.attributes
      if (!attrs || !attrs.artworkFile) {
        attrs = {
          artworkFile: {
            fileUrl: state.waitingImage,
            type: 'image/jpg',
            name: 'Waiting Image'
          }
        }
      }
      if (!attrs.coverImage) {
        attrs.coverImage = {
          fileUrl: state.waitingImage,
          type: 'image/jpg',
          name: 'Waiting Image'
        }
      }
      return attrs
    },
    getCategories: state => {
      return state.categories
    },
    getLoopRunsByStatus: state => status => {
      return (state.loopRuns) ? state.loopRuns.filter((o) => o.status === status) : []
    },
    getLoopRuns: state => {
      return state.loopRuns
    },
    getLoopSpins: state => {
      return state.loopSpins
    },
    getLoopRunByRunKey: state => currentRunKey => {
      const loopRun = state.loopRuns.find((o) => o.currentRunKey === currentRunKey)
      return loopRun
    },
    getLoopRun: state => {
      return state.loopRun
    }
  },
  mutations: {
    setLoopRun (state, loopRun) {
      if (loopRun && !loopRun.spinsToday) loopRun.spinsToday = 0
      state.loopRun = loopRun
      const index = state.loopRuns.findIndex((o) => o.currentRunKey === loopRun.currentRunKey)
      if (index === -1) {
        state.loopRuns.splice(0, 0, loopRun)
      } else {
        state.loopRuns.splice(index, 1, loopRun)
      }
    },
    addMintCountToCollection (state, data) {
      const runCounts = state.runCounts
      const index = runCounts.findIndex((o) => o.runKey === data.runKey)
      if (index > -1) {
        runCounts.splice(index, 1, data)
      } else {
        state.loopRuns.splice(0, 0, data)
      }
      state.runCounts = runCounts
    },
    setLoopRuns (state, loopRuns) {
      loopRuns.forEach((loopRun) => {
        if (loopRun && !loopRun.spinsToday) loopRun.spinsToday = 0
      })
      if (loopRuns) state.loopRuns = loopRuns
    },
    setLoopSpins (state, loopSpins) {
      state.loopSpins = loopSpins
    }
  },
  actions: {
    newLoopRun ({ rootGetters, commit }, loopRun) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/loopRun'
        axios.post(url, loopRun).then((response) => {
          commit('setLoopRun', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateLoopRun ({ rootGetters, commit }, loopRun) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/loopRun'
        axios.put(url, loopRun).then((response) => {
          commit('setLoopRun', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchRoyalties ({ rootGetters }, currentRunKey) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/royalties/' + currentRunKey
        axios.get(url).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateRoyalties ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/updateRoyalties'
        axios.put(url, data).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateLoopRunAndAllocations ({ rootGetters, commit }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/loopRunAndAllocations'
        axios.post(url, data).then((response) => {
          commit('setLoopRun', response.data.loopRun)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchLatestLoopRunForStxAddress ({ rootGetters, commit }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let url = configuration.risidioBaseApi + '/mesh/v2/lastLoopRun/' + data.currentRunKey
        const dt = DateTime.local()
        url += '/' + data.stxAddress + '/' + dt.ordinal + '/' + dt.year
        axios.get(url).then((response) => {
          const loopRun = response.data.loopRun
          loopRun.spinsToday = response.data.loopSpinsToday
          commit('setLoopRun', loopRun)
          resolve(loopRun)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchLatestLoopRunForAnon ({ rootGetters, commit }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/lastLoopRun/' + data.currentRunKey
        axios.get(url).then((response) => {
          commit('setLoopRun', response.data.loopRun)
          resolve(response.data.loopRun)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchLoopRun ({ dispatch, rootGetters }, currentRunKey) {
      return new Promise(resolve => {
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        if (profile.loggedIn) {
          dispatch('fetchLatestLoopRunForStxAddress', { currentRunKey: currentRunKey, stxAddress: profile.stxAddress }).then((loopRun) => {
            resolve(loopRun)
          })
        } else {
          dispatch('fetchLatestLoopRunForAnon', { currentRunKey: currentRunKey, stxAddress: null }).then((loopRun) => {
            resolve(loopRun)
          })
        }
      })
    },
    fetchLoopRunsForContract ({ commit, rootGetters }) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const contractId = configuration.risidioProjectId
        axios.get(configuration.risidioBaseApi + '/mesh/v2/loopRuns/' + contractId).then((response) => {
          commit('setLoopRuns', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchLoopRuns ({ commit, rootGetters }) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/loopRuns').then((response) => {
          commit('setLoopRuns', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchMintCountForCollection ({ state, rootGetters, commit }, runKey) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const contractId = configuration.risidioProjectId
        axios.get(configuration.risidioBaseApi + '/mesh/v2/countTokens/' + contractId + '/' + runKey).then((response) => {
          state.loopRun.tokenCount = response.data
          commit('addMintCountToCollection', { runKey: runKey, count: state.loopRun.tokenCount })
          resolve(state.loopRun.tokenCount)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    clearMintAllocations ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.delete(configuration.risidioBaseApi + '/mesh/v2/clearAllocations', data).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    registerSpin ({ state, commit, rootGetters }) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        const dt = DateTime.local()
        const spin = {
          stxAddress: profile.stxAddress,
          dayOfYear: dt.ordinal,
          year: dt.year
        }
        axios.put(configuration.risidioBaseApi + '/mesh/v2/loopspin', spin).then(() => {
          const loopRun = state.loopRun
          if (!loopRun.spinsToday) loopRun.spinsToday = 0
          loopRun.spinsToday = loopRun.spinsToday + 1
          commit('setLoopRun', loopRun)
          resolve(loopRun)
        }).catch(() => {
          resolve(null)
        })
      })
    }
  }
}
export default rpayCategoryStore

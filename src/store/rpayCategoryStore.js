import axios from 'axios'
import { DateTime } from 'luxon'
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'

const rpayCategoryStore = {
  namespaced: true,
  modules: {
  },
  state: {
    splitter: 'hub/',
    loopRun: null,
    runCounts: [],
    loopRuns: [],
    adminLoopRuns: [],
    loopSpins: null,
    waitingImage: 'https://images.prismic.io/dbid/831f1712-450d-42fb-be30-c7721f770e5e_Hash_One_90_rx1wf1.png?auto=compress,format',
    // silver loopbomb https://images.prismic.io/dbid/cc7d59a2-65f4-45a2-b6e5-df136e2fd952_OS_thumb.png?auto=compress,format',
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
    getAdminLoopRuns: state => {
      return state.adminLoopRuns
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
    },
    getRunKeyFromMetaDataUrl: state => token => {
      if (token && token.tokenInfo && token.tokenInfo.metaDataUrl) {
        const parts = token.tokenInfo.metaDataUrl.split(state.splitter)[1]
        // https://gaia.blockstack.org/hub/19DffsW3zbGGwSQ4D7h6x5SxdHXrs1riW9/budgies_v01/liam_onairigh/ff35f9e28451c911a961b24f12a7e227d1e10251bf9c322fb62c4442dcb99d46.json
        const parts2 = parts.split('/')
        return parts2[1]
      }
      return null
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
    setLoopRuns (state, allLoopRuns) {
      allLoopRuns.forEach((loopRun) => {
        if (loopRun && !loopRun.spinsToday) loopRun.spinsToday = 0
      })
      if (allLoopRuns) {
        state.adminLoopRuns = allLoopRuns
        state.loopRuns = allLoopRuns.filter(function (loopRun) {
          return loopRun.domains.includes(location.hostname)
        })
      }
    },
    setLoopSpins (state, loopSpins) {
      state.loopSpins = loopSpins
    }
  },
  actions: {
    newLoopRun ({ rootGetters, commit }, loopRun) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/loopRun'
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
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/loopRun'
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
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/updateRoyalties'
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
    fetchLoopRuns ({ commit, rootGetters }) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/loopRuns', authHeaders).then((response) => {
          commit('setLoopRuns', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchAllocationByAssetHash ({ rootGetters }, assetHash) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/allocation-by-hash/' + assetHash
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAllocationsByTxId ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        if (data.status) {
          uri += '/mesh/v2/allocations-by-txid-status'
        } else {
          uri += '/mesh/v2/allocations-by-txid'
        }
        uri += '/' + data.txId
        if (data.status) {
          uri += '/' + data.status
        }
        if (data.pageSize) {
          uri += '/' + data.page
          uri += '/' + data.pageSize
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAllocationsByRunKeyAndStxAddress ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        if (data.currentRunKey) {
          uri += '/mesh/v2/allocations-by-runKey-address'
          uri += '/' + data.currentRunKey
        } else {
          uri += '/mesh/v2/allocations-by-address'
        }
        uri += '/' + data.stxAddress
        if (data.pageSize) {
          uri += '/' + data.page
          uri += '/' + data.pageSize
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAllocationsByRunKey ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/allocations-by-runkey'
        uri += '/' + data.runKey
        if (data.pageSize) {
          uri += '/' + data.page
          uri += '/' + data.pageSize
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAllocationsByRunKeyAndStatus ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/allocations-by-runkey-status'
        uri += '/' + data.runKey
        uri += '/' + data.status
        if (data.pageSize) {
          uri += '/' + data.page
          uri += '/' + data.pageSize
        }
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    clearMintAllocations ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(configuration.risidioBaseApi + '/mesh/v2/clearAllocations', data, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateMintAllocations ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.put(configuration.risidioBaseApi + '/mesh/v2/mintAllocationList', data, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    deleteAllocation ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.put(configuration.risidioBaseApi + '/mesh/mgmnt-v2/delete-allocation', data, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchNextToMint ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/next-to-mint/' + data.currentRunKey + '/' + data.stxAddress + '/' + data.batchOption, authHeaders).then((response) => {
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
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.put(configuration.risidioBaseApi + '/mesh/v2/loopspin', spin, authHeaders).then(() => {
          const loopRun = state.loopRun
          if (!loopRun.spinsToday) loopRun.spinsToday = 0
          loopRun.spinsToday = loopRun.spinsToday + 1
          commit('setLoopRun', loopRun)
          resolve(loopRun)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    saveGuestList ({ rootGetters }, guestList) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/saveGuestList'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(url, guestList, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateGuestList ({ rootGetters }, guestList) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/updateGuestList'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.put(url, guestList, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    addToBlockList ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/mgmnt-v2/guest-list-block1/' + data.currentRunKey + '/' + data.stxAddress
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.put(url, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchGuestListByContractIdAndRunKey ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/guest-list'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(url + '/' + data.contractId + '/' + data.currentRunKey, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    checkGuestList ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/guest-list-check'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(url + '/' + data.contractId + '/' + data.currentRunKey + '/' + data.stxAddress, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchGuestListByRunKey ({ rootGetters }, data) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/guest-list'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(url + '/' + data.currentRunKey, authHeaders).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchLoopRunForReveal ({ rootGetters }, data) {
      return new Promise(resolve => {
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        const b32Address = utils.convertAddressFrom(profile.stxAddress)
        const configuration = rootGetters['rpayStore/getConfiguration']
        const url = configuration.risidioBaseApi + '/mesh/v2/reveal-info/' + b32Address[1] + '/' + data.currentRunKey + '/' + data.contractId + '/' + data.nftIndex
        axios.get(url).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve(null)
        })
      })
    }
  }
}
export default rpayCategoryStore

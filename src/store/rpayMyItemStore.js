/**
 * myItemStore represents the state of the data to the Vue components
 * it is session scoped store and hands off to rpayMyItemService to access
 * permanent storage.
 */
import searchIndexService from '@/services/searchIndexService'
import rpayMyItemService from '@/services/rpayMyItemService'
import { APP_CONSTANTS } from '@/app-constants'
import moment from 'moment'
import utils from '@/services/utils'
import axios from 'axios'

const STX_CONTRACT_ADDRESS = process.env.VUE_APP_STACKS_CONTRACT_ADDRESS
const STX_CONTRACT_NAME = process.env.VUE_APP_STACKS_CONTRACT_NAME

const filterItems = function (state, rootGetters, filter) {
  const filteredRecords = []
  state.rootFile.records.forEach((o) => {
    const contractAsset = rootGetters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](o.assetHash)
    if (filter === 'minted') {
      if (contractAsset) {
        o.contractAsset = contractAsset
        filteredRecords.push(o)
      }
    } else if (filter === 'unminted') {
      if (!contractAsset) {
        filteredRecords.push(o)
      }
    }
  })
  return filteredRecords
}

const purchasedItems = function (rootGetters) {
  const purchasedRecords = []
  const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
  const contractId = STX_CONTRACT_ADDRESS + '.' + STX_CONTRACT_NAME
  const myContractAssets = rootGetters[APP_CONSTANTS.KEY_ASSETS_BY_CONTRACT_ID_AND_OWNER]({ contractId: contractId, stxAddress: profile.stxAddress })
  if (myContractAssets) {
    myContractAssets.forEach((contractAsset) => {
      const gaiaAsset = rootGetters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](contractAsset.tokenInfo.assetHash)
      if (gaiaAsset && contractAsset) {
        gaiaAsset.contractAsset = contractAsset
        purchasedRecords.push(gaiaAsset)
      }
    })
  }
  // note ownership (on-chain) can be changing hands as we speak!
  return purchasedRecords
}

const rpayMyItemStore = {
  namespaced: true,
  state: {
    rootFile: null,
    gaiaUrl: null,
    indexResult: null,
    mintedRecords: null,
    purchasedRecords: null,
    unmintedRecords: null
  },
  getters: {
    getMyItems: state => {
      return (state.rootFile) ? state.rootFile.records : []
    },
    getMyMintedItems: (state, getters, rootState, rootGetters) => {
      return filterItems(state, rootGetters, 'minted')
    },
    getMyUnmintedItems: (state, getters, rootState, rootGetters) => {
      return filterItems(state, rootGetters, 'unminted')
    },
    getMyPurchasedItems: (state, getters, rootState, rootGetters) => {
      return purchasedItems(rootGetters)
    },
    getItemParamValidity: state => (item, param) => {
      if (!state.rootFile) return
      if (param === 'artworkFile') {
        return ((item.attributes.artworkFile && item.attributes.artworkFile.fileUrl))
      } else if (param === 'coverImage') {
        return ((item.attributes.coverImage && item.attributes.coverImage.fileUrl))
      } else if (param === 'artist') {
        return (item.artist && item.artist.length > 2)
      } else if (param === 'name') {
        return (item.name && item.name.length > 2)
      } else if (param === 'keywords') {
        return (item.keywords && item.keywords.length > 0)
      } else if (param === 'editions') {
        return (item.editions > 0)
      } else if (param === 'coverArtist') {
        return (item.attributes.coverArtist && item.attributes.coverArtist.length > 1)
      }
      return true
    },
    getItemValidity: (state, getters) => item => {
      if (!state.rootFile || state.rootFile.records.length === 0) return false
      const invalidParams = []
      const myGetter = 'getItemParamValidity'
      if (!getters[myGetter](item, 'name')) invalidParams.push('name')
      if (!getters[myGetter](item, 'uploader')) invalidParams.push('uploader')
      if (!getters[myGetter](item, 'editions')) invalidParams.push('editions')
      if (!getters[myGetter](item, 'artist')) invalidParams.push('artist')
      if (!getters[myGetter](item, 'artworkFile')) invalidParams.push('artworkFile')
      if (!getters[myGetter](item, 'artworkClip')) invalidParams.push('artworkClip')
      if (!getters[myGetter](item, 'coverImage')) invalidParams.push('coverImage')
      if (!getters[myGetter](item, 'keywords')) invalidParams.push('keywords')
      return invalidParams
    },
    myItem: state => assetHash => {
      let item
      if (state.rootFile && assetHash) {
        item = state.rootFile.records.find(myItem => myItem.assetHash === assetHash)
      }
      return item
    }
  },
  mutations: {
    rootFile (state, rootFile) {
      state.rootFile = rootFile
    },
    updateGaiaAsset (state, item) {
      const index = state.rootFile.records.findIndex((o) => o.assetHash === item.assetHash)
      if (index < 0) {
        state.rootFile.records.splice(0, 0, item)
      } else {
        state.rootFile.records.splice(index, 1, item)
      }
    },
    indexResult (state, indexResult) {
      state.indexResult = indexResult
    },
    setMintTxId (state, item) {
      const index = state.rootFile.records.findIndex((o) => o.assetHash === item.assetHash)
      state.rootFile.records[index] = item
    }
  },
  actions: {
    initSchema ({ dispatch, state, rootGetters }, forced) {
      return new Promise((resolve) => {
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        if (state.rootFile && !forced) {
          resolve(state.rootFile)
        } else {
          dispatch('fetchItems').then((rootFile) => {
            resolve(rootFile)
          }).catch(() => {
            rpayMyItemService.initItemSchema(profile)
          })
        }
      })
    },
    fetchItems ({ state, dispatch, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        rpayMyItemService.fetchMyItems(profile).then((rootFile) => {
          if (rootFile && rootFile.records) {
            const tokens = rootGetters['rpayStacksContractStore/getMyContractAssets']
            rootFile.records.forEach((ga) => {
              if (!ga.attributes && ga.nftMedia) {
                ga.attributes = ga.nftMedia
                ga.nftMedia = null
              }
              if (tokens) ga.contractAsset = tokens.find((o) => o.tokenInfo.assetHash === ga.assetHash)
            })
          }
          const hashes = rootFile.records.map(record => record.assetHash)
          dispatch('rpayStacksContractStore/fetchAssetFirstsByHashes', hashes, { root: true }).then((tokens) => {
            state.rootFile.records.forEach((ga) => {
              if (tokens) {
                const t = tokens.find((o) => o.tokenInfo.assetHash === ga.assetHash)
                if (t) {
                  ga.contractAsset = t
                  commit('updateGaiaAsset', ga)
                }
              }
            })
          })
          commit('rootFile', rootFile)
          resolve(rootFile)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    indexRootFile ({ state, commit }) {
      return new Promise((resolve) => {
        searchIndexService.indexRootFile(state.rootFile).then((result) => {
          commit('indexResult', result)
          resolve(result)
        }).catch((error) => {
          console.log(error)
        })
      })
    },
    deleteItem ({ state, dispatch, rootGetters }, item) {
      return new Promise((resolve, reject) => {
        const contractAsset = rootGetters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](item.assetHash)
        if (contractAsset) {
          reject(new Error('Forbidden - item has been minted.'))
          return
        }
        if (item.attributes) {
          const artworkFile = item.attributes.artworkFile
          if (artworkFile && artworkFile.storage === 'gaia') dispatch('deleteMediaItem', { id: 'artworkFile', item: item })
          const artworkClip = item.attributes.artworkClip
          if (artworkClip && artworkClip.storage === 'gaia') dispatch('deleteMediaItem', { id: 'artworkClip', item: item })
          const coverImage = item.attributes.coverImage
          if (coverImage && coverImage.storage === 'gaia') dispatch('deleteMediaItem', { id: 'coverImage', item: item })
        }

        const index = state.rootFile.records.findIndex((o) => o.assetHash === item.assetHash)
        state.rootFile.records.splice(index, 1)

        console.log(state.rootFile.records)
        rpayMyItemService.saveRootFile(state.rootFile).then((res) => {
          resolve(res)
        })
      })
    },
    deleteMediaItem ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        if (!data.item.assetHash) {
          reject(new Error('Unable to delete - unknown data...'))
          return
        }
        if (data.item.attributes[data.id].storage !== 'gaia') {
          data.item.attributes[data.id] = null
          dispatch('saveItem', data.item).then((item) => {
            resolve(item)
          })
          return
        }
        const lio = data.item.attributes[data.id].fileUrl.lastIndexOf('/')
        const coverImageFileName = data.item.attributes[data.id].fileUrl.substring(lio + 1)
        rpayMyItemService.deleteFile(coverImageFileName).then(() => {
          data.item.attributes[data.id] = null
          dispatch('saveItem', data.item).then((item) => {
            resolve(item)
          })
        }).catch(() => {
          data.item.attributes[data.id] = null
          dispatch('saveItem', data.item).then((item) => {
            resolve(item)
          })
        })
      })
    },
    deleteMediaItemSimple ({ dispatch }, mediaItem) {
      return new Promise((resolve, reject) => {
        if (mediaItem.storage !== 'gaia') {
          return
        }
        const lio = mediaItem.fileUrl.lastIndexOf('/')
        const coverImageFileName = mediaItem.fileUrl.substring(lio + 1)
        rpayMyItemService.deleteFile(coverImageFileName).then(() => {
          resolve(true)
        }).catch(() => {
          resolve(false)
        })
      })
    },
    findItemByAssetHash ({ state }, assetHash) {
      return new Promise((resolve) => {
        const index = state.rootFile.records.findIndex((o) => o.assetHash === assetHash)
        resolve(state.rootFile.records[index])
      })
    },
    saveAttributesObject ({ state }, data) {
      return new Promise((resolve, reject) => {
        if (!data.attributes.dataUrl) {
          // ok the file is stored externally - carry on..
          resolve(data.attributes)
          return
        }
        data.attributes.storage = 'gaia'
        const fileName = data.assetHash + '_' + data.attributes.id + utils.getFileExtension(data.attributes.fileUrl, data.attributes.type)
        rpayMyItemService.uploadFileData(fileName, data.attributes).then((gaiaUrl) => {
          state.gaiaUrl = gaiaUrl
          data.attributes.fileUrl = gaiaUrl
          resolve(data.attributes)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    saveUserProfile ({ state }, userProfile) {
      return new Promise((resolve) => {
        state.rootFile.userProfile = userProfile
        rpayMyItemService.saveRootFile(state.rootFile).then((res) => {
          resolve(res)
        })
      })
    },
    registerExhibitRequest ({ rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        data.domain = location.hostname
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register-to-exhibit', data).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(new Error('Unable to register email: ' + error))
        })
      })
    },
    fetchExhibitRequests ({ rootGetters }, status) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let url = configuration.risidioBaseApi + '/mesh/v2/exhibit-requests'
        if (status && status > -1) {
          url = configuration.risidioBaseApi + '/mesh/v2/exhibit-requests/' + status
        }
        axios.get(url).then((results) => {
          resolve(results.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch exhibit requests: ' + error))
        })
      })
    },
    fetchExhibitRequest ({ rootGetters }, stxAddress) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/exhibit-request/' + stxAddress).then((results) => {
          resolve(results.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch exhibit requests: ' + error))
        })
      })
    },
    updateExhibitRequestStatus ({ rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        data.domain = location.hostname
        axios.put(configuration.risidioBaseApi + '/mesh/v2/change-exhibit-status', data).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(new Error('Unable to register email: ' + error))
        })
      })
    },
    saveItem ({ state, rootGetters, commit, dispatch }, item) {
      return new Promise((resolve, reject) => {
        const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
        item.uploader = profile.username
        if (!item.owner) item.owner = profile.username
        // the item can be saved once there is an asset hash - all other fields can be added later..
        // e.g. || !item.attributes.artworkFile || !item.attributes.coverImage || !item.attributes.artworkFile
        if (!profile.loggedIn || !item.assetHash) {
          reject(new Error('Unable to save your data...'))
          return
        }
        let token = null
        if (item.contractAsset) {
          token = item.contractAsset
          item.contractAsset = null
        }
        if (typeof item.nftIndex === 'undefined') item.nftIndex = -1
        if (item.attributes && item.attributes.coverImage && item.attributes.coverImage.fileUrl) {
          const mintedUrl = encodeURI(item.attributes.coverImage.fileUrl)
          item.externalUrl = location.origin + '/display?asset=' + mintedUrl
          item.image = item.attributes.coverImage.fileUrl
        }
        if (!item.privacy) {
          item.privacy = 'public'
        }
        if (item.privacy !== 'public') {
          item.privacy = 'private'
        }
        item.projectId = STX_CONTRACT_ADDRESS + '.' + STX_CONTRACT_NAME
        item.domain = location.hostname
        item.objType = 'artwork'
        item.updated = moment({}).valueOf()
        const index = state.rootFile.records.findIndex((o) => o.assetHash === item.assetHash)
        if (index < 0) {
          state.rootFile.records.splice(0, 0, item)
        } else {
          state.rootFile.records.splice(index, 1, item)
        }
        const tempAttributes = item.attributes
        if (tempAttributes.artworkClip && tempAttributes.artworkClip.dataUrl) tempAttributes.artworkClip.dataUrl = null
        if (tempAttributes.artworkFile && tempAttributes.artworkFile.dataUrl) tempAttributes.artworkFile.dataUrl = null
        if (tempAttributes.coverImage && tempAttributes.coverImage.dataUrl) tempAttributes.coverImage.dataUrl = null
        item.attributes = {
          artworkFile: tempAttributes.artworkFile,
          coverImage: tempAttributes.coverImage,
          artworkClip: tempAttributes.artworkClip
        }
        if (!item.metaDataUrl && !profile.gaiaHubConfig) {
          // reject(new Error('Unable to load your gaia hub info - reload page and try again.'))
          dispatch('rpayAuthStore/fetchMyAccount', { root: true }).then((profile) => {
            profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
            console.log('gaiaHubConfig', profile.gaiaHubConfig)
            setTimeout(function () {
              profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
              console.log('gaiaHubConfig', profile.gaiaHubConfig)
              window.location.reload()
            }, 400)
          }).catch((error) => {
            console.log(error)
          })
          // throw new Error('profile needs to refresh - please reload current page..')
        } else {
          item.metaDataUrl = profile.gaiaHubConfig.url_prefix + profile.gaiaHubConfig.address + '/' + item.assetHash + '.json'
          item.externalUrl = location.origin + '/assets/' + item.assetHash + '/1'
          rpayMyItemService.saveAsset(item).then((item) => {
            console.log(item)
          }).catch((error) => {
            console.log(error)
          })
          rpayMyItemService.saveRootFile(state.rootFile).then((rootFile) => {
            item.contractAsset = token
            commit('rootFile', rootFile)
            resolve(item)
            if (item.privacy === 'public' && token && token.nftIndex > -1) {
              searchIndexService.addRecord(item).then((result) => {
                console.log(result)
              }).catch((error) => {
                console.log(error)
              })
            }
          }).catch((error) => {
            reject(error)
          })
        }
      })
    }
  }
}
export default rpayMyItemStore

import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'

let socket = null
let stompClient = null

const sortResults = function (gaiaAssets) {
  try {
    return gaiaAssets.sort((g1, g2) => g1.contractAsset.nftIndex - g2.contractAsset.nftIndex)
  } catch (err) {
    return gaiaAssets
  }
}

const loadAssetsFromGaia = function (tokens, commit, network) {
  tokens.forEach((token) => {
    if (token && token.tokenInfo) {
      token = utils.resolvePrincipalsToken(network, token)
      axios.get(token.tokenInfo.metaDataUrl).then(response => {
        const gaiaAsset = response.data
        gaiaAsset.contractAsset = token
        commit('addGaiaAsset', gaiaAsset)
      }).catch((error) => {
        commit('addGaiaAsset', {
          name: 'Unknown in Gaia',
          assetHash: token.tokenInfo.assetHash,
          attributes: {
            artworkFile: {
              fileUrl: 'https://images.prismic.io/radsoc/f60d92d0-f733-46e2-9cb7-c59e33a15fc1_download.jpeg?auto=compress,format',
              type: 'image/jpg',
              name: 'Waiting Image'
            }
          },
          contractAsset: token
        })
        console.log(error)
      })
    }
  })
}

const subscribeApiNews = function (commit, connectUrl, contractId, network) {
  if (!socket) socket = new SockJS(connectUrl + '/api-news')
  if (!stompClient) stompClient = Stomp.over(socket)
  stompClient.debug = () => {}
  socket.onclose = function () {
    stompClient.disconnect()
  }
  stompClient.connect({}, function () {
    if (!contractId) {
      stompClient.subscribe('/queue/contract-news', function (response) {
        const cacheUpdateResult = JSON.parse(response.body)
        // loadAssetsFromGaia(cacheUpdateResult.tokens, commit, network)
        commit('updateTokens', { tokens: cacheUpdateResult.tokens, network: network })
      })
    } else {
      stompClient.subscribe('/queue/contract-news-' + contractId, function (response) {
        const cacheUpdateResult = JSON.parse(response.body)
        // loadAssetsFromGaia(cacheUpdateResult.tokens, commit, network)
        commit('updateTokens', { tokens: cacheUpdateResult.tokens, network: network })
      })
    }
  },
  function (error) {
    console.log(error)
  })
}

const removeStatusOneApps = function (registry, contractId) {
  // if no project id is passed then the client must be the marketplace
  // screen out application which have their own curated gallery (#1!)
  if (!contractId) {
    if (!registry || !registry.administrator || !registry.applications) return registry
    const allowed = registry.applications.filter((o) => o.status !== 1)
    const notAllowed = registry.applications.filter((o) => o.status === 1)
    registry.applications = allowed
    registry.notAllowed = notAllowed
  }
  return registry
}

const unsubscribeApiNews = function () {
  if (socket && stompClient) {
    stompClient.disconnect()
  }
}

const rpayStacksContractStore = {
  namespaced: true,
  state: {
    registry: null,
    gaiaAssets: [],
    tokens: [],
    myContractAssets: null
  },
  getters: {
    getRegistry: state => {
      return state.registry
    },
    getContractAssetByNftIndex: state => nftIndex => {
      const result = state.gaiaAssets.find((o) => o.contractAsset && o.contractAsset.nftIndex === nftIndex)
      return result
    },
    getTargetFileForDisplay: state => item => {
      if (item === null) return
      const af = item.attributes.artworkFile
      if (af && af.type && af.type.length > 0 && af.type !== 'threed') {
        return 'artworkFile'
      } else if (item.attributes.artworkClip && item.attributes.artworkClip.fileUrl) {
        return 'artworkClip'
      }
      return 'coverImage'
    },
    getApplicationFromRegistryByContractId: state => contractId => {
      if (!state.registry || !state.registry.applications) return
      const result = state.registry.applications.find((o) => o.contractId === contractId)
      return result
    },
    getTradeInfoFromHash: state => ahash => {
      const asset = state.gaiaAssets.find((o) => o.assetHash === ahash)
      if (!asset || !asset.contractAsset || !asset.contractAsset.saleData) {
        return {
          saleType: 0,
          buyNowOrStartingPrice: 0,
          reservePrice: 0,
          biddingEndTime: 0,
          incrementPrice: 0
        }
      }
      return asset.contractAsset.saleData
    },
    getAssetFromContractByHash: state => assetHash => {
      const result = state.gaiaAssets.find((o) => o.contractAsset && o.contractAsset.tokenInfo.assetHash === assetHash)
      return (result) ? result.contractAsset : null
    },
    getGaiaAssetByHash: state => assetHash => {
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === assetHash)
      if (index > -1) {
        return state.gaiaAssets[index]
      }
      return null
    },
    getAssetsByContractId: state => contractId => {
      const results = state.gaiaAssets.filter((o) => o.contractAsset.contractId === contractId)
      return results
    },
    getAssetsByContractIdAndOwner: state => data => {
      const results = state.gaiaAssets.filter((o) => o.contractAsset.owner === data.stxAddress && o.contractAsset.contractId === data.contractId)
      return results
    },
    getMyContractAssets: state => {
      return state.myContractAssets
    },
    getAssetByHashAndEdition: state => data => {
      let ga = null
      try {
        ga = state.gaiaAssets.find((o) => o.contractAsset.tokenInfo.assetHash === data.assetHash && o.contractAsset.tokenInfo.edition === data.edition)
        if (ga) return ga
      } catch (err) {}
      return null
    },
    getGaiaAssets: state => {
      return state.gaiaAssets
    },
    getGaiaAssetsByOwner: state => data => {
      return state.gaiaAssets.filter((o) => o.contractAsset.owner === data.stxAddress)
    },
    getGaiaAssetsByArtist: state => data => {
      if (!state.gaiaAssets) return
      return state.gaiaAssets.filter((o) => {
        const oArtistId = o.artist.toLowerCase().replace(/ /g, '')
        if (oArtistId === data.artistId) {
          return o
        }
        return null
      })
    }
  },
  mutations: {
    setRegistry (state, data) {
      let registry = data.registry
      registry = removeStatusOneApps(registry, data.contractId)
      registry = utils.resolvePrincipals(registry, data.network)
      state.registry = registry
    },
    updateTokens (state, data) {
      data.tokens.forEach((token) => {
        token = utils.resolvePrincipalsToken(data.network, token)
        let index = state.gaiaAssets.findIndex((o) => o.contractAsset && o.contractAsset.nftIndex === token.nftIndex)
        if (index > -1) {
          state.gaiaAssets[index].contractAsset = token
        }
        if (state.myContractAssets) {
          index = state.myContractAssets.findIndex((o) => o.nftIndex === token.nftIndex)
          if (index > -1) {
            state.myContractAssets[index] = token
          }
        }
      })
    },
    addGaiaAsset (state, gaiaAsset) {
      try {
        const index = state.gaiaAssets.findIndex((o) => o.contractAsset.nftIndex === gaiaAsset.contractAsset.nftIndex)
        if (index === -1) {
          state.gaiaAssets.splice(0, 0, gaiaAsset)
        } else {
          state.gaiaAssets.splice(index, 1, gaiaAsset)
        }
        state.gaiaAssets = sortResults(state.gaiaAssets)
      } catch (err) {
        console.log('state.gaiaAssets', state.gaiaAssets)
        console.log('gaiaAsset', gaiaAsset)
      }
    },
    setMyContractAssets: (state, myContractAssets) => {
      state.myContractAssets = myContractAssets
    }
  },
  actions: {
    updateCache ({ commit, rootGetters }, txData) {
      return new Promise(function (resolve) {
        const stacksTx = {
          timestamp: txData.timestamp || new Date().getTime(),
          nftIndex: txData.nftIndex,
          contractId: txData.contractId,
          functionName: txData.functionName,
          assetHash: txData.assetHash,
          txId: txData.txId,
          type: txData.type,
          txStatus: txData.txStatus
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/cache/update', stacksTx).then((response) => {
          const token = response.data
          loadAssetsFromGaia([token], commit, configuration.network)
          resolve(token)
        }).catch(() => {
          stacksTx.failed = true
          resolve(stacksTx)
        })
      })
    },
    cleanup ({ state }) {
      return new Promise((resolve) => {
        unsubscribeApiNews()
        resolve(null)
      })
    },
    fetchRegistry ({ state, commit, rootGetters }) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let path = configuration.risidioBaseApi + '/mesh/v2/registry'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        if (configuration.risidioProjectId) {
          path = configuration.risidioBaseApi + '/mesh/v2/registry/' + configuration.risidioProjectId
        }
        axios.get(path, authHeaders).then(response => {
          commit('setRegistry', { registry: response.data, contractId: configuration.risidioProjectId, network: configuration.network })
          resolve(state.registry)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchContractDataFirstEditions ({ dispatch, commit, rootGetters }) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        dispatch('fetchRegistry').then((registry) => {
          const path = configuration.risidioBaseApi + '/mesh/v2/tokensByContractIdAndEdition/' + configuration.risidioProjectId + '/' + 1
          const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
          axios.get(path, authHeaders).then(response => {
            // const tokens = utils.resolvePrincipalsTokens(configuration.network, response.data)
            resolve(true)
            loadAssetsFromGaia(response.data, commit, configuration.network)
            subscribeApiNews(commit, configuration.risidioBaseApi + '/mesh', configuration.risidioProjectId, configuration.network)
          }).catch(() => {
            resolve(null)
          })
        })
      })
    },
    indexGaiaData ({ rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = configuration.risidioBaseApi + '/mesh/v2/gaia/indexFiles'
        axios.get(path).then((response) => {
          resolve(true)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAssetsByOwner ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        // b32Address[0] -> network : 22=mainnet, 26=testnet
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = configuration.risidioBaseApi + '/mesh/v2/tokensByProjectAndOwner/' + configuration.risidioProjectId + '/' + b32Address[1]
        axios.get(path).then((response) => {
          const tokens = utils.resolvePrincipalsTokens(configuration.network, response.data)
          if (data.mine) {
            commit('setMyContractAssets', tokens)
          }
          loadAssetsFromGaia(response.data, commit, configuration.network)
          resolve(tokens)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAssetByNftIndex ({ commit, rootGetters }, nftIndex) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenByIndex/' + configuration.risidioProjectId + '/' + nftIndex
        axios.get(path, authHeaders).then((response) => {
          loadAssetsFromGaia([response.data], commit, configuration.network)
          resolve(null)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAssetByHash ({ commit, rootGetters }, assetHash) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenByHash/' + assetHash
        axios.get(path, authHeaders).then((response) => {
          loadAssetsFromGaia([response.data], commit, configuration.network)
          resolve(null)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAssetByHashAndEdition ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const ga = rootGetters['rpayStacksContractStore/getAssetByHashAndEdition'](data)
        if (ga) {
          resolve(ga)
          return
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenByAssetHashAndEdition/' + data.assetHash + '/' + data.edition
        axios.get(path, authHeaders).then((response) => {
          const token = response.data
          if (token.tokenInfo) {
            loadAssetsFromGaia([token], commit, configuration.network)
          }
          resolve(null)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchAssetFirstsByHashes ({ commit, rootGetters }, assetHashes) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenFirstsByQuery'
        const data = {
          queryType: 'tokens',
          contractId: configuration.risidioProjectId,
          hashes: assetHashes
        }
        axios.post(path, data, authHeaders).then((response) => {
          const tokens = utils.resolvePrincipalsTokens(configuration.network, response.data)
          loadAssetsFromGaia(tokens, commit, configuration.network)
          resolve(null)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

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
      }).catch(() => {
        commit('addGaiaAsset', {
          name: 'Unknown in Gaia',
          assetHash: token.tokenInfo.assetHash,
          attributes: {
            artworkFile: {
              fileUrl: 'https://images.prismic.io/dbid/c19ad445-eab4-4de9-9b5a-c10eb158dc5e_black_no1.png?auto=compress,format',
              type: 'image/jpg',
              name: 'Waiting Image'
            }
          },
          contractAsset: token
        })
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
    stompClient.subscribe('/queue/mempool-news', function (response) {
      const mempool = JSON.parse(response.body)
      commit('setMempool', mempool)
    })
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
  function () {
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
    mempool: null,
    mempoolSettings: null,
    myContractAssets: null
  },
  getters: {
    getMempool: state => {
      return state.mempool
    },
    getMempoolSettings: state => {
      return state.mempoolSettings
    },
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
    getGaiaAssetsByOwnerAndCollection: state => data => {
      return state.gaiaAssets.filter((o) => o.contractAsset.tokenInfo.metaDataUrl.indexOf(data.runKey) > -1 && o.contractAsset.owner === data.stxAddress)
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
    setMempool (state, mempool) {
      state.mempool = mempool
    },
    setMempoolSettings (state, mempoolSettings) {
      state.mempoolSettings = mempoolSettings
    },
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
    fetchMempool ({ commit, rootGetters }) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/mempool').then((response) => {
          const mempool = response.data
          commit('setMempool', mempool)
          // resolve(mempool)
          axios.get(configuration.risidioBaseApi + '/mesh/v2/mempool-settings').then((response) => {
            const mempoolSettings = response.data
            commit('setMempoolSettings', mempoolSettings)
            resolve({ mempool: mempool, mempoolSettings: mempoolSettings })
          }).catch(() => {
            resolve(null)
          })
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateCacheByNftIndex ({ commit, rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/cache/update-by-index/' + data.contractId + '/' + data.nftIndex).then((response) => {
          const token = response.data
          loadAssetsFromGaia([token], commit, configuration.network)
          resolve(token)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    updateCacheByHash ({ commit, rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/cache/update-by-hash/' + data.contractId + '/' + data.assetHash).then((response) => {
          const token = response.data
          loadAssetsFromGaia([token], commit, configuration.network)
          resolve(token)
        }).catch(() => {
          resolve(null)
        })
      })
    },
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
        const path = configuration.risidioBaseApi + '/mesh/v2/registry'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(path, authHeaders).then(response => {
          commit('setRegistry', { registry: response.data, contractId: configuration.risidioProjectId, network: configuration.network })
          resolve(state.registry)
        }).catch(() => {
          resolve(null)
        })
      })
    },
    fetchFullRegistry ({ state, commit, rootGetters }) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = configuration.risidioBaseApi + '/mesh/v2/registry'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
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
        const path = configuration.risidioBaseApi + '/mesh/mgmnt-v2/gaia/indexFiles'
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(path, authHeaders).then((response) => {
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
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(path, authHeaders).then((response) => {
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
    fetchContractAssetByNftIndex ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenByIndex/' + data.contractId + '/' + data.nftIndex
        axios.get(path, authHeaders).then((response) => {
          resolve(response.data)
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
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        const path = configuration.risidioBaseApi + '/mesh/v2/tokenByAssetHashAndEdition/' + data.assetHash + '/' + data.edition
        axios.get(path, authHeaders).then((response) => {
          const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data)
          commit('addGaiaAsset', gaiaAsset)
          resolve(gaiaAsset)
        }).catch(() => {
          resolve(null)
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
    },
    fetchTokensByContractIdAndRunKey ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/tokens'
        if (data.contractId) uri += '/' + data.contractId
        if (data.runKey) uri += '/' + data.runKey
        if (data.makerUrlKey) uri += '/' + data.makerUrlKey
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens)
          const result = {
            gaiaAssets: gaiaAssets,
            tokenCount: response.data.tokenCount
          }
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchTokensByContractId ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/tokens'
        uri += '/' + data.contractId
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens)
          const result = {
            gaiaAssets: gaiaAssets,
            tokenCount: response.data.tokenCount
          }
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchTokensByContractIdAndName ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/tokensByName'
        if (data.contractId) uri += '/' + data.contractId
        uri += '/' + data.runKey // resolve to NFT name on server from nftMetaData collection
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens)
          const result = {
            gaiaAssets: gaiaAssets,
            tokenCount: response.data.tokenCount
          }
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchTokensByFilters ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/tokensByFilters'
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens)
          const result = {
            gaiaAssets: gaiaAssets,
            tokenCount: response.data.tokenCount
          }
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchMyTokens ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/my-tokens'
        if (data.runKey) uri += '/' + data.runKey
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        uri += '/' + b32Address[1]
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens)
          const result = {
            gaiaAssets: gaiaAssets,
            tokenCount: response.data.tokenCount
          }
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchTokenByContractIdAndNftIndex ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const uri = configuration.risidioBaseApi + '/mesh/v2/token-by-index/' + data.contractId + '/' + data.nftIndex
        axios.get(uri).then((response) => {
          const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data)
          commit('addGaiaAsset', gaiaAsset)
          resolve(gaiaAsset)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchTokenByContractIdAndAssetHash ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi + '/mesh/v2/token-by-hash/' + data.contractId + '/' + data.assetHash
        if (data.query) uri += data.query
        axios.get(uri).then((response) => {
          try {
            const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data)
            commit('addGaiaAsset', gaiaAsset)
            resolve(gaiaAsset)
          } catch (err) {
            resolve(null)
          }
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchMetaData ({ rootGetters }, token) {
      return new Promise((resolve) => {
        axios.get(token.tokenInfo.metaDataUrl).then(response => {
          const metaData = response.data
          resolve(metaData)
        }).catch(() => {
          resolve(null)
        })
      })
    }
  }
}
export default rpayStacksContractStore

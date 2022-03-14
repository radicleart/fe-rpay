import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'
import {
  hexToCV
} from '@stacks/transactions'

let socket = null
let stompClient = null

const sortResults = function (gaiaAssets) {
  try {
    return gaiaAssets.sort((g1, g2) => g1.contractAsset.nftIndex - g2.contractAsset.nftIndex)
  } catch (err) {
    return gaiaAssets
  }
}

const loadAssetsFromGaia = function (tokens, commit, network, sipTenTokens) {
  tokens.forEach((token) => {
    if (token && token.tokenInfo) {
      token = utils.resolvePrincipalsToken(network, token, sipTenTokens)
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

const subscribeApiNews = function (commit, connectUrl, contractId, network, sipTenTokens) {
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
        commit('updateTokens', { tokens: cacheUpdateResult.tokens, network: network, sipTenTokens: sipTenTokens })
      })
    } else {
      stompClient.subscribe('/queue/contract-news-' + contractId, function (response) {
        const cacheUpdateResult = JSON.parse(response.body)
        commit('updateTokens', { tokens: cacheUpdateResult.tokens, network: network, sipTenTokens: sipTenTokens })
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
    bnsNames: null,
    registry: null,
    gaiaAssets: [],
    tokens: [],
    mempool: null,
    mempoolSettings: null,
    myContractAssets: null
  },
  getters: {
    getBnsNames: state => {
      return state.bnsNames
    },
    getBnsName: state => stxAddress => {
      return (state.bnsNames) ? state.bnsNames.find((o) => o.stxAddress === stxAddress) : null
    },
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
    setBnsNames (state, bnsNames) {
      state.bnsNames = bnsNames
    },
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
        token = utils.resolvePrincipalsToken(data.network, token, data.sipTenTokens)
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
            resolve(true)
            loadAssetsFromGaia(response.data, commit, configuration.network)
            subscribeApiNews(commit, configuration.risidioBaseApi + '/mesh', configuration.risidioProjectId, configuration.network, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const tokens = utils.resolvePrincipalsTokens(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
          if (data.mine) {
            commit('setMyContractAssets', tokens)
          }
          loadAssetsFromGaia(response.data, commit, configuration.network, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
          resolve(tokens)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchContractAssetByNftIndex ({ rootGetters }, data) {
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
          loadAssetsFromGaia([response.data], commit, configuration.network, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const tokens = utils.resolvePrincipalsTokens(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
          loadAssetsFromGaia(tokens, commit, configuration.network, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
        uri += '/mesh/v2'
        if (data.runKey && !data.contractId) uri += '/my-tokens/' + data.runKey
        else if (data.contractId) uri += '/my-tokens-by-contract/' + data.contractId
        else uri += '/my-tokens'
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        uri += '/' + b32Address[1]
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
    fetchMyTokensCPSV2 ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2'
        // if (data.runKey && !data.contractId) uri += '/my-tokens/' + data.runKey
        if (data.contractId) uri += '/my-tokens-by-contract/' + data.contractId
        else uri += '/my-tokens'
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        uri += '/' + b32Address[1]
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(uri, authHeaders).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
          const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
            const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
    fetchMetaDataUrl ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/meta-data-url/' + data.contractId + '/' + data.nftIndex
        axios.get(uri).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchWalletCount ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        uri += '/mesh/v2/meta-data-count/' + b32Address[1]
        axios.get(uri).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchWalletNftsByFilters ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/meta-data'
        const b32Address = utils.convertAddressFrom(data.stxAddress)
        uri += '/' + b32Address[1]
        uri += '/' + data.page
        uri += '/' + data.pageSize
        if (data.query) uri += data.query
        axios.get(uri).then((response) => {
          const gaiaAssets = utils.resolvePrincipalsGaiaTokens(configuration.network, response.data.tokens, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
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
    fetchAssetNames ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let uri = configuration.risidioBaseApi
        uri += '/mesh/v2/meta-data-assetNames/' + data.stxAddress
        if (data.query) uri += data.query
        axios.get(uri).then((response) => {
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    cacheWalletNfts ({ dispatch, rootGetters }, data) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let url = configuration.risidioStacksApi + '/extended/v1/address/' + data.stxAddress + '/nft_events'
        if (data.pageSize) {
          url += '?limit=' + data.pageSize + '&offset=' + data.pageSize * data.page
        }
        axios.get(url).then((response) => {
          const nfts = response.data
          if (nfts && nfts.total > 0) {
            this.numberOfItems = nfts.nft_events.length
            this.tokenCount = nfts.total
            const walletNftBeans = []
            nfts.nft_events.forEach((o) => {
              if (o.asset_identifier) {
                if (data.contractFilter && o.asset_identifier.indexOf(data.contractFilter) > -1) {
                  const b32Address = utils.convertAddressFrom(o.recipient)
                  const walletNft = {
                    contractId: o.asset_identifier.split('::')[0],
                    stxAddress: o.recipient,
                    assetName: o.asset_identifier.split('::')[1],
                    blockHeight: o.block_height,
                    owner: b32Address[1],
                    sender: o.sender,
                    txId: o.tx_id,
                    nftIndex: Number(hexToCV(o.value.hex).value)
                  }
                  walletNftBeans.push(walletNft)
                }
              }
            })
            dispatch('fetchWalletCount', data).then((count) => {
              resolve(nfts)
              if (data.force || count < nfts.total) {
                const configuration = rootGetters['rpayStore/getConfiguration']
                const uri = configuration.risidioBaseApi + '/mesh/v2/meta-data'
                axios.post(uri, walletNftBeans).then((response) => {
                  if (data.pageSize * (data.page + 1) < (nfts.total)) {
                    data.page = data.page + 1
                    dispatch('cacheWalletNfts', data)
                  } else if (data.pageSize * (data.page + 1) < (nfts.total + data.pageSize)) {
                    data.page = data.page + 1
                    dispatch('cacheWalletNfts', data)
                  }
                })
              }
            })
          }
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    cacheOneFromWallet ({ rootGetters }, data) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const uri = configuration.risidioBaseApi + '/mesh/v2/meta-data/' + data.contractId + '/' + data.nftIndex
        axios.get(uri).then((response) => {
          const gaiaAsset = utils.resolvePrincipalsGaiaToken(configuration.network, response.data, rootGetters['rpayMarketGenFungStore/getSipTenTokens'])
          resolve(gaiaAsset)
        }).catch(() => {
          resolve()
        })
      })
    },
    fetchNftEvents ({ rootGetters }, data) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let url = configuration.risidioBaseApi + '/mesh/v2/nft-events/' + data.stxAddress
        if (data.bns) {
          url += '/bns'
        }
        axios.get(url).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    fetchBnsNames ({ commit, rootGetters }, stxAddresses) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = configuration.risidioBaseApi + '/mesh/v2/nft-events/bns'
        axios.post(path, stxAddresses).then((response) => {
          const bnsNames = response.data
          commit('setBnsNames', bnsNames)
          resolve(bnsNames)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

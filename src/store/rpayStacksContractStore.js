import axios from 'axios'
import { AppConfig, UserSession } from '@stacks/connect'
import { Storage } from '@stacks/storage'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const storage = new Storage({ userSession })
let socket = null
let stompClient = null

const tokenFromHash = function (state, ahash) {
  let myToken = null
  try {
    state.registry.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        const index = app.tokenContract.tokens.findIndex((o) => o.tokenInfo.assetHash === ahash)
        if (index > -1) {
          myToken = app.tokenContract.tokens[index]
        }
      }
    })
  } catch (err) {
    return myToken
  }
  return myToken
}

const replaceTokenFromHash = function (state, token) {
  let result = false
  try {
    state.registry.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        const index = app.tokenContract.tokens.findIndex((o) => o.tokenInfo.assetHash === token.tokenInfo.assetHash)
        if (index > -1) {
          app.tokenContract.tokens[index] = token
          result = true
        }
      }
    })
  } catch (err) {
  }
  return result
}

const fetchGaiaData = function (commit, state, data, gaiaAppDomains) {
  try {
    const index = state.gaiaAssets.findIndex((o) => o.assetHash === data.assetHash)
    if (index > -1) return // already read this file in current page session
    const options = {
      decrypt: false,
      username: data.gaiaUsername
    }
    if (!gaiaAppDomains) {
      gaiaAppDomains = []
    }
    const index1 = gaiaAppDomains.findIndex((o) => o === location.origin)
    if (index1 === -1) {
      gaiaAppDomains.push(location.origin)
    }

    gaiaAppDomains.forEach((dom) => {
      options.app = dom
      storage.getFile(data.gaiaFilename, options).then((file) => {
        const rootFile = JSON.parse(file)
        if (rootFile && rootFile.records && rootFile.records.length > -1) {
          rootFile.records.forEach((gaiaAsset) => {
            const token = tokenFromHash(state, gaiaAsset.assetHash)
            if (token) {
              gaiaAsset = Object.assign(gaiaAsset, token)
              commit('addGaiaAsset', gaiaAsset)
            }
          })
        }
      }).catch((error) => {
        console.log(error)
      })
    })
  } catch (err) {
    console.log(err)
  }
}

const loadAssetsFromGaia = function (commit, state, gaiaAppDomains) {
  if (state.registry && state.registry.applications) {
    state.registry.applications.forEach((app) => {
      if (app && app.tokenContract && app.tokenContract.tokens) {
        app.tokenContract.tokens.forEach((token) => {
          fetchGaiaData(commit, state, { gaiaFilename: app.gaiaFilename, gaiaUsername: token.tokenInfo.gaiaUsername, assetHash: token.tokenInfo.assetHash }, gaiaAppDomains)
        })
      }
    })
  }
}

const subscribeApiNews = function (state, commit, connectUrl, gaiaAppDomains, contractId) {
  if (!socket) socket = new SockJS(connectUrl + '/api-news')
  if (!stompClient) stompClient = Stomp.over(socket)
  socket.onclose = function () {
    console.log('close')
    stompClient.disconnect()
  }
  stompClient.connect({}, function () {
    if (!contractId) {
      stompClient.subscribe('/queue/contract-news', function (response) {
        const registry = JSON.parse(response.body)
        commit('setRegistry', registry)
        loadAssetsFromGaia(commit, state, gaiaAppDomains)
        // const data = { opcode: 'stx-contract-data', registry: registry }
        // window.eventBus.$emit('rpayEvent', data)
      })
    } else {
      stompClient.subscribe('/queue/contract-news-' + contractId, function (response) {
        const registry = JSON.parse(response.body)
        commit('setRegistry', registry)
        loadAssetsFromGaia(commit, state, gaiaAppDomains)
        // const data = { opcode: 'stx-contract-data', registry: registry }
        // window.eventBus.$emit('rpayEvent', data)
      })
    }
  },
  function (error) {
    console.log(error)
  })
}

const unsubscribeApiNews = function () {
  if (socket && stompClient) {
    stompClient.disconnect()
  }
}

const convertToTradeInfo = function (asset) {
  const saleData = {
    saleType: 0,
    buyNowOrStartingPrice: 0,
    reservePrice: 0,
    biddingEndTime: 0,
    incrementPrice: 0
  }
  if (asset && asset.saleData) {
    saleData.saleType = asset.saleData['sale-type'].value
    saleData.buyNowOrStartingPrice = asset.saleData['amount-stx'].value
    saleData.reservePrice = asset.saleData['reserve-stx'].value
    saleData.biddingEndTime = asset.saleData['bidding-end-time'].value
    saleData.incrementPrice = asset.saleData['increment-stx'].value
  }
  return saleData
}

const rpayStacksContractStore = {
  namespaced: true,
  state: {
    registry: null,
    registryContractId: process.env.VUE_APP_REGISTRY_CONTRACT_ADDRESS + '.' + process.env.VUE_APP_REGISTRY_CONTRACT_NAME,
    gaiaAssets: []
  },
  getters: {
    getRegistry: state => {
      return state.registry
    },
    getRegistryContractId: state => {
      return state.registryContractId
    },
    getApplicationFromRegistryByContractId: state => contractId => {
      if (!state.registry || !state.registry.applications) return
      const index = state.registry.applications.findIndex((o) => o.contractId === contractId)
      if (index < 0) return null
      return state.registry.applications[index]
    },
    getTradeInfoFromHash: state => ahash => {
      const asset = tokenFromHash(state, ahash)
      return convertToTradeInfo(asset)
    },
    getAssetFromContractByHash: state => assetHash => {
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === assetHash)
      if (index > -1) {
        return state.gaiaAssets[index]
      }
      return null
    },
    getAssetsByContractId: state => contractId => {
      if (!state.registry || !state.registry.applications) return
      const index = state.registry.applications.findIndex((o) => o.contractId === contractId)
      if (index < 0) return []
      return state.registry.applications[index].tokenContract.tokens
    },
    getAssetsByContractIdAndOwner: state => data => {
      if (!state.registry || !state.registry.applications) return
      const index = state.registry.applications.findIndex((o) => o.contractId === data.contractId)
      if (index < 0) return []
      const tokens = state.registry.applications[index].tokenContract.tokens
      return tokens.filter((o) => o.gaiaUsername === data.username)
    }
  },
  mutations: {
    setRegistry (state, registry) {
      state.registry = registry
    },
    setToken (state, token) {
      replaceTokenFromHash(state, token)
    },
    addGaiaAsset (state, gaiaAsset) {
      if (!state.gaiaAssets) return
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === gaiaAsset.assetHash)
      if (index === -1) {
        state.gaiaAssets.splice(0, 0, gaiaAsset)
      } else {
        state.gaiaAssets.splice(index, 1, gaiaAsset)
      }
    },
    addContractWriteResult (state, asset) {
      if (!state.gaiaAssets) return
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === asset.assetHash)
      if (index === -1) {
        state.gaiaAssets.splice(0, 0, asset)
      } else {
        state.gaiaAssets.splice(index, 1, asset)
      }
    }
  },
  actions: {
    cleanup ({ state, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        unsubscribeApiNews()
        resolve(null)
      })
    },
    fetchContractData ({ state, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        // if project id is set in config then read search index of this
        // project. Otherwise search projects recursively
        let path = configuration.risidioBaseApi + '/mesh/v2/registry'
        if (configuration.risidioProjectId) {
          path = configuration.risidioBaseApi + '/mesh/v2/registry/' + configuration.risidioProjectId
        }
        axios.get(path).then(response => {
          subscribeApiNews(state, commit, configuration.risidioBaseApi + '/mesh', configuration.gaiaAppDomains, configuration.risidioProjectId)
          commit('setRegistry', response.data)
          loadAssetsFromGaia(commit, state, configuration.gaiaAppDomains)
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

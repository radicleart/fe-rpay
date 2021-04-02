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
      gaiaAppDomains.push(location.host)
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
            }
            commit('addGaiaAsset', gaiaAsset)
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

const loadAssetsFromGaia = function (commit, state) {
  if (state.registry && state.registry.applications) {
    state.registry.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        app.tokenContract.tokens.forEach((token) => {
          fetchGaiaData(commit, state, { gaiaFilename: app.gaiaFilename, gaiaUsername: token.tokenInfo.gaiaUsername, assetHash: token.tokenInfo.assetHash })
        })
      }
    })
  }
}

const subscribeApiNews = function (state, commit, connectUrl) {
  if (!socket) socket = new SockJS(connectUrl + '/api-news')
  if (!stompClient) stompClient = Stomp.over(socket)
  stompClient.connect({}, function () {
    stompClient.subscribe('/queue/contract-news', function (response) {
      const registry = JSON.parse(response.body)
      commit('setRegistry', registry)
      loadAssetsFromGaia(commit, state)
      // const data = { opcode: 'stx-contract-data', registry: registry }
      // window.eventBus.$emit('rpayEvent', data)
    })
  },
  function (error) {
    console.log(error)
  })
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
    gaiaAssets: []
  },
  getters: {
    getAppMapContract: state => {
      return state.registry
    },
    getTradeInfoFromHash: state => ahash => {
      const asset = tokenFromHash(state, ahash)
      return convertToTradeInfo(asset)
    },
    getAssetFromContractByHash: state => ahash => {
      return tokenFromHash(state, ahash)
    }
  },
  mutations: {
    setRegistry (state, registry) {
      state.registry = registry
    },
    addGaiaAsset (state, data) {
      if (!state.gaiaAssets) return
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === data.asset.assetHash)
      if (index === -1) {
        state.gaiaAssets.splice(0, 0, data.asset)
      } else {
        state.gaiaAssets.splice(index, 1, data.asset)
      }
    }
  },
  actions: {
    fetchContractData ({ state, dispatch, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        // if project id is set in config then read search index of this
        // project. Otherwise search projects recursively
        let path = configuration.risidioBaseApi + '/mesh/v2/appmap'
        if (configuration.risidioProjectId) {
          path = configuration.risidioBaseApi + '/mesh/v2/appmap/' + configuration.risidioProjectId
        }
        axios.get(path).then(response => {
          subscribeApiNews(state, commit, configuration.risidioBaseApi + '/mesh', configuration.gaiaAppDomains)
          commit('setRegistry', response.data)
          loadAssetsFromGaia(dispatch, state)
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

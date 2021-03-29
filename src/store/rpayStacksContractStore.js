import axios from 'axios'
import { AppConfig, UserSession } from '@stacks/connect'
import { Storage } from '@stacks/storage'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const storage = new Storage({ userSession })

const assetFromHash = function (state, ahash) {
  let myToken = { nftIndex: -1 }
  try {
    state.appMapContract.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        app.tokenContract.tokens.forEach((token) => {
          if (token.tokenInfo['asset-hash'].valueHex === ahash) {
            myToken = token
          }
        })
      }
    })
  } catch (err) {
    return myToken
  }
  return myToken
}

const loadAssetsFromGaia = function (dispatch, state) {
  try {
    state.appMapContract.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        app.tokenContract.tokens.forEach((token) => {
          dispatch('fetchGaiaData', { gaiaFilename: app.gaiaFilename, gaiaUsername: token.tokenInfo['gaia-username'].value, assetHash: token.tokenInfo['asset-hash'].valueHex })
        })
      }
    })
  } catch (err) {
  }
}

const convertToTradeInfo = function (asset) {
  const tradeInfo = {
    saleType: 0,
    buyNowOrStartingPrice: 0,
    reservePrice: 0,
    biddingEndTime: 0,
    incrementPrice: 0
  }
  if (asset && asset.saleData) {
    tradeInfo.saleType = asset.saleData['sale-type'].value
    tradeInfo.buyNowOrStartingPrice = asset.saleData['amount-stx'].value
    tradeInfo.reservePrice = asset.saleData['reserve-stx'].value
    tradeInfo.biddingEndTime = asset.saleData['bidding-end-time'].value
    tradeInfo.incrementPrice = asset.saleData['increment-stx'].value
  }
  return tradeInfo
}

const rpayStacksContractStore = {
  namespaced: true,
  state: {
    appMapContract: null,
    rootFileList: [],
    gaiaAssets: []
  },
  getters: {
    getAppMapContract: state => {
      return state.appMapContract
    },
    getTradeInfoFromHash: state => ahash => {
      const asset = assetFromHash(state, ahash)
      return convertToTradeInfo(asset)
    },
    getAssetFromHash: state => ahash => {
      return assetFromHash(state, ahash)
    }
  },
  mutations: {
    setAppMapContract (state, appMapContract) {
      state.appMapContract = appMapContract
    },
    addRootFile (state, data) {
      const index = state.rootFileList.findIndex((o) => o.gaiaFilename === data.gaiaFilename && o.gaiaUsername === data.gaiaUsername)
      if (index === -1) {
        state.rootFileList.splice(0, 0, data)
      }
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
          commit('setAppMapContract', response.data)
          loadAssetsFromGaia(dispatch, state)
          resolve(response.data)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    fetchGaiaData ({ state, commit }, data) {
      return new Promise((resolve, reject) => {
        const index = state.rootFileList.findIndex((o) => o.gaiaFilename === data.gaiaFilename && o.gaiaUsername === data.gaiaUsername)
        if (index > -1) return // already read this file in current page session
        commit('addRootFile', data)
        const options = {
          decrypt: false,
          username: data.gaiaUsername
        }
        storage.getFile(data.gaiaFilename, options).then((file) => {
          const rootFile = JSON.parse(file)
          if (rootFile && rootFile.records && rootFile.records.length > -1) {
            rootFile.records.forEach((asset) => {
              commit('addGaiaAsset', { asset: asset })
            })
          }
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

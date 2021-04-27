import axios from 'axios'
import SockJS from 'sockjs-client'
import Stomp from '@stomp/stompjs'
import utils from '@/services/utils'

let socket = null
let stompClient = null

const tokenFromHash = function (registry, ahash) {
  let myToken = null
  try {
    if (!registry || !registry.applications) return
    registry.applications.forEach((app) => {
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

/**
export async function fetchAppGaiaHubUrl(username) {
  const response = await fetch(`https://core.blockstack.org/v1/users/${username}`);
  const zonefile = await response.json(); // the users zonefile

  const app = APP_URL; // the app you're looking for, eg 'http://localhost:3000'
  const zone_file = Object.values(zonefile)?.[0] as any;

  // account for both legacy use and the new format from the extension
  if (zone_file?.profile.apps || zone_file?.profile.appsMeta) {
    if (zone_file.profile?.appsMeta?.[app]) {
      return zone_file.profile?.appsMeta?.[app].storage;
    }
    if (zone_file.profile?.apps?.[app]) {
      return zone_file.profile?.apps?.[app];
    }
  }
  throw Error('Cannot find zonefile');
}
**/
const replaceTokenFromHash = function (state, token) {
  let result = false
  try {
    if (!state.registry || !state.registry.applications) return
    state.registry.applications.forEach((app) => {
      if (app.tokenContract && app.tokenContract.tokens) {
        const index = app.tokenContract.tokens.findIndex((o) => o.tokenInfo.assetHash === token.tokenInfo.assetHash)
        if (index > -1) {
          app.tokenContract.tokens[index] = token
          result = true
        } else {
          app.tokenContract.tokens.push(token)
          result = true
        }
      }
    })
  } catch (err) {
  }
  return result
}

const fetchAllGaiaData = function (commit, registry, appDataMap) {
  if (appDataMap) {
    const keySet = Object.keys(appDataMap)
    keySet.forEach((thisKey) => {
      const rootFile = JSON.parse(appDataMap[thisKey])
      if (rootFile && rootFile.records && rootFile.records.length > -1) {
        rootFile.records.forEach((gaiaAsset) => {
          const token = tokenFromHash(registry, gaiaAsset.assetHash)
          if (token) {
            // gaiaAsset = Object.assign(gaiaAsset, token)
            commit('addGaiaAsset', gaiaAsset)
          }
        })
      }
    })
  }
}

const loadAssetsFromGaia = function (commit, registry, connectUrl, contractId) {
  return new Promise((resolve) => {
    if (!registry) return
    if (registry.applications && contractId) {
      const index = registry.applications.findIndex((o) => o.contractId === contractId)
      if (index > -1) {
        const application = registry.applications[index]
        const data = {
          appOrigin: application.appOrigin
        }
        axios.post(connectUrl + '/v2/gaia/rootFilesByDomain', data).then((response) => {
          fetchAllGaiaData(commit, registry, response.data)
          resolve(response.data)
        })
      }
    } else {
      // the risidio xchange does not pass a contractId as its interested in all connected projects
      // however there needs to be a way to screen out projects with status=1
      axios.get(connectUrl + '/v2/gaia/rootFiles').then((response) => {
        fetchAllGaiaData(commit, registry, response.data)
        resolve(response.data)
      })
    }
  })
}

const subscribeApiNews = function (commit, connectUrl, contractId) {
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
        commit('setRegistry', { registry: registry, contractId: contractId })
        loadAssetsFromGaia(commit, registry, connectUrl, contractId)
      })
    } else {
      stompClient.subscribe('/queue/contract-news-' + contractId, function (response) {
        const registry = JSON.parse(response.body)
        commit('setRegistry', { registry: registry, contractId: contractId })
        loadAssetsFromGaia(commit, registry, connectUrl, contractId)
      })
    }
  },
  function (error) {
    console.log(error)
  })
}

const resolvePrincipals = function (registry) {
  if (!registry || !registry.administrator) return
  registry.administrator = utils.convertAddress(registry.administrator)
  if (registry.applications) {
    registry.applications.forEach((app) => {
      app.owner = utils.convertAddress(app.owner)
      if (app.tokenContract) {
        app.tokenContract.administrator = utils.convertAddress(app.tokenContract.administrator)
        app.tokenContract.mintPrice = utils.fromMicroAmount(app.tokenContract.mintPrice)
        app.tokenContract.tokens.forEach((token) => {
          token.owner = utils.convertAddress(token.owner)
          if (token.offerHistory) {
            token.offerHistory.forEach((offer) => {
              offer.offerer = utils.convertAddress(offer.offerer)
            })
          }
          if (token.transferHistory) {
            token.transferHistory.forEach((transfer) => {
              transfer.from = utils.convertAddress(transfer.from)
              transfer.to = utils.convertAddress(transfer.to)
              transfer.amount = utils.fromMicroAmount(transfer.amount)
            })
          }
          if (token.saleData) {
            token.saleData.buyNowOrStartingPrice = utils.fromMicroAmount(token.saleData.buyNowOrStartingPrice)
            token.saleData.incrementPrice = utils.fromMicroAmount(token.saleData.incrementPrice)
            token.saleData.reservePrice = utils.fromMicroAmount(token.saleData.reservePrice)
          }
          if (token.beneficiaries) {
            let idx = 0
            token.beneficiaries.shares.forEach((share) => {
              token.beneficiaries.shares[idx].value = utils.fromMicroAmount(share.value) / 100
              token.beneficiaries.addresses[idx].valueHex = utils.convertAddress(token.beneficiaries.addresses[idx].valueHex)
              idx++
            })
          }
          if (token.bidHistory) {
            token.bidHistory.forEach((bid) => {
              bid.amount = utils.fromMicroAmount(bid.amount)
              bid.bidder = utils.convertAddress(bid.bidder)
            })
          }
        })
      }
    })
  }
  return registry
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
    registryContractId: process.env.VUE_APP_REGISTRY_CONTRACT_ADDRESS + '.' + process.env.VUE_APP_REGISTRY_CONTRACT_NAME,
    gaiaAssets: [],
    stacksTransactions: []
  },
  getters: {
    getRegistry: state => {
      return state.registry
    },
    getTargetFileForDisplay: state => item => {
      if (item === null) return
      const af = item.nftMedia.artworkFile
      if (af && af.type && af.type.length > 0 && af.type !== 'threed') {
        return 'artworkFile'
      } else if (item.nftMedia.artworkClip && item.nftMedia.artworkClip.fileUrl) {
        return 'artworkClip'
      }
      return 'coverImage'
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
      const asset = tokenFromHash(state.registry, ahash)
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
      return tokenFromHash(state.registry, assetHash)
    },
    getGaiaAssetByHash: state => assetHash => {
      const index = state.gaiaAssets.findIndex((o) => o.assetHash === assetHash)
      if (index > -1) {
        return state.gaiaAssets[index]
      }
      return null
    },
    getAssetLastTransaction: (state, getters) => (assetHash) => {
      if (state.stacksTransactions && state.stacksTransactions.length > 0) {
        const matches = state.stacksTransactions.find((o) => o.assetHash === assetHash)
        if (matches && matches.length > 0) return matches[0]
      }
      return {}
    },
    getAssetTransaction: (state, getters) => (data) => {
      if (state.stacksTransactions && state.stacksTransactions.length > 0) {
        const matches = state.stacksTransactions.find((o) => o.assetHash === data.assetHash && o.txId === data.txId)
        if (matches && matches.length > 0) return matches[0]
      }
      return {}
    },
    getAssetTransactions: (state, getters) => (data) => {
      if (state.stacksTransactions && state.stacksTransactions.length > 0) {
        const matches = state.stacksTransactions.find((o) => o.assetHash === data.assetHash)
        if (matches && matches.length > 0) return matches
      }
      return []
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
      return tokens.filter((o) => o.owner === data.stxAddress)
    },
    getGaiaAssets: state => {
      return state.gaiaAssets
    },
    getGaiaAssetsByOwner: state => data => {
      if (!state.gaiaAssets) return
      return state.gaiaAssets.filter((o) => o.owner === data.username)
    }
  },
  mutations: {
    setRegistry (state, data) {
      let registry = data.registry
      registry = removeStatusOneApps(registry, data.contractId)
      registry = resolvePrincipals(registry)
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
    },
    addStacksTransactions: (state, stacksTransaction) => {
      if (!state.stacksTransactions) state.stacksTransactions = []
      state.stacksTransactions.splice(0, 0, stacksTransaction)
    },
    setStacksTransactions: (state, stacksTransactions) => {
      state.stacksTransactions = stacksTransactions
    }
  },
  actions: {
    postStacksTransaction ({ commit, rootGetters }, stacksTransaction) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register/transaction', stacksTransaction).then((result) => {
          commit('addStacksTransactions', stacksTransaction)
          resolve(stacksTransaction)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    fetchStacksTransactions ({ commit, rootGetters }, stacksTransaction) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register/transaction', stacksTransaction).then((result) => {
          commit('setStacksTransactions', stacksTransaction)
          resolve(stacksTransaction)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
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
          commit('setRegistry', { registry: response.data, contractId: configuration.risidioProjectId })
          loadAssetsFromGaia(commit, state.registry, configuration.risidioBaseApi + '/mesh', configuration.risidioProjectId).then((appDataMap) => {
            console.log(appDataMap)
            subscribeApiNews(commit, configuration.risidioBaseApi + '/mesh', configuration.risidioProjectId)
            resolve(state.registry)
          })
        }).catch(() => {
          resolve(null)
        })
      })
    },
    indexGaiaData ({ state, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const path = configuration.risidioBaseApi + '/mesh/v2/gaia/indexFiles'
        axios.get(path).then(response => {
          loadAssetsFromGaia(commit, state.registry, configuration.risidioBaseApi + '/mesh', configuration.risidioProjectId).then((appDataMap) => {
            resolve(appDataMap)
          })
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayStacksContractStore

import axios from 'axios'

let SEARCH_API_PATH = null

/**
 *  The service is a client to the brightblock sever side grpc client.
 **/
const searchIndexService = {
  /**
  removeRecord: function (field, value) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/removeRecord/' + field + '/' + value).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable unindex record: ' + error))
      })
    })
  },
  addRecords: function (application) {
    return new Promise(function (resolve, reject) {
      axios.post(SEARCH_API_PATH + '/v1/application', application).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  **/
  setBaseUrl: function (baseUrl) {
    SEARCH_API_PATH = baseUrl + '/index'
  },

  addTradeInfo: function (baseUrl, asset) {
    return new Promise(function (resolve, reject) {
      axios.post(baseUrl + '/index/v1/trade-info/' + asset.assetHash, asset.saleData).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  addRecord: function (baseUrl, indexable) {
    return new Promise(function (resolve, reject) {
      if (!indexable.domain) indexable.domain = location.hostname
      if (!indexable.objType) indexable.objType = 'artwork'
      if (indexable.keywords && !Array.isArray(indexable.keywords)) {
        indexable.keywords = []
      }
      if (!indexable.privacy) {
        indexable.privacy = 'public'
      }
      if (!indexable.category) {
        indexable.category = {
          id: 'zero',
          name: 'artwork',
          level: 1
        }
      }
      indexable.saleData = {
        saleType: (indexable.saleData) ? indexable.saleData.saleType : 0,
        buyNowOrStartingPrice: (indexable.saleData) ? indexable.saleData.buyNowOrStartingPrice : 0,
        reservePrice: (indexable.saleData) ? indexable.saleData.reservePrice : 0,
        biddingEndTime: (indexable.saleData) ? indexable.saleData.biddingEndTime : 0,
        incrementPrice: (indexable.saleData) ? indexable.saleData.incrementPrice : 0
      }
      axios.post(baseUrl + '/index/addRecord', indexable).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  sizeOfIndex: function () {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/size').then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  clearDappsIndex: function () {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/dapps/clear').then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  clearNamesIndex: function () {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/names/clear').then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  fetchAllNamesIndex: function () {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/names/fetch').then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  searchNamesIndex: function (term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/names/query/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findAssets: function () {
    return new Promise(function (resolve, reject) {
      const url = SEARCH_API_PATH + '/findByObject/artwork'
      axios.get(url).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByOwner: function (owner) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findByOwner' + '?q=' + owner).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findBySaleType: function (saleType) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findBySaleType/' + saleType).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByObject: function (objectType) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findByObject/' + objectType).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByProjectId: function (projectId) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findByProjectId' + '?q=' + projectId).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByDomainAndObjectTypeAndTitleOrDescriptionOrCategoryOrKeyword: function (domain, objType, term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findByDomainAndObjectTypeAndTitleOrDescriptionOrCategoryOrKeyword/' + domain + '/' + objType + '/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findAssetByHash: function (assetHash) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/v1/asset/' + assetHash).then((asset) => {
        if (asset.nftIndex === 'null') asset.nftIndex = null
        if (asset.tokenId === 'null') asset.tokenId = null
        resolve(asset)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByTitleOrDescriptionOrCategoryOrKeyword: function (query) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/findByTitleOrDescriptionOrCategoryOrKeyword/title' + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  countByDomainAndObjectTypeAndCategories: function (domain, objType, term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/countByDomainAndObjectTypeAndCategories/' + domain + '/' + objType + '/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  indexUsers: function (names) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/users/' + names).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  indexUser: function (bsId) {
    return searchIndexService.indexUsers(bsId)
  },
  indexPages: function (from, to) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/pages/' + from + '/' + to).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  remove: function (field, value) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/art/index/remove/' + field + '/' + value).then((result) => {
        resolve(result)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  }
}
export default searchIndexService

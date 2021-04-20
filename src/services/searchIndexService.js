import axios from 'axios'

/**
 *  The service is a client to the brightblock sever side grpc client.
 **/
const searchIndexService = {
  /**
  removeRecord: function (field, value) {
    return new Promise(function (resolve, reject) {
      axios.get(SEARCH_API_PATH + '/removeRecord/' + field + '/' + value).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable unindex record: ' + error))
      })
    })
  },
  addRecords: function (application) {
    return new Promise(function (resolve, reject) {
      axios.post(SEARCH_API_PATH + '/v1/application', application).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  **/
  addTradeInfo: function (baseUrl, asset) {
    return new Promise(function (resolve, reject) {
      axios.post(baseUrl + '/index/v1/trade-info/' + asset.assetHash, asset.contractAsset.saleData).then((result) => {
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
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  sizeOfIndex: function (baseUrl) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/size').then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  clearDappsIndex: function (baseUrl) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/dapps/clear').then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  clearNamesIndex: function (baseUrl) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/names/clear').then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },

  fetchAllNamesIndex: function (baseUrl) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/names/fetch').then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  searchNamesIndex: function (baseUrl, term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/names/query/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findAssets: function (baseUrl) {
    return new Promise(function (resolve, reject) {
      const url = baseUrl + '/index/findByObject/artwork'
      axios.get(url).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByOwner: function (baseUrl, owner) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findByOwner' + '?q=' + owner).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findBySaleType: function (baseUrl, saleType) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findBySaleType/' + saleType).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByObject: function (baseUrl, objectType) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findByObject/' + objectType).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByProjectId: function (baseUrl, projectId) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findByProjectId' + '?q=' + projectId).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByDomainAndObjectTypeAndTitleOrDescriptionOrCategoryOrKeyword: function (baseUrl, domain, objType, term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findByDomainAndObjectTypeAndTitleOrDescriptionOrCategoryOrKeyword/' + domain + '/' + objType + '/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findAssetByHash: function (baseUrl, assetHash) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/v1/asset/' + assetHash).then((asset) => {
        resolve(asset)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  findByTitleOrDescriptionOrCategoryOrKeyword: function (baseUrl, query) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/findByTitleOrDescriptionOrCategoryOrKeyword/title' + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  countByDomainAndObjectTypeAndCategories: function (baseUrl, domain, objType, term, query) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/countByDomainAndObjectTypeAndCategories/' + domain + '/' + objType + '/' + term + '?q=' + query).then((result) => {
        resolve(result.data.details)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  indexUsers: function (baseUrl, names) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/users/' + names).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  indexUser: function (bsId) {
    return searchIndexService.indexUsers(bsId)
  },
  indexPages: function (baseUrl, from, to) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/pages/' + from + '/' + to).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  },
  remove: function (baseUrl, field, value) {
    return new Promise(function (resolve, reject) {
      axios.get(baseUrl + '/index/art/index/remove/' + field + '/' + value).then((result) => {
        resolve(result.data)
      }).catch((error) => {
        reject(new Error('Unable index record: ' + error))
      })
    })
  }
}
export default searchIndexService

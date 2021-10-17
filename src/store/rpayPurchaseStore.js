import { APP_CONSTANTS } from '@/app-constants'
import { DateTime } from 'luxon'
import utils from '@/services/utils'
import axios from 'axios'
import BigNum from 'bn.js'
import {
  bufferCV,
  listCV,
  uintCV,
  standardPrincipalCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  NonFungibleConditionCode,
  createAssetInfo,
  makeStandardNonFungiblePostCondition
} from '@stacks/transactions'

const getSaleRoyalties = function (data) {
  const addressList = []
  const shareList = []
  const secondariesList = []
  for (let i = 0; i < 10; i++) {
    const beneficiary = data.beneficiaries[i]
    if (beneficiary) {
      if (i === 0) {
        // address of the nft owner (i=0) is known at runtime.
        // so we just enter the contract address as a placeholder.
        // see payment-split method in contract.
        addressList.push(standardPrincipalCV(data.contractAddress))
      } else {
        addressList.push(standardPrincipalCV(beneficiary.chainAddress))
      }
      shareList.push(uintCV(utils.toOnChainAmount(beneficiary.royalty * 100))) // allows 2 d.p.
      secondariesList.push(uintCV(utils.toOnChainAmount(beneficiary.secondaryRoyalty * 100))) // allows 2 d.p.
    } else {
      addressList.push(standardPrincipalCV(data.contractAddress))
      shareList.push(uintCV(0))
      secondariesList.push(uintCV(0))
    }
  }
  return {
    addresses: listCV(addressList),
    shares: listCV(shareList),
    secondaries: listCV(secondariesList)
  }
}

const getMintRoyalties = function (data) {
  const addressList = []
  const shareList = []
  for (let i = 0; i < 4; i++) {
    const beneficiary = data.minteficaries[i]
    if (beneficiary) {
      addressList.push(standardPrincipalCV(beneficiary.chainAddress))
      shareList.push(uintCV(utils.toOnChainAmount(beneficiary.royalty * 100))) // allows 2 d.p.
    } else {
      addressList.push(standardPrincipalCV(data.contractAddress))
      shareList.push(uintCV(0))
    }
  }
  return {
    addresses: listCV(addressList),
    shares: listCV(shareList)
  }
}

const isOpeneningBid = function (contractAsset) {
  // simple case - no bids ever
  if (contractAsset.bidCounter === 0 || contractAsset.bidHistory.length === 0) {
    return true
  }
  // less simple case - start of a new sale cycle
  const index = contractAsset.bidHistory.findIndex((o) => o.saleCycle === contractAsset.saleData.saleCycleIndex)
  return index === -1
}

const intCurrentBid = function (contractAsset) {
  if (!contractAsset) return
  let currentBid = { amount: contractAsset.saleData.buyNowOrStartingPrice }
  if (!isOpeneningBid(contractAsset)) {
    currentBid = contractAsset.cycledBidHistory[contractAsset.cycledBidHistory.length - 1]
  }
  currentBid.reserveMet = currentBid.amount >= contractAsset.saleData.reservePrice
  currentBid.nextBidAmount = currentBid.amount + contractAsset.saleData.incrementPrice
  currentBid.nextBidAmountFmt = Number(currentBid.nextBidAmount).toLocaleString()
  return currentBid
}

const getProvider = function (data) {
  if (!data || !data.provider) return 'risidio'
  return data.provider
}

const rpayPurchaseStore = {
  namespaced: true,
  state: {
    dbOffers: [],
    provider: 'stacks',
    buttonText: ['NOT FOR SALE', 'BUY NOW', 'PLACE BID', 'MAKE AN OFFER'],
    badgeText: ['NOT FOR SALE', 'BUY NOW', 'AUCTION ENDS', 'FOR SALE']
  },
  getters: {
    getRecipientAddress: (state, getters, rootState, rootGetters) => (owner) => {
      const myProfile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
      const mac = rootGetters['rpayStacksStore/getMacsWallet']
      const sky = rootGetters['rpayStacksStore/getSkysWallet']
      let recipient = myProfile.stxAddress
      const configuration = rootGetters['rpayStore/getConfiguration']
      if (configuration.network === 'local') {
        recipient = (owner === mac.keyInfo.address) ? sky.keyInfo.address : mac.keyInfo.address
      }
      return recipient
    },
    getDbOffers: (state) => {
      return state.dbOffers
    },
    getCurrentBid: (state) => (contractAsset) => {
      return intCurrentBid(contractAsset)
    },
    isOpeningBid: (state) => (contractAsset) => {
      return isOpeneningBid(contractAsset)
    },
    getNextBid: (state, rootGetters) => (contractAsset) => {
      if (!contractAsset) return
      const currentBid = intCurrentBid(contractAsset)
      let nextBidAmount = currentBid.amount
      if (!isOpeneningBid(contractAsset)) {
        nextBidAmount += contractAsset.saleData.incrementPrice
      }
      return {
        amount: nextBidAmount,
        amountFmt: Number(nextBidAmount).toLocaleString(),
        reserveMet: nextBidAmount >= contractAsset.saleData.reservePrice
      }
    },
    getFormattedBiddingEndTime: (state, getters, rootState, rootGetters) => (contractAsset) => {
      let fbet = null
      if (contractAsset.saleData && contractAsset.saleData.biddingEndTime) {
        const dt = DateTime.fromMillis(contractAsset.saleData.biddingEndTime)
        dt.plus({ days: 1 })
        // const loaclEndM = moment(contractAsset.saleData.biddingEndTime)
        // const loaclEnd = loaclEndM.format('ddd, MMMM Do, h:mma') + ' BST'
      } else {
        const dt = DateTime.local()
        dt.plus({ days: 1 })
        // const dd = moment({}).add(2, 'days')
        dt.set({ hour: 10, minute: 0 })
        // fbet = dd.format('ddd, MMMM Do, h:mma') + ' BST'
        fbet = dt.format('LLL')
      }
      return fbet
    },
    getSalesInfoText: (state, rootGetters) => contractAsset => {
      const saleData = contractAsset.saleData
      if (!saleData || saleData.saleType === 0) {
        return 'NOT ON SALE'
      } else if (saleData.saleType === 1) {
        return 'Buy now for ' + (saleData.buyNowOrStartingPrice) + ' STX'
      } else if (saleData.saleType === 2) {
        const currentBid = intCurrentBid(contractAsset)
        return 'Place a bid - next bid is ' + (currentBid.nextBidAmount) + ' STX'
      } else if (saleData.saleType === 3) {
        return 'Offers over ' + (saleData.reservePrice) + ' STX will be considered'
      } else {
        return state.buttonText[0]
      }
    },
    getSalesButtonLabel: state => saleType => {
      const saleLabel = (saleType) ? state.buttonText[saleType] : state.buttonText[0]
      return saleLabel
    },
    getSalesBadgeLabel: state => contractAsset => {
      let saleLabel = (contractAsset.saleData.saleType) ? state.badgeText[contractAsset.saleData.saleType] : state.badgeText[0]
      if (contractAsset.saleData.saleCycleIndex > 1) {
        saleLabel = 'SOLD'
      }
      if (contractAsset.saleData.saleType === 0) {
        if (contractAsset.tokenInfo.maxEditions >= contractAsset.editionCounter) {
          return 'LIMITED EDITIONS'
        }
      }
      return saleLabel
    }
  },
  mutations: {
    setDbOffers: (state, dbOffers) => {
      state.dbOffers = dbOffers
    },
    addOffer: (state, dbOffer) => {
      const index = state.dbOffers.findIndex((o) => o.id === dbOffer.id)
      if (index < 0) {
        state.dbOffers.splice(0, 0, dbOffer)
      } else {
        state.dbOffers.splice(index, 1, dbOffer)
      }
    }
  },
  actions: {
    cancelOffer ({ commit, rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        data.status = -1
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register/offer', data).then(() => {
          commit('addOffer', data)
          resolve(data)
        }).catch((error) => {
          reject(new Error('Unable to register offer: ' + error))
        })
      })
    },
    registerOfferOffChain ({ commit, rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register/offer', data).then(() => {
          commit('addOffer', data)
          resolve(data)
        }).catch((error) => {
          reject(new Error('Unable to register offer: ' + error))
        })
      })
    },
    registerForUpdates ({ rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/register/email', data).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(new Error('Unable to register email: ' + error))
        })
      })
    },
    fetchOffers ({ commit, rootGetters }) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/fetch/offers', authHeaders).then((response) => {
          commit('setDbOffers', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch transactions: ' + error))
        })
      })
    },
    setTradeInfo ({ state, dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        // (asset-hash (buff 32)) (sale-type uint) (increment-stx uint) (reserve-stx uint) (amount-stx uint)
        // const buffer = bufferCV(Buffer.from(asset.assetHash, 'hex')) // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
        const nftIndex = uintCV(data.nftIndex)
        const saleType = uintCV(data.saleData.saleType)
        const incrementPrice = uintCV(utils.toOnChainAmount(data.saleData.incrementPrice))
        const reservePrice = uintCV(utils.toOnChainAmount(data.saleData.reservePrice))
        const buyNowOrStartingPrice = uintCV(utils.toOnChainAmount(data.saleData.buyNowOrStartingPrice))
        const biddingEndTime = uintCV(data.saleData.biddingEndTime)
        const functionArgs = [nftIndex, saleType, incrementPrice, reservePrice, buyNowOrStartingPrice, biddingEndTime]
        const callData = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'set-sale-data',
          functionArgs: functionArgs
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (configuration.network === 'local' && data.sendAsSky) {
          callData.sendAsSky = true
        }
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    mintToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        const amount = new BigNum(utils.toOnChainAmount(data.mintPrice))
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          postConds.push(makeStandardSTXPostCondition(
            postCondAddress,
            FungibleConditionCode.Equal,
            amount
          ))
        }
        data.postConditions = postConds
        const buffer = bufferCV(Buffer.from(data.assetHash, 'hex'))
        const metaDataUrl = bufferCV(Buffer.from(data.metaDataUrl, 'utf8'))
        // const metaDataUrl = stringUtf8CV(data.metaDataUrl)
        const editions = uintCV(data.editions)
        const editionCost = uintCV(data.editionCost)
        const addressList = []
        const shareList = []
        for (let i = 0; i < 10; i++) {
          const beneficiary = data.beneficiaries[i]
          if (beneficiary) {
            addressList.push(standardPrincipalCV(beneficiary.chainAddress))
            shareList.push(uintCV(utils.toOnChainAmount(beneficiary.royalty * 100))) // allows 2 d.p.
          } else {
            addressList.push(standardPrincipalCV(data.contractAddress))
            shareList.push(uintCV(0))
          }
        }
        const addresses = listCV(addressList)
        const shares = listCV(shareList)
        data.functionArgs = [buffer, metaDataUrl, editions, editionCost, addresses, shares]
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    mintTokenV2 ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          postConds.push(makeStandardSTXPostCondition(
            postCondAddress,
            FungibleConditionCode.Equal,
            new BigNum(utils.toOnChainAmount(data.mintPrice))
          ))
        }
        data.postConditions = postConds
        const buffer = bufferCV(Buffer.from(data.assetHash, 'hex'))
        const metaDataUrl = bufferCV(Buffer.from(data.metaDataUrl, 'utf8'))
        // const metaDataUrl = stringUtf8CV(data.metaDataUrl)
        const editions = uintCV(data.editions)
        const editionCost = uintCV(utils.toOnChainAmount(data.editionCost))
        const buyNowPrice = uintCV(utils.toOnChainAmount(data.buyNowPrice))
        const mintPrice = uintCV(utils.toOnChainAmount(data.mintPrice))
        const saleRoyalties = getSaleRoyalties(data)
        data.functionArgs = [buffer, metaDataUrl, editions, editionCost, mintPrice, buyNowPrice, saleRoyalties.addresses, saleRoyalties.shares, saleRoyalties.secondaries]
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    mintTokenV3 ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        // const message = '462a32065d0e822be005867b6b56e7999bbd3d08aec80972c89c4556e4fb1168'
        const configuration = rootGetters['rpayStore/getConfiguration']
        // utils.signWithPrivKey(keys.privateKey, Buffer.from(data.assetHash, 'hex')).then((sig) => {
        // console.log(sig)
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          postConds.push(makeStandardSTXPostCondition(
            postCondAddress,
            FungibleConditionCode.Equal,
            new BigNum(utils.toOnChainAmount(data.mintPrice))
          ))
        }
        data.postConditions = postConds
        const pubkeyBuffer = bufferCV(Buffer.from(data.message, 'hex'))
        const sigBuffer = bufferCV(Buffer.from(data.sig, 'hex'))
        const buffer = bufferCV(Buffer.from(data.assetHash, 'hex'))
        const metaDataUrl = bufferCV(Buffer.from(data.metaDataUrl, 'utf8'))
        // const metaDataUrl = stringUtf8CV(data.metaDataUrl)
        const editions = uintCV(data.editions)
        const editionCost = uintCV(utils.toOnChainAmount(data.editionCost))
        const buyNowPrice = uintCV(utils.toOnChainAmount(data.buyNowPrice))
        const mintPrice = uintCV(utils.toOnChainAmount(data.mintPrice))
        const saleRoyalties = getSaleRoyalties(data)
        const mintRoyalties = getMintRoyalties(data)
        data.functionArgs = [sigBuffer, pubkeyBuffer, buffer, metaDataUrl, editions, editionCost, mintPrice, buyNowPrice, mintRoyalties.addresses, mintRoyalties.shares, saleRoyalties.addresses, saleRoyalties.shares, saleRoyalties.secondaries]
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
        // })
      })
    },
    mintTwentyTokens ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          postConds.push(makeStandardSTXPostCondition(
            postCondAddress,
            FungibleConditionCode.Equal,
            new BigNum(utils.toOnChainAmount(data.mintPrice * data.twenties.length))
          ))
        }
        data.postConditions = postConds
        const editions = uintCV(data.editions)
        const editionCost = uintCV(utils.toOnChainAmount(data.editionCost))
        const buyNowPrice = uintCV(utils.toOnChainAmount(data.buyNowPrice))
        const mintPrice = uintCV(utils.toOnChainAmount(data.mintPrice))
        const saleRoyalties = getSaleRoyalties(data)
        const mintRoyalties = getMintRoyalties(data)

        const hashes = []
        const metaUrls = []
        for (let i = 0; i < 20; i++) {
          const twenty = data.twenties[i]
          if (twenty) {
            hashes.push(bufferCV(Buffer.from(twenty.assetHash, 'hex')))
            metaUrls.push(bufferCV(Buffer.from(twenty.metaDataUrl, 'utf8')))
          } else {
            hashes.push(bufferCV(Buffer.from(data.twenties[0].assetHash, 'hex')))
            metaUrls.push(bufferCV(Buffer.from('#', 'utf8')))
          }
        }
        const hashList = listCV(hashes)
        const metaUrlList = listCV(metaUrls)
        data.functionArgs = [hashList, metaUrlList, editions, editionCost, mintPrice, buyNowPrice, mintRoyalties.addresses, mintRoyalties.shares, saleRoyalties.addresses, saleRoyalties.shares, saleRoyalties.secondaries]
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    mintEdition ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        const amount = new BigNum(utils.toOnChainAmount(data.editionCost))
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          postCondAddress,
          FungibleConditionCode.LessEqual,
          amount
        )
        data.postConditions = [standardSTXPostCondition]
        data.functionArgs = [uintCV(data.nftIndex)]
        data.functionName = 'mint-edition'
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.nftIndex = data.nftIndex
          result.assetHash = data.assetHash
          resolve(result)
        }).catch((err) => {
          const result = {
            opcode: 'stx-transaction-error',
            assetHash: data.assetHash,
            error: err
          }
          window.eventBus.$emit('rpayEvent', result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    makeOffer ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        data.functionName = 'make-offer'
        data.functionArgs = [uintCV(data.nftIndex), uintCV(utils.toOnChainAmount(data.offerAmount)), uintCV(data.biddingEndTime)]
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, data, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    setEditionCost ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        data.functionName = 'set-edition-cost'
        data.functionArgs = [uintCV(data.seriesOriginal), uintCV(data.maxEditions), uintCV(utils.toOnChainAmount(data.editionCost))]
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, data, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    transferAsset ({ state, dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const nonFungibleAssetInfo = createAssetInfo(
          data.contractAddress,
          data.contractName,
          data.contractName.split('-')[0]
        )
        // Post-condition check failure on non-fungible asset ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW.thisisnumberone-v1::my-nft owned by STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG: UInt(3) Sent
        const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
          data.owner, // postConditionAddress
          NonFungibleConditionCode.DoesNotOwn,
          nonFungibleAssetInfo, // contract and nft info
          uintCV(data.nftIndex)
        )
        // const profile = rootGetters['rpayAuthStore/getMyProfile']
        // const owner = profile.stxAddress
        data.functionName = 'transfer'
        data.postConditions = [standardNonFungiblePostCondition]
        data.functionArgs = [uintCV(data.nftIndex), standardPrincipalCV(data.owner), standardPrincipalCV(data.recipient)]
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        if (getProvider(data) === 'risidio') {
          data.sendAsSky = (data.owner === 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG')
        }
        dispatch(methos, data, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    acceptOffer ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        data.functionName = 'accept-offer'
        data.functionArgs = [uintCV(data.nftIndex), uintCV(data.offerIndex), standardPrincipalCV(data.owner), standardPrincipalCV(data.recipient)]
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, data, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    buyNow ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex), standardPrincipalCV(data.owner), standardPrincipalCV(data.recipient)]
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        const amount = new BigNum(utils.toOnChainAmount(data.buyNowOrStartingPrice))
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          postConds.push(makeStandardSTXPostCondition(
            postCondAddress,
            FungibleConditionCode.LessEqual, // less or equal - if the buyer is one of the royalties payment is skipped.
            amount
          ))
          const nonFungibleAssetInfo = createAssetInfo(
            data.contractAddress,
            data.contractName,
            data.contractName.split('-')[0]
          )
          postConds.push(makeStandardNonFungiblePostCondition(
            data.owner,
            NonFungibleConditionCode.DoesNotOwn,
            nonFungibleAssetInfo,
            uintCV(data.nftIndex)
          ))
        }
        const callData = {
          postConditions: postConds,
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'buy-now',
          functionArgs: functionArgs,
          sendAsSky: data.sendAsSky
        }
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    placeBid ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const functionArgs = [uintCV(data.nftIndex), uintCV(data.bidAmount), uintCV(data.appTimestamp)]
        const callData = {
          postConditions: data.postConditions,
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: functionArgs,
          sendAsSky: data.sendAsSky
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    closeBidding ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const functionArgs = [uintCV(data.nftIndex), uintCV(data.closeType)]
        const callData = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: data.functionName,
          functionArgs: functionArgs
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    }
  }
}
export default rpayPurchaseStore

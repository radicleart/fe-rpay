import { APP_CONSTANTS } from '@/app-constants'
import moment from 'moment'
import utils from '@/services/utils'
import BigNum from 'bn.js'
import axios from 'axios'
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

const intCurrentBid = function (contractAsset) {
  if (!contractAsset) return
  let currentBid = { amount: contractAsset.saleData.buyNowOrStartingPrice }
  if (contractAsset.bidCounter > 0 && contractAsset.bidHistory.length > 0) {
    currentBid = contractAsset.bidHistory[contractAsset.bidHistory.length - 1]
  }
  currentBid.reserveMet = currentBid.amount >= contractAsset.saleData.reservePrice
  currentBid.nextBidAmount = currentBid.amount + contractAsset.saleData.incrementPrice
  return currentBid
}

const getProvider = function (data) {
  if (!data || !data.provider) return 'risidio'
  return data.provider
}

const rpayPurchaseStore = {
  namespaced: true,
  state: {
    provider: 'stacks',
    buttonText: ['NOT FOR SALE', 'BUY NOW', 'PLACE BID', 'MAKE AN OFFER'],
    badgeText: ['NOT ON SALE', 'BUY NOW', 'AUCTION ENDS', 'ON AUCTION']
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
    getCurrentBid: (state) => (contractAsset) => {
      return intCurrentBid(contractAsset)
    },
    getNextBid: (state, rootGetters) => (contractAsset) => {
      if (!contractAsset) return
      const currentBid = intCurrentBid(contractAsset)
      const nextBidAmount = currentBid.amount + contractAsset.saleData.incrementPrice
      return {
        amount: nextBidAmount,
        reserveMet: nextBidAmount >= contractAsset.saleData.reservePrice
      }
    },
    getFormattedBiddingEndTime: (state, getters, rootState, rootGetters) => (contractAsset) => {
      let fbet = null
      if (contractAsset.saleData && contractAsset.saleData.biddingEndTime) {
        let loaclEndM = moment(contractAsset.saleData.biddingEndTime)
        if (loaclEndM.isBefore(moment({}))) {
          loaclEndM = moment({}).add(2, 'days')
        }
        const loaclEnd = loaclEndM.format('DD-MM-YY hh:mm')
        fbet = loaclEnd
      } else {
        const dd = moment({}).add(2, 'days')
        dd.hour(10)
        dd.minute(0)
        fbet = dd.format()
      }
      return fbet
    },
    getSalesInfoText: (state, rootGetters) => contractAsset => {
      const saleData = contractAsset.saleData
      if (!saleData || saleData.saleType === 0) {
        return 'NOT FOR SALE'
      } else if (saleData.saleType === 1) {
        return 'Buy now for ' + (saleData.buyNowOrStartingPrice)
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
    getSalesBadgeLabel: state => saleType => {
      const saleLabel = (saleType) ? state.badgeText[saleType] : state.badgeText[0]
      return saleLabel
    }
  },
  mutations: {
  },
  actions: {
    fetchOffers ({ commit, rootGetters }) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/secure/fetch/offers', { headers: authHeaders }).then((response) => {
          commit('setOffers', response.data)
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
        if (getProvider(data) === 'risidio') {
          callData.sendAsSky = (data.owner === 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG')
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
    mintToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        if (!data.owner) {
          data.owner = 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW'
          if (data.sendAsSky) {
            data.owner = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
          }
        }
        const amount = new BigNum(utils.toOnChainAmount(data.mintingFee))
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          data.owner,
          FungibleConditionCode.LessEqual,
          new BigNum(amount)
        )
        data.postConditions = [standardSTXPostCondition]
        const buffer = Buffer.from(data.assetHash, 'hex')
        const metaDataUrl = bufferCV(Buffer.from(data.metaDataUrl, 'utf8'))
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
        data.functionArgs = [bufferCV(buffer), metaDataUrl, editions, editionCost, addresses, shares]
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          window.eventBus.$emit('rpayEvent', result)
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    mintEdition ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        // this is the owner of the asset - needed to set the post condition
        if (!data.owner) {
          data.owner = 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW'
          if (data.sendAsSky) {
            data.owner = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
          }
        }
        const amount = new BigNum(utils.toOnChainAmount(data.editionCost))
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          data.owner,
          FungibleConditionCode.LessEqual,
          new BigNum(amount)
        )
        data.postConditions = [standardSTXPostCondition]
        data.functionArgs = [uintCV(data.nftIndex)]
        data.functionName = 'mint-edition'
        const configuration = rootGetters['rpayStore/getConfiguration']
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), data, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          result.assetHash = data.assetHash
          window.eventBus.$emit('rpayEvent', result)
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
          'my-nft'
        )
        // Post-condition check failure on non-fungible asset ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW.thisisnumberone-v1::my-nft owned by STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG: UInt(3) Sent
        const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
          data.owner, // postConditionAddress
          NonFungibleConditionCode.DoesNotOwn,
          nonFungibleAssetInfo, // contract and nft info
          uintCV(data.nftIndex) // nft value as clarity type
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
        const amount = new BigNum(utils.toOnChainAmount(data.buyNowOrStartingPrice))
        const functionArgs = [uintCV(data.nftIndex), standardPrincipalCV(data.owner), standardPrincipalCV(data.recipient)]
        const standardSTXPostCondition = makeStandardSTXPostCondition(
          data.owner,
          FungibleConditionCode.LessEqual,
          amount
        )
        const callData = {
          postConditions: [standardSTXPostCondition],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'buy-now',
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

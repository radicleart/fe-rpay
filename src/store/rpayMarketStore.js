import utils from '@/services/utils'
import BigNum from 'bn.js'
import {
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  NonFungibleConditionCode,
  createAssetInfo,
  serializeCV,
  makeStandardNonFungiblePostCondition
} from '@stacks/transactions'

const rpayMarketStore = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
    lookupMintPassBalance: function ({ dispatch }, data) {
      return new Promise(function (resolve) {
        const functionArgs = [`0x${serializeCV(standardPrincipalCV(data.stxAddress)).toString('hex')}`]
        // const functionArgs = (data.functionArgs) ? data.functionArgs : [standardPrincipalCV(data.stxAddress)]
        const callData = {
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-mint-pass-balance',
          functionArgs: functionArgs
        }
        dispatch('rpayStacksStore/callContractReadOnly', callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    getListingInUstx ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        const functionArgs = [`0x${serializeCV(uintCV(data.nftIndex)).toString('hex')}`]
        // const functionArgs = [uintCV(data.nftIndex)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-listing-in-ustx',
          functionArgs: functionArgs
        }
        dispatch('rpayStacksStore/callContractReadOnly', callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    listInUstx ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex), uintCV(utils.toOnChainAmount(data.price)), contractPrincipalCV(data.commissionContractAddress, data.commissionContractName)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'list-in-ustx',
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
    unlistInUstx ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'unlist-in-ustx',
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
    buyInUstx ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex), contractPrincipalCV(data.commissionContractAddress, data.commissionContractName)]
        const profile = rootGetters['rpayAuthStore/getMyProfile']
        let postCondAddress = profile.stxAddress
        if (configuration.network === 'local' && data.sendAsSky) {
          postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
        }
        let postConds = []
        const amount = new BigNum(utils.toOnChainAmount(data.price))
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
            data.assetName
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
          functionName: 'buy-in-ustx',
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
    }
  }
}
export default rpayMarketStore

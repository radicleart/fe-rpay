import utils from '@/services/utils'
import BigNum from 'bn.js'
import {
  uintCV,
  listCV,
  hexToCV,
  cvToHex,
  cvToJSON,
  contractPrincipalCV,
  standardPrincipalCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  NonFungibleConditionCode,
  createAssetInfo,
  serializeCV,
  makeStandardNonFungiblePostCondition
} from '@stacks/transactions'
import axios from 'axios'

const getCPSMintPostConds = function (rootGetters, data) {
  const configuration = rootGetters['rpayStore/getConfiguration']
  const profile = rootGetters['rpayAuthStore/getMyProfile']
  let postCondAddress = profile.stxAddress
  if (configuration.network === 'local' && data.sendAsSky) {
    postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
  }
  let postConds = []
  let amount = new BigNum(utils.toOnChainAmount(data.mintPrice + 0.001))
  if (data.batchOption > 1) {
    amount = new BigNum(utils.toOnChainAmount((data.mintPrice * data.batchOption + 0.001)))
  }
  if (data.postConditions) {
    postConds = data.postConditions
  } else {
    postConds.push(makeStandardSTXPostCondition(
      postCondAddress,
      FungibleConditionCode.Less,
      amount
    ))
  }
  return postConds
}

const rpayMarketGenFungStore = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
    mintWithToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const tender = contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)
        const entries = []
        for (let i = 0; i < data.batchOption; i++) {
          entries.push(uintCV(i))
        }
        const callData = {
          postConditions: getCPSMintPostConds(rootGetters, data, false),
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          sendAsSky: data.sendAsSky,
          functionName: (data.batchOption === 1) ? 'mint-with' : 'mint-with-many',
          functionArgs: (data.batchOption === 1) ? [tender] : [listCV(entries), tender]
        }
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch((data.methos || methos), callData, { root: true }).then((result) => {
          result.opcode = 'stx-transaction-sent'
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    getCommissionTokensByContract: function ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/mgmnt-v2/mint-commissions-by-contract/' + data.contractId).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    getMintCommission: function ({ rootGetters }, data) {
      return new Promise(function (resolve, reject) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const callData = {
          path: '/v2/map_entry/' + data.contractAddress + '/' + data.contractName + '/mint-commission',
          httpMethod: 'post',
          mapKey: cvToHex(contractPrincipalCV(data.tokenContractAddress, data.tokenContractName))
        }
        const url = configuration.risidioBaseApi + '/mesh/v2/map-data'
        axios.post(url, callData).then(response => {
          try {
            const cvVer = hexToCV(response.data.data)
            resolve(cvToJSON(cvVer))
          } catch (err) {
            reject(err)
          }
        }).catch((err) => {
          reject(err)
        })
      })
    },
    setMintCommission: function ({ dispatch, rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          sendAsSky: data.sendAsSky,
          functionName: 'set-mint-commission',
          functionArgs: [contractPrincipalCV(data.tokenContractAddress, data.tokenContractName), uintCV(utils.toOnChainAmount(data.price)), standardPrincipalCV(data.address), standardPrincipalCV(data.commissionAddress), uintCV(data.commissionRate)]
        }
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((response) => {
          dispatch('saveMintCommissionMongo', data).then((result) => {
            resolve(response.data)
          })
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    saveMintCommissionMongo: function ({ dispatch, rootGetters }, data) {
      return new Promise(function (resolve) {
        const commission = {
          timestamp: new Date().getTime(),
          contractId: data.contractAddress + '.' + data.contractName,
          tokenContractId: data.tokenContractAddress + '.' + data.tokenContractName,
          price: data.price,
          address: data.address,
          commissionAddress: data.commissionAddress,
          commissionRate: data.commissionRate
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/mgmnt-v2/mint-commissions', commission).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    removeMintCommission: function ({ dispatch, rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          sendAsSky: data.sendAsSky,
          functionName: 'remove-mint-commission',
          functionArgs: [contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)]
        }
        const methos = (configuration.network === 'local') ? 'rpayStacksStore/callContractRisidio' : 'rpayStacksStore/callContractBlockstack'
        dispatch(methos, callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((e) => {
          resolve(null)
        })
      })
    },
    getListingInToken ({ dispatch }, data) {
      return new Promise((resolve, reject) => {
        const functionArgs = [`0x${serializeCV(uintCV(data.nftIndex)).toString('hex')}`]
        // const functionArgs = [uintCV(data.nftIndex)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'get-listing-in-token',
          functionArgs: functionArgs
        }
        dispatch('rpayStacksStore/callContractReadOnly', callData, { root: true }).then((result) => {
          resolve(result)
        }).catch((error) => {
          reject(error)
        })
      })
    },
    listInToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex), uintCV(utils.toOnChainAmount(data.price)), contractPrincipalCV(data.commissionContractAddress, data.commissionContractName), contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'list-in-token',
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
    unlistInToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex)]
        const callData = {
          postConditions: [],
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          functionName: 'unlist-in-token',
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
    buyInToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const functionArgs = [uintCV(data.nftIndex), contractPrincipalCV(data.commissionContractAddress, data.commissionContractName), contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)]
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
          functionName: 'buy-in-token',
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
    sipTenTokenDelete: function ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.delete(configuration.risidioBaseApi + '/mesh/mgmnt-v2/sip-ten-token', data.sipTenToken).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    sipTenTokenUpdate: function ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/mgmnt-v2/sip-ten-token', data.sipTenToken).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    },
    sipTenTokenFindBy: function ({ rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let field = 'sip-ten-tokens'
        if (data.field === 'name') {
          field = 'sip-ten-token-by-name'
        } else if (data.field === 'symbol') {
          field = 'sip-ten-token-by-symbol'
        } else if (data.field === 'contractId') {
          field = 'sip-ten-token-by-contract'
        }
        axios.get(configuration.risidioBaseApi + '/mesh/v2/' + field + '/' + data.value).then((response) => {
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    }
  }
}
export default rpayMarketGenFungStore

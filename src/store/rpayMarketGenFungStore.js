import utils from '@/services/utils'
import BigNum from 'bn.js'
import {
  uintCV,
  hexToCV,
  cvToHex,
  cvToJSON,
  tupleCV,
  listCV,
  PostConditionMode,
  contractPrincipalCV,
  standardPrincipalCV,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  NonFungibleConditionCode,
  createAssetInfo,
  serializeCV,
  makeStandardNonFungiblePostCondition,
  makeStandardFungiblePostCondition
} from '@stacks/transactions'
import axios from 'axios'

const getSTXMintPostConds = function (rootGetters, data) {
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

const getAdminMintManyArgs = function (data) {
  const entryList = []
  for (let i = 0; i < data.entries.length; i++) {
    const entry = data.entries[i]
    const tupCV = tupleCV({
      recipient: standardPrincipalCV(entry.recipient),
      nftIndex: uintCV(entry.nftIndex)
    })
    entryList.push(tupCV)
  }
  return [listCV(entryList)]
}

const getGFTMintPostConds = function (rootGetters, data) {
  const configuration = rootGetters['rpayStore/getConfiguration']
  const profile = rootGetters['rpayAuthStore/getMyProfile']

  let postConditionAddress = profile.stxAddress
  if (configuration.network === 'local' && data.sendAsSky) {
    postConditionAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
  }
  const postConditionCode = FungibleConditionCode.LessEqual
  const postConditionAmount = new BigNum(utils.toOnChainAmount((data.mintPrice * data.batchOption + 0.001), data.sipTenToken.decimals))
  const fungibleAssetInfo = createAssetInfo(data.sipTenToken.contractId.split('.')[0], data.sipTenToken.contractId.split('.')[1], data.sipTenToken.contractId.split('.')[1])

  const standardFungiblePostCondition = makeStandardFungiblePostCondition(
    postConditionAddress,
    postConditionCode,
    postConditionAmount,
    fungibleAssetInfo
  )

  let postConds = []
  if (data.postConditions) {
    postConds = data.postConditions
  } else {
    postConds.push(standardFungiblePostCondition)
  }
  return postConds
}

const rpayMarketGenFungStore = {
  namespaced: true,
  state: {
    sipTenTokens: null
  },
  getters: {
    getSipTenTokens: state => {
      return state.sipTenTokens
    },
    getSipTenTokensBySymbol: state => symbol => {
      return state.sipTenTokens.filter((o) => o.symbol === symbol)
    },
    getSipTenTokensByContractId: state => contractId => {
      return state.sipTenTokens.filter((o) => o.contractId === contractId)
    }
  },
  mutations: {
    setSipTenTokens (state, sipTenTokens) {
      state.sipTenTokens = sipTenTokens
    }
  },
  actions: {
    mintWithToken ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const tender = contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)
        const localPCs = (data.tokenContractName === 'stx-token' || data.tokenContractName === 'unwrapped-stx-token') ? getSTXMintPostConds(rootGetters, data, false) : getGFTMintPostConds(rootGetters, data, false)
        const callData = {
          postConditionMode: (data.postConditionMode) ? data.postConditionMode : PostConditionMode.Deny,
          postConditions: (data.postConditions) ? data.postConditions : localPCs,
          contractAddress: data.contractAddress,
          contractName: data.contractName,
          sendAsSky: data.sendAsSky,
          functionName: data.functionName,
          functionArgs: (data.batchOption === 1) ? [tender] : [uintCV(data.batchOption), tender]
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
    adminMintNFT ({ dispatch, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        if (!data.batchOption) data.batchOption = 1
        const configuration = rootGetters['rpayStore/getConfiguration']
        console.log('admin mint nft: data=', data)
        // if (!checkOpenNodeApiKey(data)) throw new Error('Not called via open node!')
        // const tender = contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)
        const localPCs = [] // (data.tokenContractName === 'unwrapped-stx-token') ? getSTXMintPostConds(data) : getGFTMintPostConds(data)
        const callData = {
          postConditionMode: (data.postConditionMode) ? data.postConditionMode : PostConditionMode.Deny,
          postConditions: (data.postConditions) ? data.postConditions : localPCs,
          contractAddress: data.contractId.split('.')[0],
          contractName: data.contractId.split('.')[1],
          functionName: data.functionName
        }
        if (data.functionName === 'admin-mint') {
          callData.functionArgs = [standardPrincipalCV(data.recipient), uintCV(data.nftIndex)]
        } else {
          callData.functionArgs = getAdminMintManyArgs(data)
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
        axios.get(configuration.risidioBaseApi + '/mesh/v2/mint-commissions-by-contract/' + data.contractId).then((response) => {
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
          dispatch('saveMintCommissionMongo', data).then(() => {
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
        const functionArgs = [uintCV(data.nftIndex), uintCV(utils.toOnChainAmount(data.price, data.decimals)), contractPrincipalCV(data.commissionContractAddress, data.commissionContractName), contractPrincipalCV(data.tokenContractAddress, data.tokenContractName)]
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
        let postConds = []
        if (data.postConditions) {
          postConds = data.postConditions
        } else {
          const profile = rootGetters['rpayAuthStore/getMyProfile']
          let postCondAddress = profile.stxAddress
          if (configuration.network === 'local' && data.sendAsSky) {
            postCondAddress = 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
          }
          const postConditionAmount = new BigNum(utils.toOnChainAmount(data.price, data.decimals))
          if (data.tokenContractName === 'stx-token' || data.tokenContractName === 'unwrapped-stx-token') {
            postConds.push(makeStandardSTXPostCondition(postCondAddress, FungibleConditionCode.LessEqual, postConditionAmount))
          } else {
            const fungibleAssetInfo = createAssetInfo(data.tokenContractAddress, data.tokenContractName, data.tokenAssetName)
            const standardFungiblePostCondition = makeStandardFungiblePostCondition(postCondAddress, FungibleConditionCode.LessEqual, postConditionAmount, fungibleAssetInfo)
            postConds.push(standardFungiblePostCondition)
          }
          const nonFungibleAssetInfo = createAssetInfo(data.contractAddress, data.contractName, data.assetName)
          postConds.push(makeStandardNonFungiblePostCondition(data.owner, NonFungibleConditionCode.DoesNotOwn, nonFungibleAssetInfo, uintCV(data.nftIndex)))
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
    sipTenTokenDelete: function ({ rootGetters }, sipTenToken) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.delete(configuration.risidioBaseApi + '/mesh/mgmnt-v2/sip-ten-token', sipTenToken).then((response) => {
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
    sipTenTokenFindBy: function ({ commit, rootGetters }, data) {
      return new Promise(function (resolve) {
        const configuration = rootGetters['rpayStore/getConfiguration']
        let path = '/mesh/v2/sip-ten-tokens'
        if (data) {
          if (data.field === 'name') {
            path = '/mesh/v2/sip-ten-token-by-name/' + data.value
          } else if (data.field === 'symbol') {
            path = '/mesh/v2/sip-ten-token-by-symbol/' + data.value
          } else if (data.field === 'contractId') {
            path = '/mesh/v2/sip-ten-token-by-contract/' + data.value
          }
        }
        axios.get(configuration.risidioBaseApi + path).then((response) => {
          commit('setSipTenTokens', response.data)
          resolve(response.data)
        }).catch(() => {
          resolve()
        })
      })
    }
  }
}
export default rpayMarketGenFungStore

import Web3 from 'web3'
import abiContract from './LoopbombX.json'
import { APP_CONSTANTS } from '@/app-constants'

let NFT_CONTRACT_ADDRESS = null
let NETWORK = 'testnet'

const getABI = function () {
  // const NFT_ABI = JSON.parse(abiContract) // .toString()
  return abiContract
}
/**
const NFT_ABI1 = [{
  constant: false,
  inputs: [
    {
      name: '_to',
      type: 'address'
    }
  ],
  name: 'mintTo',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}, {
  constant: true,
  inputs: [],
  name: 'baseTokenURI',
  outputs: [
    {
      internalType: 'string',
      name: '',
      type: 'string'
    }
  ],
  payable: false,
  stateMutability: 'view',
  type: 'function'
}]
**/
const getWeb3 = function () {
  return new Promise((resolve, reject) => {
    const ethereum = window.ethereum
    let web3 = window.web3
    if (typeof ethereum !== 'undefined') {
      ethereum.enable().then((res) => {
        web3 = new Web3(ethereum)
        web3.eth.transactionBlockTimeout = 7000
        web3.transactionConfirmationBlocks = 6000
        web3.eth.transactionPollingTimeout = 35000
        resolve(web3)
      })
    } else if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider, null, { transactionBlockTimeout: 150, transactionPollingTimeout: 1500 })
      resolve(web3)
    } else {
      web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER, { timeout: 10e3 }))
      resolve(web3)
    }
  })
}
const resolveError = function (reject, error, commit) {
  let errorMessage = 'Unable to contact your <b>Meta Mask wallet</b> <br/> are you logged in and connected to the ' + NETWORK + ' network?'
  if (error && error.message && error.message.toLowerCase().indexOf('user denied') > -1) {
    errorMessage = 'Minting process cancelled...'
  }
  commit(APP_CONSTANTS.SET_MINTING_MESSAGE, { opcode: 'eth-mint-error', message: errorMessage }, { root: true })
  const result = {
    opcode: 'eth-mint-error',
    message: errorMessage
  }
  window.eventBus.$emit('rpayEvent', result)
  reject(new Error(errorMessage))
}

const sendPayment = function (web3, data, account, resolve, reject, commit) {
  const amountToSend = web3.utils.toWei(String(data.amount), 'ether') // convert to wei value
  web3.eth.sendTransaction({ from: account, to: data.ethPaymentAddress, value: amountToSend }).then((res) => {
    const result = {
      txId: res.transactionHash
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e, commit)
  })
}

const mintToken = function (web3, data, account, resolve, reject, commit) {
  const abi = getABI()
  const message = 'Minting on Ethereum can take some time - please keep this tab open until we hear back from the network.'
  commit(APP_CONSTANTS.SET_MINTING_MESSAGE, { opcode: 'eth-mint-begun', message: message }, { root: true })
  const nftContract = new web3.eth.Contract(abi, data.ethContractAddress, { from: account, gasLimit: '250000' })
  nftContract.methods.getMintPrice().call({ from: account }).then((mintPrice) => {
    nftContract.methods.create().send({ from: account, value: mintPrice }).then((res) => {
      const result = {
        assetHash: data.assetHash,
        txId: res.transactionHash
      }
      if (res.events && res.events.length > 0) {
        for (const key in res.events) {
          if (key === 'LoopbombCreated') {
            const event = res.events[key]
            result.tokenId = parseInt(event.returnValues.id, 10)
          }
        }
      }
      const message = 'Your music (#' + result.tokenId + ')<br/>has been minted and is registered to your Ethereum address'
      result.message = message
      commit(APP_CONSTANTS.SET_MINTING_MESSAGE, result, { root: true })
      commit(APP_CONSTANTS.SET_DISPLAY_CARD, 106, { root: true })
      result.opcode = 'eth-mint-success'
      window.eventBus.$emit('rpayEvent', result)
      resolve(result)
    }).catch((e) => {
      resolveError(reject, e, commit)
    })
  }).catch((e) => {
    resolveError(reject, e, commit)
  })
}

const setBaseTokenURI = function (web3, data, account, resolve, reject, commit) {
  const abi = getABI()
  const nftContract = new web3.eth.Contract(abi, NFT_CONTRACT_ADDRESS, { from: account, gasLimit: '100000' })
  nftContract.methods.setBaseTokenURI(data.baseTokenURI).send({ from: account }).then((res) => {
    const result = {
      assetHash: data.assetHash,
      txId: res.transactionHash
    }
    if (res.events && res.events.length > 0) {
      for (const key in res.events) {
        const event = res.events[key]
        if (event) {
          result.tokenId = parseInt(event.raw.topics[3], 16)
          result.logIndex = event.logIndex
        }
      }
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e, commit)
  })
}

const getContractData = function (web3, data, account, resolve, reject) {
  const abi = getABI()
  const nftContract = new web3.eth.Contract(abi, NFT_CONTRACT_ADDRESS, { gasPrice: 20000000000, from: account, gasLimit: '100000' })
  nftContract.methods.baseTokenURI().call({ from: account }).then((baseTokenURI) => {
    const result = {
      baseTokenURI: baseTokenURI
    }
    nftContract.methods.getMintPrice().call({ from: account }).then((mintPrice) => {
      result.mintPrice = web3.utils.fromWei(String(mintPrice))
      resolve(result)
    }).catch((e) => {
      reject(new Error(e))
    })
  }).catch((e) => {
    reject(new Error(e))
  })
}

const totalSupply = function (web3, account, resolve, reject) {
  const abi = getABI()
  const nftContract = new web3.eth.Contract(abi, NFT_CONTRACT_ADDRESS, { gasPrice: 20000000000, from: account, gasLimit: '100000' })
  nftContract.methods.totalSupply().call({ from: account }).then((totalSupply) => {
    const result = {
      totalSupply: totalSupply
    }
    resolve(result)
  }).catch((e) => {
    reject(new Error(e))
  })
}

const setMintPrice = function (web3, data, account, resolve, reject) {
  const amountToSend = web3.utils.toWei(String(data.mintPrice), 'ether') // convert to wei value
  const abi = getABI()
  const nftContract = new web3.eth.Contract(abi, NFT_CONTRACT_ADDRESS, { from: account, gasLimit: '100000' })
  nftContract.methods.setMintPrice(amountToSend).send({ from: account }).then((res) => {
    const result = {
      assetHash: data.assetHash,
      txId: res.transactionHash
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e)
  })
}

const makeWithdrawal = function (web3, data, account, resolve, reject) {
  const abi = getABI()
  const nftContract = new web3.eth.Contract(abi, NFT_CONTRACT_ADDRESS, { from: account, gasLimit: '100000' })
  nftContract.methods.withdraw().send({ from: account }).then((res) => {
    const result = {
      assetHash: data.assetHash,
      txId: res.transactionHash
    }
    resolve(result)
  }).catch((e) => {
    resolveError(reject, e)
  })
}

const rpayEthereumStore = {
  namespaced: true,
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
    transact ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        NFT_CONTRACT_ADDRESS = data.ethContractAddress
        const configuration = rootGetters['rpayStore/getConfiguration']
        NETWORK = configuration.network
        getWeb3().then((web3) => {
          if (!web3) {
            reject(new Error('no ethereum provider registered - please download Meta Mask to continue!'))
          }
          web3.eth.getAccounts(function (error, accounts) {
            if (error) {
              reject(new Error('Please check you are logged in to meta mask - then try again?'))
            } else if (!accounts || accounts.length === 0) {
              reject(new Error('No accounts - not logged in to wallet'))
            } else {
              if (data.opcode === 'send-payment') {
                sendPayment(web3, data, accounts[0], resolve, reject, commit)
              } else if (data.opcode === 'mint-token') {
                mintToken(web3, data, accounts[0], resolve, reject, commit)
              } else if (data.opcode === 'eth-set-base-token-uri') {
                setBaseTokenURI(web3, data, accounts[0], resolve, reject, commit)
              } else if (data.opcode === 'eth-get-total-supply') {
                totalSupply(web3, accounts[0], resolve, reject)
              } else if (data.opcode === 'eth-get-contract-data') {
                getContractData(web3, data, accounts[0], resolve, reject)
              } else if (data.opcode === 'eth-set-minting-fee') {
                setMintPrice(web3, data, accounts[0], resolve, reject)
              } else if (data.opcode === 'eth-make-withdrawal') {
                makeWithdrawal(web3, data, accounts[0], resolve, reject)
              }
            }
          })
        })
      })
    },
    enable ({ commit, state }, data) {
      return new Promise((resolve, reject) => {
        getWeb3().then((web3) => {
          resolve(true)
        })
      })
    }
  }
}
export default rpayEthereumStore

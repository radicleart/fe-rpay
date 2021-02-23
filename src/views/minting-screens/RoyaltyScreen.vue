<template>
<b-card-group class="">
  <b-card header-tag="header" footer-tag="footer" class="rpay-card">
    <b-card-text class="text-center">
      <div class="my-5">Mint Your Item</div>
      <network-options/>
      <div v-if="errorMessage" class="text-danger mb-3 text-bold">{{errorMessage}}</div>
      <div v-else-if="mintedMessage" class="text-info mb-3 text-bold">{{mintedMessage}}</div>
      <div v-else class="text-white mb-3 text-bold">. &nbsp;</div>
      <beneficiaries/>
      <div class="mb-3">
        <b-button class="mr-2 w-50 cp-btn-order" variant="warning" @click.prevent="saveData()">Complete Later</b-button>
        <b-button class="ml-2 w-50 cp-btn-order" variant="warning" @click.prevent="mintToken()">Mint Now</b-button>
      </div>
    </b-card-text>
  </b-card>
</b-card-group>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import {
  bufferCV
} from '@stacks/transactions'
import NetworkOptions from './NetworkOptions'
import Beneficiaries from './Beneficiaries'
const NETWORK = process.env.VUE_APP_NETWORK

export default {
  name: 'RoyaltyScreen',
  components: {
    NetworkOptions,
    Beneficiaries
  },
  data () {
    return {
      errorMessage: null,
      mintedMessage: null,
      minted: false
    }
  },
  mounted () {
    this.lookupNftTokenId()
    // window.eventBus.$emit('mintEvent', { opcode: 'eth-mint-error' })
  },
  methods: {
    saveData: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      configuration.opcode = 'save-mint-data'
      window.eventBus.$emit('mintEvent', configuration)
    },
    mintToken: function () {
      this.errorMessage = 'Minting non fungible token - takes a minute or so..'
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const network = configuration.minter.preferredNetwork
      const networkConfig = configuration.minter.networks.filter(obj => {
        return obj.network === network
      })[0]

      if (network === 'stacks connect') {
        this.mintTokenStacks('rpayStacksStore/callContractBlockstack', networkConfig)
      } else if (network === 'stacks risidio') {
        this.mintTokenStacks('rpayStacksStore/callContractRisidio', networkConfig)
      } else {
        this.mintTokenEthereum(networkConfig)
      }
    },
    mintTokenEthereum: function (networkConfig) {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const mintConfig = {
        opcode: 'mint-token',
        ethContractAddress: networkConfig.contractAddress,
        assetHash: configuration.minter.item.assetHash
      }
      this.minted = true
      this.$store.dispatch('rpayEthereumStore/transact', { ethContractAddress: mintConfig.ethContractAddress, opcode: 'eth-get-total-supply' }).then((result) => {
        this.loading = false
        mintConfig.totalSupply = result.totalSupply
        this.$store.dispatch('rpayEthereumStore/transact', mintConfig).then((result) => {
          this.mintedMessage = 'Success! Token has been minted on the Ethereum blockchain Id=' + result.tokenId
          result.opcode = 'eth-mint-confirmed'
          result.assetHash = configuration.minter.item.assetHash
          window.eventBus.$emit('mintEvent', result)
        }).catch((e) => {
          this.errorMessage = (e.message) ? e.message : 'Minting error - please check you\'re connected to the right network: ' + NETWORK
        })
      }).catch((e) => {
        this.errorMessage = (e.message) ? e.message : 'Minting error - please check you\'re connected to the right network: ' + NETWORK
      })
    },
    mintTokenStacks: function (action, data) {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.minted = true
      const buffer = Buffer.from(configuration.minter.item.assetHash, 'hex') // Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      data.functionArgs = [bufferCV(buffer)]
      this.$store.dispatch(action, data).then((result) => {
        this.captureResult(configuration.minter.item.assetHash, data.contractAddress, data.contractName)
      }).catch((e) => {
        data.action = 'inc-nonce'
        this.$store.dispatch(action, data).then((result) => {
          this.captureResult(configuration.minter.item.assetHash, data.contractAddress, data.contractName)
        }).catch((e) => {
          this.errorMessage = (e.message) ? e.message : 'Minting error - reason unknown'
          window.eventBus.$emit('mintEvent', { opcode: 'stx-mint-error', message: this.message })
        })
      })
    },
    captureResult: function (assetHash, contractAddress, contractName) {
      const $self = this
      let counter = 0
      const intval = setInterval(function () {
        const result = {
          assetHash: assetHash,
          opcode: 'stx-mint-confirmed'
        }
        $self.$store.dispatch('rpayStacksStore/lookupNftTokenId', { assetHash: assetHash, contractAddress: contractAddress, contractName: contractName }).then((data) => {
          if (typeof data.nftIndex !== 'undefined' && (data.nftIndex === 0 || data.nftIndex >= 0)) {
            result.tokenId = data.tokenId
            result.nftIndex = data.nftIndex
            window.eventBus.$emit('mintEvent', result)
            clearInterval(intval)
          }
        }).catch((e) => {
          // try again
        })
        if (counter === 48) {
          window.eventBus.$emit('mintEvent', { opcode: 'stx-mint-error-timeout' })
          clearInterval(intval)
        }
        counter++
      }, 10000)
    },
    lookupNftTokenId: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStacksStore/lookupNftTokenId', { assetHash: configuration.minter.item.assetHash, contractAddress: configuration.minter.contractAddress, contractName: configuration.minter.contractName }).then((data) => {
        if (data.nftIndex && data.nftIndex > 0) {
          data.opcode = 'stx-mint-confirmed'
          data.assetHash = configuration.minter.item.assetHash
          this.minted = true
          this.mintedMessage = 'Asset with hash <br/>    ' + configuration.minter.item.assetHash + ' <br/> has already been minted with index: ' + data.nftIndex
          window.eventBus.$emit('mintEvent', data)
        }
      }).catch((e) => {
        // nothing to do here - no index so wait for minting operation
        // window.eventBus.$emit('mintEvent', { opcode: 'nft-lookup-error' })
      })
    }
  },
  computed: {
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    }
  }
}
</script>
<style lang="scss" scoped>
.btn {
  width: 80%;
  margin-top: 30px;
}
</style>

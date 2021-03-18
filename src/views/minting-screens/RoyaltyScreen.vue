<template>
<b-card-group class="">
  <b-card header-tag="header" footer-tag="footer" class="rpay-card">
    <header-screen :allowEdit="true" :errorMessage="errorMessage" :mintedMessage="mintedMessage"/>
    <item-display/>
    <beneficiaries v-if="enableRoyalties"/>
    <template v-slot:footer>
      <div class="footer-container">
        <div>
          <div class="d-flex justify-content-between">
            <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="saveData()">Back</b-button>
            <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="mintToken()">Mint</b-button>
          </div>
        </div>
      </div>
    </template>
  </b-card>
</b-card-group>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import Beneficiaries from './Beneficiaries'
import HeaderScreen from './HeaderScreen'
import ItemDisplay from './ItemDisplay'

export default {
  name: 'RoyaltyScreen',
  components: {
    Beneficiaries,
    ItemDisplay,
    HeaderScreen
  },
  data () {
    return {
      errorMessage: null,
      mintedMessage: null
    }
  },
  mounted () {
    const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
    if (!configuration.minter.forceNew) {
      this.lookupNftTokenId()
    }
    // window.eventBus.$emit('rpayEvent', { opcode: 'eth-mint-error' })
  },
  methods: {
    rangeEvent (displayCard) {
      this.$store.commit('rpayStore/setDisplayCard', displayCard)
    },
    getRangeValue () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      if (displayCard === 100) return 0
      else if (displayCard === 102) return 1
      else if (displayCard === 104) return 2
    },
    saveData: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      configuration.opcode = 'save-mint-data'
      window.eventBus.$emit('rpayEvent', configuration)
    },
    mintToken: function () {
      this.errorMessage = 'Minting non fungible token - takes a minute or so..'
      this.$store.commit('rpayStore/setDisplayCard', 104)
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[LSAT_CONSTANTS.KEY_PREFERRED_NETWORK]
      networkConfig.assetHash = configuration.minter.item.assetHash
      networkConfig.editions = configuration.minter.item.editions
      networkConfig.beneficiaries = configuration.minter.beneficiaries
      if (networkConfig.network === 'stacks connect') {
        networkConfig.action = 'callContractBlockstack'
        this.mintTokenStacks(networkConfig)
      } else if (networkConfig.network === 'stacks risidio') {
        networkConfig.action = 'callContractRisidio'
        this.mintTokenStacks(networkConfig)
      } else {
        this.mintTokenEthereum(networkConfig)
      }
    },
    mintTokenStacks: function (data) {
      this.$store.dispatch('rpayStacksStore/mintToken', data)
    },
    mintTokenEthereum: function (networkConfig) {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const mintConfig = {
        opcode: 'mint-token',
        ethContractAddress: networkConfig.contractAddress,
        assetHash: configuration.minter.item.assetHash
      }
      this.$store.dispatch('rpayEthereumStore/transact', mintConfig)
      // this.$store.dispatch('rpayEthereumStore/transact', { ethContractAddress: mintConfig.ethContractAddress, opcode: 'eth-get-total-supply' }).then((result) => {
      //  this.loading = false
      //  mintConfig.totalSupply = result.totalSupply
      //  this.$store.dispatch('rpayEthereumStore/transact', mintConfig)
      // })
    },
    lookupNftTokenId: function () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[LSAT_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupNftTokenId', { assetHash: configuration.minter.item.assetHash, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        result.message = 'Item #' + result.nftIndex + ' has been minted to your Stacks wallet'
        this.$store.commit(LSAT_CONSTANTS.SET_MINTING_MESSAGE, result, { root: true })
        this.$store.commit(LSAT_CONSTANTS.SET_DISPLAY_CARD, 106, { root: true })
        window.eventBus.$emit('rpayEvent', result)
      })
    }
  },
  computed: {
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    },
    enableRoyalties () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      return configuration.minter.enableRoyalties
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

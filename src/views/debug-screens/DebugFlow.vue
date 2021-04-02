<template>
<div class="p-2">
  <div class="text-small text-white upload-preview">
    <div class="mb-4 d-flex justify-content-between">
      <div class="">
        <a class="text-white mr-3" href="/?operation=payment-flow&debug=true">payment flow</a>
        <a class="text-white mr-3" href="/?operation=minting-flow&debug=true">minting flow</a>
        <a class="text-white mr-3" href="/?operation=selling-flow&debug=true">selling flow</a>
        <a class="text-white mr-3" href="/?operation=buying-flow&debug=true">buying flow</a>
        <a class="text-white mr-3" href="/?operation=marketplace-flow&debug=true">marketplace flow</a>
      </div>
    </div>
    <div class="text-right">
      <a v-if="globalEvent" class="text-white mr-3" href="#">{{globalEvent.opcode}}</a>
      <a v-if="!profile.loggedIn" class="text-white" href="#" @click.prevent="startLogin">login</a>
      <a v-else class="text-white" href="#" @click.prevent="startLogout">logout</a>
    </div>

    <div class="row">
      <div class="col-12"><h6>Current Item</h6></div>
      <div class="col-2">Lookup App:</div><div class="col-10"><a class="text-info" href="#" @click.prevent="lookupAppmapContractData()" size="sm" variant="info">Appmap contract data</a></div>
      <div class="col-2">Base URI:</div><div class="col-10"><a class="text-info" href="#" @click.prevent="lookupTokenContractData()" size="sm" variant="info">Token contract data</a></div>
      <div class="col-2">Address:</div><div class="col-10"><a target="_blank" class="text-warning" :href="contractUrl()">{{configuration.minter.networks[0].contractAddress}}.{{configuration.minter.networks[0].contractName}}</a></div>
      <div class="col-2">API Base:</div><div class="col-10">{{configuration.risidioBaseApi}}</div>
      <div class="col-2">Mode:</div><div class="col-10">{{configuration.risidioCardMode}}</div>
      <div class="col-2">Item name:</div><div class="col-10">{{configuration.minter.item.name}}</div>
      <div class="col-2">Asset hash:</div><div class="col-10">{{configuration.minter.item.assetHash}} <a href="#" @click.prevent="genHash()"><b-icon icon="alarm"/></a></div>
      <div class="col-2">Editions:</div><div class="col-10">{{configuration.minter.item.editions}}</div>
      <div class="col-2">Royalties:</div>
      <div class="col-10">
        <div class="row" v-for="(beneficiary, index) in configuration.minter.beneficiaries" :key="index">
          <div class="col-2">{{beneficiary.username}}</div>
          <div class="col-2">{{beneficiary.royalty}}</div>
          <div class="col-8">{{beneficiary.chainAddress}}</div>
        </div>
      </div>
      <div class="col-2">ImageUrl:</div><div class="col-10">{{configuration.minter.item.imageUrl}}</div>
    </div>
    <div class="row my-5">
      <div class="col-2">Look Up:</div>
      <div role="col-10 group">
        <b-input-group size="sm">
          <b-form-input
            type="number"
            trim
            v-model="nifty">
          </b-form-input>
          <b-input-group-append>
            <b-button @click="lookupTokenByIndex()" size="xs" variant="info"><b-icon icon="search"/></b-button>
          </b-input-group-append>
        </b-input-group>
      </div>
    </div>
    <div v-if="result">
      <div class="row mt-2">
        <div class="col-2"><a class="text-white" href="#" @click.prevent="lookupTokenByHash()">NFT Data</a></div>
        <div class="col-10">{{result}}</div>
      </div>
      <div class="row mt-2">
        <div class="col-2">Index</div>
        <div class="col-10">{{result.nftIndex}}</div>
      </div>
      <div class="row mt-2">
        <div class="col-2">Edition # {{result.edition}}</div>
        <div class="col-10">of {{result.maxEditions}} and {{result.editionCounter}} minted so far</div>
      </div>
      <div class="row mt-2">
        <div class="col-2">Selling</div>
        <div class="col-10">{{saleDataDesc()}}</div>
      </div>
    </div>

    <div class="bg-light text-dark p-4" v-if="appMapContract">
      <div class="row border-bottom mb-3 pb-2">
        <div class="col-12"><h6>All Contract Data</h6></div>
        <div class="col-2">administrator</div><div class="col-10">{{appMapContract.administrator}}</div>
        <div class="col-2">appCounter</div><div class="col-10">{{appMapContract.appCounter}}</div>
      </div>
      <div class="row border-bottom mb-3 pb-2" v-for="(application, index) in appMapContract.applications" :key="index">
        <div class="col-2">Contract Id</div><div class="col-10">{{application.contractId}}</div>
        <div class="col-2">App-Index</div><div class="col-10">{{application.appIndex}}</div>
        <div class="col-2">Storage</div><div class="col-10">{{application.storageModel}}</div>
        <div class="col-2">Status</div><div class="col-10">{{application.status}}</div>
          <div class="row ml-3 p-3" v-if="application.tokenContract">
            <div class="col-2">Token</div><div class="col-10 text-bold">{{application.tokenContract.tokenSymbol}} - {{application.tokenContract.tokenName}}</div>
            <div class="col-2">Base URL</div><div class="col-10">{{application.tokenContract.baseTokenUri}}</div>
            <div class="col-2">administrator</div><div class="col-10">{{application.tokenContract.administrator}}</div>
            <div class="col-2">Platform</div><div class="col-10">{{application.tokenContract.platformFee}}</div>
            <div class="col-2">Minted</div><div class="col-10">{{application.tokenContract.mintCounter}}</div>
            <div class="row text-danger ml-4 mt-3 border-bottom mb-3 pb-2" v-for="(token, index) in application.tokenContract.tokens" :key="index">
              <div class="col-2">NFT</div><div class="col-10">#<a href="#" class="text-small text-info" @click.prevent="loadToken(application.contractId, token.nftIndex)">{{token.nftIndex}}</a></div>
              <div class="col-2">TokenInfo</div><div class="col-10"><a href="#" class="text-small text-info" @click.prevent="loadToken(application.contractId, token.nftIndex, token.tokenInfo.assetHash)">{{token.tokenInfo.assetHash}}</a></div>
              <div class="col-2">Owner</div><div class="col-10">{{token.owner}}</div>
              <div class="col-2">Offers</div><div class="col-10">{{token.offers}}</div>
              <div class="col-2">SaleData</div><div class="col-10">Type={{token.saleData.saleType}}, Amount {{token.saleData.buyNowOrStartingPrice}}</div>
              <div class="col-2">Reserve</div><div class="col-10">{{token.saleData.reservePrice}}, Increment {{token.saleData.incrementPrice}}</div>
              <div class="col-2">End time</div><div class="col-10">{{token.saleData.biddingEndTime}}</div>
              <div class="col-2">Max Eds.</div><div class="col-10">{{token.tokenInfo.maxEditions}}</div>
              <div class="col-2">Eds.</div><div class="col-10">{{token.tokenInfo.edition}}</div>
              <div class="col-2">Block-height</div><div class="col-10">{{token.tokenInfo.date}}</div>
              <div class="col-2">Original</div><div class="col-10">{{token.tokenInfo.seriesOriginal}}</div>
            </div>
          </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
// import utils from '@/services/utils'
// import crypto from 'crypto'

export default {
  name: 'MintingFlow',
  components: {
  },
  data () {
    return {
      nifty: 0,
      loading: true,
      message: null,
      result: null,
      globalEvent: null,
      resultApp: null
    }
  },
  mounted () {
    this.$store.dispatch('rpayStacksContractStore/fetchContractData')
    const $self = this
    window.eventBus.$on('rpayEvent', function (data) {
      $self.globalEvent = data
    })
  },
  methods: {
    loadToken: function (contractId, nftIndex, aHash) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const cAddr = contractId.split('.')[0]
      const cName = contractId.split('.')[1]
      configuration.minter.networks[0].contractAddress = cAddr
      configuration.minter.networks[0].contractName = cName
      configuration.minter.item.nftIndex = nftIndex
      configuration.minter.item.assetHash = aHash
      this.$store.commit('rpayStore/addConfiguration', configuration)
    },
    startLogout: function () {
      this.$store.dispatch('rpayAuthStore/startLogout').then((result) => {
        this.result = result
      })
    },
    startLogin: function () {
      this.$store.dispatch('rpayAuthStore/startLogin').then((result) => {
        this.result = result
      })
    },
    saleDataDesc: function () {
      if (this.result && this.result.saleData) {
        if (this.result.saleData.saleType === 0) {
          return 'not selling'
        } else if (this.result.saleData.saleType === 1) {
          return 'buy now for ' + this.result.saleData.buyNowOrStartingPrice
        } else if (this.result.saleData.saleType === 2) {
          return 'place bid for ' + this.result.saleData.buyNowOrStartingPrice + this.result.saleData.incrementPrice
        } else if (this.result.saleData.saleType === 3) {
          return 'Make an offer (' + this.result.offerCounter + ' offers made so far)'
        }
      }
    },
    lookupTokenByIndex: function () {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupTokenByIndex', { nftIndex: this.nifty, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        this.result = result
      })
    },
    lookupApplicationByIndex: function () {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupApplicationByIndex', { appCounter: 0, contractAddress: networkConfig.contractAddress, contractName: 'appmap' }).then((result) => {
        this.resultApp = result
      })
    },
    lookupAppmapContractData: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStacksStore/lookupAppmapContractData', { contractAddress: configuration.minter.networks[0].contractAddress, contractName: 'appmap' }).then((result) => {
        this.resultApp = result
      })
    },
    lookupTokenContractData: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStacksStore/lookupTokenContractData', { contractAddress: configuration.minter.networks[0].contractAddress, contractName: configuration.minter.networks[0].contractName }).then((result) => {
        this.resultApp = result
      })
    },
    contractUrl: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.risidioStacksApi + '/v2/contracts/source/' + configuration.minter.networks[0].contractAddress + '/' + configuration.minter.networks[0].contractName + '?proof=0'
    },
    genHash: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      if (!configuration.minter.item.assetHashes) configuration.minter.item.assetHashes = []
      configuration.minter.item.assetHashes.push(configuration.minter.item.assetHash)
      const ran = Math.floor(Math.random() * Math.floor(1000000000))
      // const ranHash = utils.buildHash(ran)
      const ranHash = crypto.createHash('sha256').update(ran).digest('hex')
      configuration.minter.item.assetHash = ranHash
      this.$store.commit('rpayStore/addConfiguration', configuration)
    },
    lookupTokenByHash: function () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupTokenByHash', { assetHash: configuration.minter.item.assetHash, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        this.result = result
      })
    }
  },
  computed: {
    configuration () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration
    },
    profile () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return profile
    },
    appMapContract () {
      const appMapContract = this.$store.getters[APP_CONSTANTS.GET_APP_MAP_CONTRACT]
      return appMapContract
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

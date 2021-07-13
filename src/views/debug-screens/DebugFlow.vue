<template>
<div class="p-2" v-if="loaded">
  <div class="text-small text-white upload-preview">
    <div class="mb-4 d-flex justify-content-between">
      <div class="">
        <a class="text-white mr-3" href="/?operation=payment-flow&debug=true">payment flow</a>
        <a class="text-white mr-3" href="/?operation=minting-flow&debug=true">minting flow</a>
        <a class="text-white mr-3" href="/?operation=selling-flow&debug=true">selling flow</a>
        <a class="text-white mr-3" href="/?operation=purchase-flow&debug=true">purchase flow</a>
        <a class="text-white mr-3" href="/?operation=marketplace-flow&debug=true">marketplace flow</a>
        <a class="text-white mr-3" @click.prevent="privileges()">privileges</a>
      </div>
    </div>
    <div class="text-right">
      <a v-if="globalEvent" class="text-white mr-3" href="#">{{globalEvent.opcode}}</a>
      <a v-if="!profile.loggedIn" class="text-white" href="#" @click.prevent="startLogin">login</a>
      <a v-else class="text-white" href="#" @click.prevent="startLogout">logout</a>
    </div>
    <div class="text-right" v-if="profile.loggedIn">
      <a class="text-white mr-3" href="#">{{profile.stxAddress}}</a>
      <a class="text-white mr-3" href="#">{{accountInfo}}</a>
    </div>

    <div class="row" v-if="getGaiaAsset">
      <div class="col-12"><h6>Current Item</h6></div>
      <div class="col-2">Contract Balance:</div><div class="col-10">{{contractBalance}}</div>
      <div class="col-2">Lookup App:</div><div class="col-10"><a class="text-info" href="#" @click.prevent="lookupAppmapContractData()" size="sm" variant="info">Appmap contract data</a></div>
      <div class="col-2">Base URI:</div><div class="col-10"><a class="text-info" href="#" @click.prevent="lookupTokenContractData()" size="sm" variant="info">Token contract data</a></div>
      <div class="col-2">Address:</div><div class="col-10"><a target="_blank" class="text-warning" :href="contractUrl()">{{configuration.minter.networks[0].contractAddress}}.{{configuration.minter.networks[0].contractName}}</a></div>
      <div class="col-2">API Base:</div><div class="col-10">{{configuration.risidioBaseApi}}</div>
      <div class="col-2">Mode:</div><div class="col-10">{{configuration.risidioCardMode}}</div>
      <div class="col-2">Asset hash:</div><div class="col-10"><a href="#" @click="lookupTokenByHash()">{{configuration.gaiaAsset.assetHash}}</a> <a href="#" @click.prevent="genHash()"><b-icon icon="alarm"/></a></div>
      <div class="col-2">Asset Name:</div><div class="col-10">{{getGaiaAsset.name}}</div>
      <div class="col-2">Editions:</div><div class="col-10" v-if="getGaiaAsset.contractAsset">{{getGaiaAsset.contractAsset.tokenInfo.edition}} / {{getGaiaAsset.contractAsset.tokenInfo.maxEditions}} / {{getGaiaAsset.contractAsset.tokenInfo.editionCost}}</div>
      <div class="col-2">Royalties:</div>
      <div class="col-10">
        <div class="row" v-for="(beneficiary, index) in configuration.minter.beneficiaries" :key="index">
          <div class="col-2">{{beneficiary.username}}</div>
          <div class="col-2">{{beneficiary.royalty}}</div>
          <div class="col-8">{{beneficiary.chainAddress}}</div>
        </div>
      </div>
      <div class="col-2">ImageUrl:</div><div class="col-10">{{configuration.gaiaAsset.image}}</div>
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
    <div v-if="currentAsset">
      <div class="row mt-2">
        <div class="col-2"><a class="text-white" href="#">NFT Data</a></div>
        <div class="col-10">{{currentAsset.name}}</div>
      </div>
      <div class="row mt-2">
        <div class="col-2">Index</div>
        <div class="col-10">{{currentAsset.nftIndex}}</div>
      </div>
      <div class="row mt-2">
        <div class="col-2" v-if="currentAsset.tokenInfo">Edition # {{currentAsset.tokenInfo.edition}}</div>
        <div class="col-10">of {{currentAsset.maxEditions}} and {{currentAsset.editionCounter}} minted so far</div>
      </div>
      <div class="row mt-2">
        <div class="col-2">Selling</div>
        <div class="col-10">{{saleDataDesc()}}</div>
      </div>
    </div>

    <div class="bg-light text-dark p-4" v-if="registry">
      <div class="row border-bottom mb-3 pb-2">
        <div class="col-12"><h6>All Contract Data</h6></div>
        <div class="col-2">administrator</div><div class="col-10">{{registry.administrator}}</div>
        <div class="col-2">Admin Contract Address</div><div class="col-10">{{registry.adminContractAddress}}</div>
        <div class="col-2">Admin Contract Name</div><div class="col-10">{{registry.adminContractName}}</div>
        <div class="col-2">appCounter</div><div class="col-10">{{registry.appCounter}}</div>
      </div>
      <div class="row border-bottom mb-3 pb-2" v-for="(application, index) in registry.applications" :key="index">
        <div class="col-2">Contract Id</div><div class="col-10">{{application.contractId}}</div>
        <div class="col-2">Owner</div><div class="col-10">{{application.owner}}</div>
        <div class="col-2">App-Index</div><div class="col-10">{{application.appIndex}}</div>
        <div class="col-2">Storage</div><div class="col-10">{{application.storageModel}}</div>
        <div class="col-2">Status</div><div class="col-10">{{application.status}}</div>
          <div class="row ml-3 p-3" v-if="application.tokenContract">
            <div class="col-2">Token Contract</div><div class="col-10 text-bold">{{application.tokenContract.tokenSymbol}} - {{application.tokenContract.tokenName}}</div>
            <div class="col-2">Base URL</div><div class="col-10">{{application.tokenContract.baseTokenUri}}</div>
            <div class="col-2">Mint Fee</div><div class="col-10">{{application.tokenContract.mintPrice}}</div>
            <div class="col-2">administrator</div><div class="col-10">{{application.tokenContract.administrator}}</div>
            <div class="col-2">Platform</div><div class="col-10">{{application.tokenContract.platformFee}}</div>
            <div class="col-2">Minted</div><div class="col-10">{{application.tokenContract.mintCounter}}</div>
            <div class="row ml-4 mt-3 border-bottom mb-3 pb-2" v-for="(token, index) in application.tokenContract.tokens" :key="index">
              <div class="col-2 my-2">
                <div v-if="gaiaAsset(token.tokenInfo.assetHash)"><img width="70px" :src="gaiaAsset(token.tokenInfo.assetHash).image"/></div>
              </div>
              <div class="col-10 my-2" v-if="gaiaAsset(token.tokenInfo.assetHash)">
                <div>{{gaiaAsset(token.tokenInfo.assetHash).name}}</div>
                <div>[#{{token.nftIndex}}] : Edition {{token.tokenInfo.edition}} / {{token.tokenInfo.maxEditions}} / {{token.tokenInfo.editionCost}}</div>
                <div>Uploaded by:     {{gaiaAsset(token.tokenInfo.assetHash).owner}}</div>
                <div>metaDataUrl:       {{token.tokenInfo.metaDataUrl}}</div>
                <div class="text-info">
                  <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="transferAsset(token.nftIndex)">transfer</a>
                  <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="mintNextEdition(token.tokenInfo.assetHash, token.nftIndex)">mint edition {{token.editionCounter}}</a>
                  <a class="text-info pr-3 mr-3 border-right" href="#" @click.prevent="confirmBuyNow(token.tokenInfo.assetHash, token.owner)">buy now</a>
                  <a class="text-info pr-3 mr-3" href="#" @click.prevent="placeBid(token.tokenInfo.assetHash, token.nftIndex)">place bid</a>
                </div>
              </div>
              <div class="row mt-3">
              <div class="col-2">NFT</div><div class="col-10">#<a href="#" class="text-small text-info" @click.prevent="loadToken(application.contractId, token.nftIndex)">{{token.nftIndex}}</a></div>
              <div class="col-2">TokenInfo</div><div class="col-10"><a href="#" class="text-small text-info" @click.prevent="loadToken(application.contractId, token.nftIndex, token.tokenInfo.assetHash)">{{token.tokenInfo.assetHash}}</a></div>
              <div class="col-2">Meta Data Url</div><div class="col-10">{{token.tokenInfo.metaDataUrl}}</div>
              <div class="col-2">Owner</div><div class="col-10">{{token.owner}} </div>
              <div class="col-2">SaleData</div><div class="col-10">Type: {{token.saleData.saleType}}, Cycle {{token.saleData.saleCycleIndex}}, Amount: {{token.saleData.buyNowOrStartingPrice}} Reserve: {{token.saleData.reservePrice}}, Increment: {{token.saleData.incrementPrice}} Ends: {{token.saleData.biddingEndTime}}</div>
              <div class="col-2">Edition</div><div class="col-10">{{token.tokenInfo.edition}} / {{token.tokenInfo.maxEditions}} / {{token.tokenInfo.editionCost}}</div>
              <div class="col-2">Block-height</div><div class="col-10">{{token.tokenInfo.date}}</div>
              <div class="col-2">Original</div><div class="col-10">{{token.tokenInfo.seriesOriginal}}</div>
              <!-- <div class="col-2">Beneficiaries</div><div class="col-10">{{token.beneficiaries}}</div> -->
              <div class="col-2">Royalties:</div>
              <div class="col-10">
                <div class="row" v-for="(beneficiary, index) in token.beneficiaries" :key="index">
                  <div class="col-2">{{beneficiary.username}}</div>
                  <div class="col-2">{{beneficiary.royalty}}</div>
                  <div class="col-8">{{beneficiary.chainAddress}}</div>
                </div>
              </div>
              <div class="col-2">Bids</div><div class="col-10">{{token.bidCounter}}</div>
              <div class="col-2">Current High</div><div class="col-10">{{currentBid(token)}}</div>
              <div class="col-2">Next Bid</div><div class="col-10">{{nextBid(token)}}</div>
              <div class="col-2">Info</div><div class="col-10">{{sellingInfo(token)}}</div>
              <div class="col-2"></div>
              <div class="col-10 my-2">
                <div class="row bg-dark text-white p-2 mr-3" v-for="(bid, index1) in token.bidHistory" :key="index1">
                  <div class="col-2">Amount</div><div class="col-10">{{bid.amount}}</div>
                  <div class="col-2">Bidder</div><div class="col-10">{{bid.bidder}}</div>
                  <div class="col-2">Placed</div><div class="col-10">{{formatDate(bid.whenBid)}}</div>
                  <div class="col-2">Cycle</div><div class="col-10">{{bid.saleCycle}}</div>
                </div>
              </div>
              <div class="col-2">Offers</div><div class="col-10">{{token.offerCounter}}</div>
              <div class="col-2"></div>
              <div class="col-10">
                <div v-for="(offer, index1) in token.offerHistory" :key="index1">
                  <div>Amount: {{offer.amount}} Made: {{offer.amount}}  Cycle: {{offer.saleCycle}} Offerer: {{offer.offerer}}</div>
                  <div><a href="#" @click.prevent="acceptOffer(offer, index1)">accept</a></div>
                </div>
              </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import moment from 'moment'

export default {
  name: 'MintingFlow',
  components: {
  },
  data () {
    return {
      nifty: 0,
      contractBalance: -1,
      loaded: false,
      message: null,
      result: null,
      globalEvent: null,
      resultApp: null
    }
  },
  mounted () {
    if (this.privileges()) return
    this.$store.dispatch('rpayStacksContractStore/fetchContractData')
    this.$store.dispatch('rpaySearchStore/findAssets')
    const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
    const config = {
      contractAddress: networkConfig.contractAddress,
      contractName: networkConfig.contractName,
      functionName: 'get-balance',
      functionArgs: []
    }
    this.$store.dispatch('rpayStacksStore/callContractReadOnly', config).then((result) => {
      this.contractBalance = result.result
    }).catch((err) => {
      console.log(err)
    })
    this.$store.dispatch('rpayAuthStore/fetchMyAccount').then((profile) => {
      this.$store.dispatch('rpayAuthStore/fetchAccountInfo', { stxAddress: profile.stxAddress, force: true })
      this.loaded = true
      this.$store.dispatch('rpayPurchaseStore/fetchOffers').then((dbOffers) => {
        this.dbOffers = dbOffers
      }).catch((err) => {
        console.log(err)
      })
    }).catch((err) => {
      console.log(err)
    })
    const $self = this
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    let gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](configuration.gaiaAsset.assetHash)
    if (!gaiaAsset) {
      gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET](configuration.gaiaAsset.assetHash)
    }
    window.eventBus.$on('rpayEvent', function (data) {
      $self.globalEvent = data
    })
  },
  methods: {
    formatDate: function (date) {
      const loaclEndM = moment(date)
      return loaclEndM.format('DD-MM-YY hh:mm')
    },
    privileges: function () {
      this.$store.dispatch('rpayPrivilegeStore/fetchAuthorisation', { stxAddress: 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW' }).then((result) => {
        this.$store.dispatch('rpayPrivilegeStore/isAuthorised', { stxAddress: 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW', domain: encodeURI(location.host), privilege: 'can-mint' })
      })
    },
    loadToken: function (contractId, nftIndex, aHash) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      const cAddr = contractId.split('.')[0]
      const cName = contractId.split('.')[1]
      configuration.minter.networks[0].contractAddress = cAddr
      configuration.minter.networks[0].contractName = cName
      contractAsset.nftIndex = nftIndex
      configuration.gaiaAsset.assetHash = aHash
      this.$store.commit('rpayStore/addConfiguration', configuration)
    },
    confirmBuyNow (assetHash, owner) {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](assetHash)
      const data = {
        sendAsSky: (owner === 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW'),
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName,
        nftIndex: contractAsset.nftIndex,
        owner: owner,
        amount: contractAsset.saleData.buyNowOrStartingPrice,
        recipient: (owner === 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG') ? 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW' : 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
      }
      this.$store.dispatch('rpayPurchaseStore/buyNow', data).then((result) => {
        this.result = result
      }).catch((error) => {
        this.result = error
      })
    },
    placeBid (assetHash, owner) {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](assetHash)
      const data = {
        sendAsSky: (owner === 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW'),
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName,
        nftIndex: contractAsset.nftIndex,
        owner: owner,
        amount: contractAsset.saleData.buyNowOrStartingPrice,
        recipient: (owner === 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG') ? 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW' : 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
      }
      this.$store.dispatch('rpayPurchaseStore/buyNow', data).then((result) => {
        this.result = result
      }).catch((error) => {
        this.result = error
      })
    },
    mintNextEdition (assetHash) {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](assetHash)
      const data = {
        methos: 'rpayStacksStore/callContractBlockstack',
        editionCost: 30,
        owner: contractAsset.owner,
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName,
        nftIndex: contractAsset.nftIndex,
        buyNowOrStartingPrice: contractAsset.saleData.buyNowOrStartingPrice
      }
      this.$store.dispatch('rpayPurchaseStore/mintEdition', data).then((result) => {
        this.result = result
      }).catch((error) => {
        this.result = error
      })
    },
    transferAsset: function (index, owner) {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const data = {
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName,
        nftIndex: index,
        owner: owner,
        recipient: (owner === 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG') ? 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW' : 'STFJEDEQB1Y1CQ7F04CS62DCS5MXZVSNXXN413ZG'
      }
      return this.$store.dispatch('rpayPurchaseStore/transferAsset', data).then((result) => {
        this.result = result
      })
    },
    acceptOffer: function (offer, index) {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](configuration.gaiaAsset.assetHash)
      const offerData = {
        contractAddress: networkConfig.contractAddress,
        contractName: networkConfig.contractName,
        sendAsSky: true,
        owner: contractAsset.owner,
        recipient: offer.offerer,
        offerIndex: index,
        nftIndex: contractAsset.nftIndex
      }
      return this.$store.dispatch('rpayPurchaseStore/acceptOffer', offerData).then((result) => {
        this.result = result
      })
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
    saleDataDesc: function (currentAsset) {
      if (currentAsset && currentAsset.saleData) {
        if (currentAsset.saleData.saleType === 0) {
          return 'not selling'
        } else if (currentAsset.saleData.saleType === 1) {
          return 'buy now for ' + currentAsset.saleData.buyNowOrStartingPrice
        } else if (currentAsset.saleData.saleType === 2) {
          return 'place bid for ' + currentAsset.saleData.buyNowOrStartingPrice + currentAsset.saleData.incrementPrice
        } else if (currentAsset.saleData.saleType === 3) {
          return 'Make an offer (' + currentAsset.offerCounter + ' offers made so far)'
        }
      }
    },
    lookupTokenByIndex: function () {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      this.$store.dispatch('rpayStacksStore/lookupTokenByIndex', { nftIndex: this.nifty, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
        this.result = result
      })
    },
    lookupTokenByHash: function () {
      const networkConfig = this.$store.getters[APP_CONSTANTS.KEY_PREFERRED_NETWORK]
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      this.$store.dispatch('rpayStacksStore/lookupTokenByHash', { assetHash: configuration.gaiaAsset.assetHash, contractAddress: networkConfig.contractAddress, contractName: networkConfig.contractName }).then((result) => {
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
      if (!configuration.gaiaAsset.assetHashes) configuration.gaiaAsset.assetHashes = []
      configuration.gaiaAsset.assetHashes.push(configuration.gaiaAsset.assetHash)
      const ran = Math.floor(Math.random() * Math.floor(1000000000))
      // const ranHash = utils.buildHash(ran)
      const ranHash = crypto.createHash('sha256').update(ran).digest('hex')
      configuration.gaiaAsset.assetHash = ranHash
      this.$store.commit('rpayStore/addConfiguration', configuration)
    },
    gaiaAsset (hash) {
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_GAIA_ASSET_BY_HASH](hash)
      return gaiaAsset
    },
    nextBid (token) {
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_BIDDING_NEXT_BID](token)
      return gaiaAsset
    },
    currentBid (token) {
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_BIDDING_CURRENT_BID](token)
      return gaiaAsset
    },
    sellingInfo (token) {
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_SALES_INFO_TEXT](token)
      return gaiaAsset
    }
  },
  computed: {
    currentAsset () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const currentAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET](configuration.gaiaAsset.assetHash)
      return currentAsset
    },
    profile () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return profile
    },
    accountInfo () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      if (!profile || !profile.loggedIn) return null
      const ai = this.$store.getters[APP_CONSTANTS.KEY_ACCOUNT_INFO](profile.stxAddress)
      return ai
    },
    getGaiaAsset () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const gaiaAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET](configuration.gaiaAsset.assetHash)
      return gaiaAsset
    },
    configuration () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration
    },
    registry () {
      const registry = this.$store.getters[APP_CONSTANTS.KEY_REGISTRY]
      return registry
    }
  }
}
</script>
<style lang="scss" scoped>
</style>

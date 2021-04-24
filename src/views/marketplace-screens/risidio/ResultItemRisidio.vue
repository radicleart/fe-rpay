<template>
<div>
  <div v-if="video">
    <div @mouseover="transme()" @mouseout="transbackme()" :style="dimensions()" class="">
      <router-link :style="'opacity: ' + opacity + ';'" style="padding: 3px; position: absolute; top: 5px; right: 25px; z-index: 100; width: 40px; height: 40px;" :to="assetUrl"><b-icon style="width: 40px; height: 40px;" icon="arrow-right-circle"/></router-link>
      <media-item :videoOptions="videoOptions" :nftMedia="result.nftMedia" :targetItem="targetItem()"/>
    </div>
  </div>
  <div v-else>
    <router-link :to="assetUrl">
      <div ref="lndQrcode" class="result-item0 mb-4 bg-light" :style="calcHeight()">
        <img style="max-width: 300px;" width="100%" :src="coverImageSrc"/>
        <!-- <div style="position: absolute; top: -20px; left: 15px; font-size: 2rem;"><b-badge variant="light">{{result.nftIndex}} <span class="sr-only">NFT</span></b-badge></div> -->
        <div><a style="position: absolute; top: 0px; right: 0; font-size: 2rem; z-index: 10;" @click.prevent="toggleFavourite()" href="#"><img ref="lndQrcode" :src="(amIOwner()) ? likeIconPurple : likeIconTurquoise" alt="like-icon"></a></div>
        <!--<div class="result__item--description" v-if="dHover[index]" v-html="item.b1_text1[0].text"></div>-->
        <div class="result__item--overlay">
          <div class="result__item--description">
            <div class="d-flex justify-content-between">
              <div class="result__item--title">#{{contractAsset.nftIndex}} {{result.name}}</div>
              <div class="result__item--amount">Σ {{buyingPrice}}</div>
            </div>
            <div class="d-flex justify-content-between">
              <div class="result__item--by">By <span class="result__item--artist">{{owner(result.owner)}}</span></div>
              <div class="result__item--price">{{buyingPriceConversion}}</div>
            </div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</div>
<!-- {{created(result.created)}} / {{created(result.updated)}} -->
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import moment from 'moment'
import utils from '@/services/utils'
import Vue from 'vue'
import MediaItem from '../MediaItem'

export default {
  name: 'ResultItemRisidio',
  components: {
    MediaItem
  },
  props: ['result'],
  data () {
    return {
      height: 300,
      video: true,
      opacity: 0,
      logo: require('@/assets/img/logo.svg'),
      dims: { width: '100%', height: '100%' },
      background: require('@/assets/img/main-navbar-bg.svg'),
      likeIconTurquoise: require('@/assets/img/Favorite_button_turquoise_empty.png'),
      likeIconPurple: require('@/assets/img/Favorite_button_purple_empty.png')
    }
  },
  mounted () {
    Vue.nextTick(function () {
      const ele = this.$refs.lndQrcode
      let width = 300
      if (ele) {
        width = ele.clientWidth
      }
      this.height = width // this.$store.getters[APP_CONSTANTS.KEY_GALLERY_IMAGE_WIDTH](width)
    }, this)
  },
  methods: {
    targetItem: function () {
      return this.$store.getters[APP_CONSTANTS.KEY_TARGET_FILE_FOR_DISPLAY](this.result)
    },
    hoverIn (index) {
      this.dHover[index] = true
      this.componentKey += 1
    },
    transme () {
      this.opacity = 1
    },
    transbackme () {
      this.opacity = 0
    },
    dimensions () {
      return 'width: ' + this.dims.width / 2 + '; height: ' + this.dims.width / 2 + ';'
    },
    hoverOut () {
      this.dHover = [false, false, false, false, false, false, false, false, false, false, false, false]
      this.componentKey += 1
    },
    toggleFavourite () {
      utils.makeFlasher(this.$refs.lndQrcode)
      this.$store.dispatch('projectStore/toggleFavourite', this.result).then((index) => {
        if (index < 0) {
          this.$notify({ type: 'info', title: 'Favourites', text: this.result.name + ' has been added to your favourites - you can access them in your account.' })
        } else {
          this.$notify({ type: 'info', title: 'Favourites', text: this.result.name + ' has been removed from your favourites.' })
        }
      })
    },
    calcHeight () {
      return {
        height: this.height + 'px',
        width: '100%',
        'background-repeat': 'no-repeat',
        'background-image': `url(${this.result.assetUrl})`,
        'background-position': 'center center',
        '-webkit-background-size': 'cover',
        '-moz-background-size': 'cover',
        '-o-background-size': 'cover',
        'background-size': 'cover'
      }
    },
    truncateProjectId (projectId) {
      if (projectId.indexOf('.') > -1) {
        let addr = projectId.split('.')[0]
        addr = addr.substring(addr.length - 5)
        return addr + '.' + projectId.split('.')[1]
      }
      return projectId
    },
    truncateAssetHash (assetHash) {
      const addr = assetHash.substring(0, 4)
      return addr + '...' + assetHash.substring(assetHash.length - 4)
    },
    amIOwner () {
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      return profile.username === this.result.owner
    },
    owner (id) {
      return (id && id.indexOf('.') > -1) ? id.split('.')[0] : '?'
    },
    saleType () {
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](this.result.assetHash)
      if (contractAsset.saleData && contractAsset.saleData.saleType === 0) {
        return 'not selling'
      } else if (contractAsset.saleData && contractAsset.saleData.saleType === 1) {
        return 'buy now'
      } else if (contractAsset.saleData && contractAsset.saleData.saleType === 2) {
        return 'place bid'
      } else if (contractAsset.saleData && contractAsset.saleData.saleType === 3) {
        return 'make offer'
      }
    },
    created (created) {
      return moment(created).format('YYYY-MM-DD HH:mm:SS')
    }
  },
  computed: {
    videoOptions () {
      const videoOptions = {
        assetHash: this.result.assetHash,
        autoplay: false,
        muted: true,
        showMeta: false,
        controls: true,
        aspectRatio: '1:1',
        poster: (this.result.nftMedia.coverImage) ? this.result.nftMedia.coverImage.fileUrl : null,
        sources: [
          { src: this.result.nftMedia.artworkFile.fileUrl, type: this.result.nftMedia.artworkFile.type }
        ],
        fluid: true
      }
      return videoOptions
    },
    coverImageSrc () {
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](this.result.assetHash)
      if (contractAsset && contractAsset.nftMedia && contractAsset.nftMedia.coverImage && contractAsset.nftMedia.coverImage.fileUrl) {
        return contractAsset.nftMedia.coverImage.fileUrl
      }
      return this.background
    },
    contractAsset () {
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](this.result.assetHash)
      return contractAsset
    },
    buyingPriceConversion () {
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](this.result.assetHash)
      const buyNowOrStartingPrice = contractAsset.saleData.buyNowOrStartingPrice
      const rate = this.$store.getters[APP_CONSTANTS.KEY_EXCHANGE_RATE](buyNowOrStartingPrice)
      return rate
    },
    buyingPrice () {
      const contractAsset = this.$store.getters[APP_CONSTANTS.KEY_ASSET_FROM_CONTRACT_BY_HASH](this.result.assetHash)
      return contractAsset.saleData.buyNowOrStartingPrice
    },
    assetUrl () {
      let assetUrl = '/assets/' + this.result.assetHash
      if (this.$route.name === 'my-items') {
        assetUrl = '/my-items/' + this.result.assetHash
      }
      return assetUrl
    }
  }
}
</script>
<style lang="scss" scoped>
.result-item {
  position: relative;
}
.flasher {
  width: 50px;
  height: 50px;
}
.result-item {
  /* ITEMS STYLE */

  & .result__item--overlay {
    display: flex;
    align-items: flex-end;
    position: absolute;
    width: 100%;
    height: 100%;
    bottom: 0;
    cursor: pointer;
  }

  & .result__item--description {
    width: 100%;
    padding: 11px 18px;
    color: #fff;
    text-shadow: 0px 3px 6px #00000029;
    background: #50B1B5;
    opacity: 0;
    transition: opacity ease 0.3s;
  }

  & .result__item--overlay:hover .result__item--description {
    opacity: 0.95;
  }

  & .result__item--title {
    font-size: 1.4rem;
    font-weight: 400;
  }

  & .result__item--amount {
    font-size: 1.2rem;
    font-weight: 600;
  }

  & .result__item--by {
    font-size: 1rem;
    font-weight: 300;
  }

  & .result__item--artist {
    font-size: 1rem;
    font-weight: 700;
  }

  & .result__item--price {
    font-size: 0.9rem;
    font-weight: 400;
  }

  & .result__item--like-btn {
    position: absolute;
    top: 0;
    right: 0;
    color: #FFFFFF;
    font-size: 1.3rem;
    background-color: #50B1B5;
    padding: 10px 13px;
    border-radius: 50%;
    z-index: 3;
  }
  & .result__item--my-btn {
    position: absolute;
    top: 0;
    right: 0;
    color: #FFFFFF;
    font-size: 13px;
    background-color: #9d50b5;
    padding: 10px 13px;
    border-radius: 50%;
    z-index: 3;
  }
}
</style>

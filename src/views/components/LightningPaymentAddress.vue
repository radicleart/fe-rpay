<template>
<div>
  <div>
    <div title="Make Payment" v-if="payment">
      <div class="mb-1">
        <canvas ref="lndQrcode"></canvas>
      </div>
      <!-- <input v-show="false" class="input2" readonly="true" ref="paymentAddressBtc"  @click="copyAddress($event)" :value="paymentRequest" placeholder="Lightning invoice"/> -->
      <div class="ff-countdown mb-3 d-flex justify-content-center">
        <span class="mr-2">Code is valid for</span>
        <crypto-countdown class="" v-on="$listeners" />
      </div>
      <div class="d-flex justify-content-center">
        <a ref="myPaymentAddress" class="copyAddress" href="#" @click.prevent="copyAddress($event)" style="text-decoration: underline;">
          <span ref="myPaymentAddress" class="mr-2" :style="$globalLookAndFeel.text1Color">Copy the address</span>
        </a> <b-icon width="15px" height="15px" icon="file-earmark" :style="$globalLookAndFeel.text1Color"/>
      </div>
    </div>
    <div title="Open Channel" v-else>
      <div class="text-info scan-text" :style="$globalLookAndFeel.text1Color">
        For better connectivity you can open a lightning channel.
      </div>
      <div class="d-flex justify-content-center mb-3">
        <canvas ref="lndChannel"></canvas>
      </div>
      <div class="d-flex justify-content-center">
        <input class="input2" readonly="true" ref="paymentUriBtc"  @click.prevent="copyUri($event)" :value="channel" placeholder="Lightning channel"/>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import QRCode from 'qrcode'
import Vue from 'vue'
import { LSAT_CONSTANTS } from '@/lsat-constants'
import CryptoCountdown from '@/views/components/CryptoCountdown'

export default {
  name: 'LightningPaymentAddress2',
  components: {
    CryptoCountdown
  },
  props: ['value'],
  data () {
    return {
      showChannel: false,
      token: null,
      channel: null,
      peerAddress: null,
      payment: true
    }
  },
  beforeDestroy () {
    this.$store.dispatch('stopListening')
  },
  mounted () {
    Vue.nextTick(function () {
      this.addQrCode()
    }, this)
    this.peerAddress = '178.79.138.62:10011'
    if (location.href.indexOf('local') > -1) {
      this.peerAddress = '192.168.1.50:10011'
    }
  },
  methods: {
    addQrCode () {
      var element = this.$refs.lndQrcode
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      const paymentUri = invoice.data.uri
      QRCode.toCanvas(element, paymentUri, { errorCorrectionLevel: 'H' },
        function (error) {
          if (error) console.error(error)
          console.log('success!')
        })
    },
    addChannelQrCode () {
      var element = this.$refs.lndChannel
      this.channel = this.info.identityPubkey_ + '@' + this.peerAddress
      QRCode.toCanvas(
        element, this.channel, { errorCorrectionLevel: 'H' },
        function (error) {
          if (error) console.error(error)
          console.log('success!')
        })
    },
    copyAddress () {
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      var tempInput = document.createElement('input')
      // tempInput.style = 'position: absolute; left: -1000px; top: -1000px'
      tempInput.value = invoice.data.uri
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)
      // const flasher = document.getElementById('flash-me')
      const flasher = this.$refs.lndQrcode
      flasher.classList.add('flasher')
      setTimeout(function () {
        flasher.classList.remove('flasher')
      }, 1000)
      // copyText.select()
      // document.execCommand('copy')
    },
    copyUri () {
      var copyText = this.$refs.paymentUriBtc
      copyText.select()
      document.execCommand('copy')
      // this.$notify({ type: 'success', title: 'Copied Channel Uri', text: 'Copied the channel uri to clipboard: ' + copyText.value })
    }
  },
  computed: {
    paymentRequest () {
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      return invoice.data.uri
    },
    paymentAmountSat () {
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      return invoice.data.amount
    },
    paymentAmountBtc () {
      const invoice = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE]
      return invoice.data.amount / 100000000
    }
  }
}
</script>
<style >
.ff-countdown {
  position: relative;
  top: -5px;
  text-align: left;
  font-size: 10px;
  font-weight: 200;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.flasher {
  font-size: 16px;
  border: 2pt solid #FFCE00;
  border-radius: 10px;
}
.copyAddress {
  text-align: left;
  text-decoration: underline;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.copyAddress a {
  text-decoration: none;
}
canvas {
  max-width: 272px;
  max-height: 242px;
}
.input2 {
  width: 100%;
  background: #F5F5F5 0% 0% no-repeat padding-box;
  border-radius: 11px;
  opacity: 0.51;
  padding: 10px;
  border: none;
  margin-top: 10px;
}
.scan-text {
  text-align: left;
  font-size: 15px;
  font-weight: 300;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
  margin-top: 15px;
}
</style>

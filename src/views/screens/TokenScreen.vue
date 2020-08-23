<template>
<div>
  <order-info :lookAndFeel="lookAndFeel"/>
  <div v-if="preimage">
    <div ref="payload" class="d-flex justify-content-center mt-5">
      <span class="ff-confirmed">Your payment is confirmed.</span>
    </div>
    <div class="d-flex justify-content-center mt-3">
      <font-awesome-icon style="margin-top: 3px;padding: 3px; border-radius: 50%; border: 2pt solid #FFCE00; color: #FFCE00;" width="25px" height="25px" icon="check"/>
    </div>
    <div class="p-3 mt-5">
      <div class="d-flex justify-content-center mt-3"><a href="#" @click.prevent="reveal = !reveal" :style="lookAndFeel.text1Color">{{lookAndFeel.labels.successMsg}}</a></div>
        <div v-if="jokePayload">
          <div class="mt-3" v-for="(item, index) in payload()" :key="index">
            <div v-if="item && item">
              <div>{{item.tagline}}</div>
              <div class="mt-2 text-danger" v-if="reveal" :style="lookAndFeel.text1Color">{{item.punchline}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3 d-flex justify-content-center" :style="lookAndFeel.text2Color">
      <b-button @click="prev()" variant="danger" class="text-white button1 bg-danger">Start Over</b-button>
    </div>
    <div class="d-flex justify-content-center mt-5 mx-3" ref="payload">
      <a class="copyAddress" href="#" @click.prevent="copyAddress($event)" style="text-decoration: underline;">
        <span class="mr-2" :style="lookAndFeel.text1Color">Copy your receipt</span>
      </a> <font-awesome-icon width="15px" height="15px" icon="copy" :style="lookAndFeel.text1Color"/>
    </div>
  </div>
  <div v-else>
    <div class="my-5 d-flex justify-content-center" :style="lookAndFeel.text2Color">
      <b-button @click="prev()" variant="danger" class="text-white button1 bg-danger">Start Over</b-button>
    </div>
    <div class="d-flex justify-content-center mt-5">
      <span class="ff-confirmed" :style="lookAndFeel.text1Color">Payment has not been received.</span>
    </div>
    <!--
    <div class="d-flex justify-content-center mt-3">
      <font-awesome-icon style="margin-top: 3px;padding: 3px; border-radius: 50%; border: 2pt solid #FF7272; color: #FF7272;" width="25px" height="25px" icon="times"/>
    </div>
    -->
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'
import OrderInfo from '@/views/components/OrderInfo'

export default {
  name: 'TokenScreen',
  components: {
    OrderInfo
  },
  props: ['lookAndFeel'],
  data () {
    return {
      resource: null,
      reveal: false
    }
  },
  mounted () {
    this.$store.dispatch('tokenChallenge').then((resource) => {
      this.resource = resource
    }).catch((e) => {
      console.log(e)
    })
  },
  methods: {
    copyAddress () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      var tempInput = document.createElement('input')
      tempInput.style = 'position: absolute; left: -1000px; top: -1000px'
      tempInput.value = paymentChallenge.lsatInvoice.token
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)
      // const flasher = document.getElementById('flash-me')
      const flasher = this.$refs.payload
      flasher.classList.add('flasher')
      setTimeout(function () {
        flasher.classList.remove('flasher')
      }, 1000)
    },
    prev () {
      this.$emit('prev')
    },
    payload () {
      const payload = this.$store.getters[LSAT_CONSTANTS.KEY_PAYLOAD]
      if (payload && Array.isArray(payload)) {
        return payload
      }
      const jokes = []
      jokes.push({ tagline: 'What is black, white and red all over?', punchline: 'A newspaper' })
      jokes.push({ tagline: 'What is brown and sticky', punchline: 'A stick' })
      return jokes
    }
  },
  computed: {
    token () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge) ? paymentChallenge.lsatInvoice.token : null
    },
    preimage () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge) ? paymentChallenge.lsatInvoice.preimage : null
    },
    jokePayload () {
      const configuration = this.$store.getters[LSAT_CONSTANTS.KEY_CONFIGURATION]
      if (configuration.apiKey) {
        return configuration.apiKey === 'risidio-1'
      }
      return false
    }
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/customv2.scss";
.flasher {
  font-size: 16px;
  border: 2pt solid $warning;
  border-radius: 10px;
}
.ff-confirmed {
  font-weight: 200;
  font-size: 11px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
</style>

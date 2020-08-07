<template>
<div>
  <order-info/>
  <div v-if="preimage">
    <div class="d-flex justify-content-center mt-5">
      <span class="ff-confirmed">Your payment is confirmed.</span>
    </div>
    <div class="d-flex justify-content-center mt-3">
      <font-awesome-icon style="margin-top: 3px;padding: 3px; border-radius: 50%; border: 2pt solid #FFCE00; color: #FFCE00;" width="25px" height="25px" icon="check"/>
    </div>
    <div class="mt-5">
      <div><a href="#" @click.prevent="reveal = !reveal">reveal punchlines</a></div>
      <div class="mt-3" v-for="(item, index) in payload" :key="index">
        <div>{{item.tagline}}</div>
        <div class="mt-2 text-danger" v-if="reveal">{{item.punchline}}</div>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="d-flex justify-content-center mt-5">
      <span class="ff-confirmed">Your payment is not confirmed.</span>
    </div>
    <div class="d-flex justify-content-center mt-3">
      <font-awesome-icon style="margin-top: 3px;padding: 3px; border-radius: 50%; border: 2pt solid #FF7272; color: #FF7272;" width="25px" height="25px" icon="times"/>
    </div>
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
  props: ['messages'],
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
  },
  computed: {
    token () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge) ? paymentChallenge.lsatInvoice.token : null
    },
    payload () {
      const payload = this.$store.getters[LSAT_CONSTANTS.KEY_PAYLOAD]
      return payload
    },
    preimage () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return (paymentChallenge) ? paymentChallenge.lsatInvoice.preimage : null
    },
    lsatToken () {
      const lsatToken = this.$store.getters[LSAT_CONSTANTS.KEY_LSAT_OBJECT]
      return lsatToken
    }
  }
}
</script>
<style lang="scss">
ff-confirmed {
  font-weight: 200;
  font-size: 11px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
</style>

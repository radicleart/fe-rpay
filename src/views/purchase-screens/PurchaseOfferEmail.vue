<template>
<div>
  <b-row>
    <b-col cols="12">
      <h1>Send Offer</h1>
    </b-col>
  </b-row>
  <b-row class="row mt-5">
    <b-col align-v="stretch" cols="4">
      <h1>Send with wallet</h1>
      <p class="text-small text-bold">Offers close {{offerData.biddingEndTime}}</p>
      <p>By far the best way to send your offer is with the Stacks wallet.
        NFTs are digital property and your Stacks wallet
        is the set of keys to the house where your digital property lives</p>
        <p>It's an
        independent peice of kit that installs in the browser. Once you've
        installed it you'll find more and more sites will want to use it.
      </p>
      <p>By the way - we just need an email to contact you about this offer -
        we will never use it for anything else.
      </p>
      <p><a href="#" @click.prevent="back()"><b-icon icon="chevron-left"/> Back</a>
      </p>
    </b-col>
    <b-col cols="8">
      <b-row align-v="stretch" class="row mt-5" style="height: 70%;">
        <b-col align-self="start" cols="12">
          <div class="d-flex justify-content-between">
            <div>Confirm Interest</div>
            <div>Your Offer <span class="text-dark">{{offerData.offerAmount}} STX</span></div>
          </div>
          <div class="mb-3" role="group">
            <b-form-input
              id="email"
              v-model="email"
              :state="validEmail"
              aria-describedby="email-help email-feedback"
              placeholder="Enter email address"
              trim
            ></b-form-input>
            <p class="text-small text-danger" v-html="errorMessage"></p>
          </div>
        </b-col>
        <b-col cols="12" align-self="end">
          <div class="d-flex justify-content-end">
              <!-- <b-button variant="light" style="width: 200px;" class="mr-1 square-btn" @click.prevent="next()">CONFIRM VIA EMAIL</b-button> -->
              <b-button style="width: 200px;" class="ml-1 square-btn" @click.prevent="makeOffer()">CONFIRM</b-button>
          </div>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</div>
</template>

<script>

export default {
  name: 'PurchaseOfferEmail',
  components: {
  },
  props: ['offerData'],
  data () {
    return {
      email: null,
      errorMessage: null
    }
  },
  methods: {
    isValid: function () {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(this.email)
    },
    back: function () {
      this.$emit('backStep')
    },
    makeOffer: function () {
      this.errorMessage = null
      if (!this.isValid()) {
        this.errorMessage = 'Please enter an email where we can reach with news about your offer.'
        return
      }
      this.$emit('makeOffer', { email: this.email })
    }
  },
  computed: {
    validEmail () {
      return this.email && this.isValid()
    },
    updateMessage () {
      return ''
    }
  }
}
</script>
<style lang="scss" >
</style>

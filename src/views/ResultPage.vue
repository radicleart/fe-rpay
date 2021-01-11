<template>
<b-card-group :style="cardStyle">
  <b-card header-tag="header" footer-tag="footer" v-if="$globalLookAndFeel" :style="background">
    <template v-slot:header v-if="$globalLookAndFeel.labels">
      <h1 class="mb-2">{{$globalLookAndFeel.labels.title}}</h1>
      <h2 class="mb-0">{{$globalLookAndFeel.labels.subtitle}}</h2>
    </template>
    <b-card-text class="d-flex justify-content-center" v-if="result && result.opcode && result.opcode.startsWith('eth-')">
      <p v-html="result.message"></p>
      <p v-if="result.opcode === 'eth-payment-confirmed'"><a :href="etherScanUrl">view transaction on etherscan.</a></p>
    </b-card-text>
    <template v-slot:footer>
      <div class="text-center d-flex justify-content-end">
        <button class="">Back</button>
      </div>
    </template>
  </b-card>
  <b-card header-tag="header" footer-tag="footer" v-else>
    <b-card-text class="d-flex justify-content-center" v-if="result && result.opcode && result.opcode.startsWith('eth-')">
      <p v-html="result.message"></p>
      <p v-if="result.opcode === 'eth-payment-confirmed'"><a :href="etherScanUrl">view transaction on etherscan.</a></p>
    </b-card-text>
    <template v-slot:footer>
      <div class="text-center d-flex justify-content-end">
        <button class="">Back</button>
      </div>
    </template>
  </b-card>
</b-card-group>
</template>

<script>
const EXPLORER = process.env.VUE_APP_ETHERSCAN

export default {
  name: 'ResultPage',
  components: {
  },
  props: ['result'],
  data () {
    return {
    }
  },
  mounted () {
  },
  methods: {
  },
  computed: {
    etherScanUrl () {
      return EXPLORER + '/tx/' + this.result.txid
    },
    cardStyle () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.cardStyle : ''
    },
    background () {
      return (this.$globalLookAndFeel) ? this.$globalLookAndFeel.background : ''
    }
  }
}
</script>
<style lang="scss">
</style>

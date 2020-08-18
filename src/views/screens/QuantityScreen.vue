<template>
<div>
  <div class="w-75 purpose border-bottom pb-3 mb-3" :style="lookAndFeel.text1Color" v-html="lookAndFeel.labels.orderMsg"></div>
  <crypto-stepper :key="componentKey" :paymentOption="paymentOption" :lookAndFeel="lookAndFeel" />
  <div class="text-center my-4 d-flex justify-content-center">
    <button class="place-order" @click="placeOrder">
      <span class="place-order-text" :style="lookAndFeel.text3Color">
        Place your order
        <font-awesome-icon class="ml-5" width="15px" height="15px" icon="qrcode" :style="lookAndFeel.text3Color"/>
      </span>
    </button>
  </div>
  <!-- <crypto-picker :labels="lookAndFeel.labels" :paymentOption="paymentOption" @updatePaymentOption="updatePaymentOption" /> -->
  <div class="mx-auto w-75" :style="lookAndFeel.text1Color">{{lookAndFeel.labels.networkMsg}}</div>
</div>
</template>

<script>
import CryptoStepper from '@/views/components/CryptoStepper'

export default {
  name: 'QuantityScreen',
  components: {
    CryptoStepper
  },
  props: ['lookAndFeel'],
  data () {
    return {
      value: 0,
      componentKey: 0,
      numbCredits: 2,
      message: null,
      paymentOption: null,
      resizeTimer: null,
      loading: true
    }
  },
  methods: {
    placeOrder () {
      this.$emit('placeOrder')
    }
  },
  computed: {
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/customv2.scss";
.place-order {
  width: 191px;
  height: 51px;
  background: $warning 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029;
  border-radius: 10px;
  opacity: 1;
}
.place-order-text {
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
.purpose {
  text-align: left;
  font-weight: 200;
  font-size: 10px;
  letter-spacing: 0px;
  color: #000000;
  opacity: 1;
}
</style>

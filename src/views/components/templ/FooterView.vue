<template>
<div>
  <b-form-input disabled id="range-2" v-model="rangeValue" type="range" min="0" max="2" step="1"></b-form-input>
  <div class="d-flex justify-content-between" style="font-size: 8px;">
    <div class="" @click="skipAhead(0)">Place Order</div>
    <div class="" @click="skipAhead(1)">Scan with Wallet</div>
    <div class="" @click="skipAhead(2)">Receive Goods</div>
  </div>
</div>
</template>

<script>
export default {
  name: 'FooterView',
  components: {
  },
  props: ['messages', 'rangeValue'],
  data () {
    return {
      intValue: 0
    }
  },
  methods: {
    skipAhead (screen) {
      this.$emit('rangeEvent', screen)
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" >
@import "@/assets/scss/customv2.scss";

input[type=range] {
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
}

input[type=range]:focus {
  outline: none; /* Removes the blue border. You should probably do some kind of focus styling for accessibility reasons though. */
}

input[type=range]::-ms-track {
  width: 100%;
  cursor: pointer;

  /* Hides the slider so custom styles can be added */
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  background: #ccc;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4.2px;
  cursor: pointer;
  box-shadow: 1px 1px 1px #ccc, 0px 0px 1px #0d0d0d;
  background: #ccc;
  border-radius: 1.3px;
  border: 0.2px solid #ccc;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: 1px solid #000000;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  margin-top: -7px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d; /* Add cool effects to your sliders! */
}
</style>

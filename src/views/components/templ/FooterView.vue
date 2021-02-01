<template>
<div class="footer-container">
  <b-form-input disabled id="range-2" v-model="rangeValue" type="range" min="100" max="104" step="2"></b-form-input>
  <div  :style="$globalLookAndFeel.text1Color" class="d-flex justify-content-between" style="font-size: 11px;">
    <div class="click-effect" @click="skipAhead(100)">Place Order</div>
    <div class="click-effect" @click="skipAhead(102)">Scan with Wallet</div>
    <div class="click-effect" @click="skipAhead(104)">Receive Goods</div>
  </div>
</div>
</template>

<script>
export default {
  name: 'FooterView',
  components: {
  },
  props: ['rangeValue'],
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
<style lang="scss" scoped>

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
  cursor: default;

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
  background: #ccc;
  border-radius: 1.3px;
  border: 0.2px solid #ccc;
}
.footer-container input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  cursor: default;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background-color: orange;
  margin-top: -7px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
}
.click-effect {
  cursor: pointer;
}
</style>

<template>
<div class="footer-container">
  <b-form-input disabled id="range-2" :value="rangeValue" type="range" min="0" max="2" step="1"></b-form-input>
  <div class="d-flex justify-content-between" style="font-size: 11px;">
    <div :class="(displayCard === 100) ? 'text-bold' : 'text-300'" class="click-effect" @click="skipAhead(0)">Select Amount</div>
    <div :class="(displayCard === 102) ? 'text-bold' : 'text-300'" class="click-effect" @click="skipAhead(1)">Make Payment</div>
    <div :class="(displayCard === 104) ? 'text-bold' : 'text-300'" class="click-effect" @click="skipAhead(2)">Confirmation</div>
  </div>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'FooterView',
  components: {
  },
  data () {
    return {
    }
  },
  methods: {
    skipAhead (screen) {
      let disp = 100
      if (screen === 1) disp = 102
      else if (screen === 2) disp = 104
      this.$emit('rangeEvent', disp)
    },
    isSelected () {
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      if (this.rangeValue === 0 && displayCard === 100) return true
      else if (this.rangeValue === 1 && displayCard === 102) return true
      else if (this.rangeValue === 2 && displayCard === 104) return true
      return false
    }
  },
  computed: {
    displayCard () {
      const displayCard = this.$store.getters[APP_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
    },
    rangeValue () {
      const displayCard = this.displayCard
      if (displayCard === 100) return 0
      else if (displayCard === 102) return 1
      else return 2
    }
  }
}
</script>
<style lang="scss" >

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

.click-effect {
  cursor: pointer;
}
</style>

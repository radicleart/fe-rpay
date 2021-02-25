<template>
<div class="footer-container">
  <div>
    <div class="d-flex justify-content between">
      <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant3" @click.prevent="saveData()">Back</b-button>
      <b-button class="round-btn mx-1" :variant="$globalLookAndFeel.variant0" @click.prevent="mintToken()">Mint</b-button>
    </div>
  </div>
</div>
</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'FooterMintView',
  components: {
  },
  props: ['rangeValue'],
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
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      if (this.rangeValue === 0 && displayCard === 100) return true
      else if (this.rangeValue === 1 && displayCard === 102) return true
      else if (this.rangeValue === 2 && displayCard === 104) return true
      return false
    }
  },
  computed: {
    displayCard () {
      const displayCard = this.$store.getters[LSAT_CONSTANTS.KEY_DISPLAY_CARD]
      return displayCard
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
.footer-container input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  cursor: default;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background-color: #ffd54f;
  margin-top: -7px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
}
.click-effect {
  cursor: pointer;
}
</style>

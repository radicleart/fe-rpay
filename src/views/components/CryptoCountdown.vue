<template>
    <div v-if="expired" class="">
      Timeout - <a href="#" @click.prevent="evPaymentExpired">please start again</a>
    </div>
    <div v-else>
      <div class="">
        {{currentCountdown}}
      </div>
      <div v-if="showExpires">Expires {{expires()}}</div>
    </div>
</template>

<script>
import moment from 'moment'
import { LSAT_CONSTANTS } from '@/lsat-constants'

// noinspection JSUnusedGlobalSymbols
export default {
  name: 'CryptoCountdown',
  components: {
  },
  data () {
    return {
      countdown: null,
      showExpires: false,
      expired: false,
      timeout: this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE_EXPIRY] // { hours: 0, minutes: 1, seconds: 0 }
    }
  },
  mounted () {
    this.timeout = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE_DURATION]
    this.expired = this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE_EXPIRED]
    if (this.expired) {
      this.$emit('evPaymentExpired')
    }
    this.startCountdown()
  },
  computed: {
    currentCountdown () {
      if (!this.countdown && this.timeout) {
        var hrs = this.timeout.hours
        var min = this.timeout.minutes
        var sec = this.timeout.seconds
        if (hrs < 10 && hrs.length !== 2) hrs = '0' + hrs
        if (min < 10 && min.length !== 2) min = '0' + min
        if (sec < 10 && sec.length !== 2) sec = '0' + sec
        if (this.timeout.hours > 0) {
          return hrs + ':' + min + ':' + sec
        } else {
          return min + ':' + sec
        }
      } else {
        return this.countdown
      }
    }
  },
  methods: {
    expires () {
      return this.$store.getters[LSAT_CONSTANTS.KEY_INVOICE_EXPIRES]
    },
    clockReset () {
      this.$store.dispatch('fetchRates')
      this.expired = true
      this.$emit('evPaymentExpired')
    },
    startCountdown () {
      var duration = moment.duration(this.timeout)
      var interval = 1
      const $self = this
      const timer = setInterval(function () {
        duration = moment.duration(duration.asSeconds() - interval, 'seconds')
        var min = duration.minutes()
        var sec = duration.seconds()
        sec -= 1
        if (min < 0) return clearInterval(timer)
        if (min < 10 && min.length !== 2) min = '0' + min
        if (sec < 0 && min !== 0) {
          min -= 1
          sec = 59
        } else if (sec < 10 && sec.length !== 2) {
          sec = '0' + sec
        }
        $self.countdown = min + ':' + sec
        if (min <= 0 && sec <= 0) {
          $self.clockReset()
          // $self.timeout.seconds += 2
          duration = moment.duration($self.timeout)
        }
      }, 1000)
    },
    evPaymentExpired () {
      this.$emit('evPaymentExpired')
    }
  }
}
</script>
<style scoped>
.tab-content {
  padding-top: 0px;
}
</style>

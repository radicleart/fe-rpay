<template>
<div v-if="loaded" id="rpay-pay-card">
  <div class="" v-if="!page" >
    loading
  </div>
  <div class="" v-else-if="page === 'result'" >
    <result-page/>
  </div>
  <div v-else>
    <framework-flow/>
  </div>
</div>
</template>

<script>
import Vue from 'vue'
import FrameworkFlow from './views/FrameworkFlow'
import ResultPage from './views/ResultPage'
import rpayStore from './store/rpayStore'
import rpayEthereumStore from './store/rpayEthereumStore'
import rpayStacksStore from './store/rpayStacksStore'

export default {
  name: 'RisidioPay',
  components: {
    FrameworkFlow,
    ResultPage
  },
  props: ['configuration'],
  data () {
    return {
      page: null,
      loaded: false,
      message: 'Loading invoice data - please wait...'
    }
  },
  mounted () {
    this.$store.registerModule('rpayEthereumStore', rpayEthereumStore)
    this.$store.registerModule('rpayStacksStore', rpayStacksStore)
    this.$store.registerModule('rpayStore', rpayStore)

    let myConfig = this.configuration
    if (!myConfig) {
      myConfig = this.parseConfiguration()
    }
    const lf = (myConfig.lookAndFeel) ? myConfig.lookAndFeel : this.defLF()
    // if (window.innerWidth < 500) {
    //  lf.background['background-image'] = null
    // }
    Vue.prototype.$globalLookAndFeel = lf
    this.$store.commit('rpayStore/addConfiguration', myConfig)
    this.$store.dispatch('rpayStore/initialiseApp', myConfig).then((invoice) => {
      if (invoice.data && (invoice.data.status === 'paid' || invoice.data.status === 'processing')) {
        this.page = 'result'
      } else {
        this.page = 'payment-page'
      }
      this.loaded = true
    })
  },
  beforeDestroy () {
    this.$store.dispatch('rpayStore/stopListening')
  },
  methods: {
    parseConfiguration: function () {
      let paymentConfig = {}
      if (typeof this.paymentConfig === 'object') {
        paymentConfig = this.paymentConfig
      } else {
        try {
          paymentConfig = JSON.parse(this.paymentConfig)
        } catch {
          paymentConfig = JSON.parse(window.risidioPaymentConfig)
        }
      }
      return paymentConfig
    },
    defLF: function () {
      return {
        labels: {
          orderMsg: 'Place order for \'STX to Lightning\' select number required and pay.',
          successMsg: 'Your order has been received with thanks.',
          title: 'The People\'s',
          subtitle: 'Republic of Movies',
          card1Label: 'Select amount to send',
          card2Label1: 'How many STX tokens do you need?',
          card2Label2: 'Select operation',
          card2Label3: 'Make Payment',
          card2Label4: 'Open Channel',
          button1Label: 'Back',
          button2Label: 'Next',
          quantityLabel: 'Tokens'
        },
        sections: {
        },
        cardStyle: {
        },
        text1Color: {
        },
        text2Color: {
        },
        text3Color: {
        }
      }
    }
  },
  computed: {
  }
}
</script>
<style lang="scss" scoped>
</style>

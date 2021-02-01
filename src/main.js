import Vue from 'vue'
import RPayEntry from './RPayEntry.vue'
import store from './store'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import '@/assets/mysqpaymentform.css'
// import Notifications from 'vue-notification'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
// Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.config.productionTip = false

window.eventBus = new Vue()

new Vue({
  store,
  render: h => h(RPayEntry),
  created: function () {
    const configuration = this.parseConfiguration()
    const lf = (configuration.lookAndFeel) ? configuration.lookAndFeel : this.defLF()
    if (window.innerWidth < 500) {
      lf.background['background-image'] = null
    }
    Vue.prototype.$globalLookAndFeel = lf
    this.$store.commit('addConfiguration', configuration)
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
          stepper: true
        },
        cardStyle: {
          margin: '20px',
          'min-width': '40vw',
          'border-radius': '20px'
        },
        text1Color: {
          color: '#000'
        },
        text2Color: {
          color: '#0277bd'
        },
        text3Color: {
          color: '#fff'
        },
        background: {
          'min-height': '91vh',
          'max-height': '91vh',
          'min-width': '47vw',
          'max-width': '97vw',
          'background-repeat': 'no-repeat',
          '-webkit-background-size': 'contain',
          '-moz-background-size': 'contain',
          '-o-background-size': 'contain',
          'background-size': 'contain',
          'background-image': 'url("https://trpay.risidio.com/img/payment-bg2.png")'
        }
      }
    }
  }
}).$mount('#rpay-entry')

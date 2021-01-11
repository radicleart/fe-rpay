import Vue from 'vue'
import RPayEntry from './RPayEntry.vue'
import store from './store'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
import '@/assets/scss/custom.scss'
// import '@/assets/mysqpaymentform.css'
import Notifications from 'vue-notification'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.config.productionTip = false

window.eventBus = new Vue()

new Vue({
  store,
  render: h => h(RPayEntry),
  created: function () {
    const configuration = this.parseConfiguration()
    const lf = (configuration.lookAndFeel) ? configuration.lookAndFeel : this.defLF()
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
          margin: '0',
          'border-radius': '20px'
        },
        text1Color: {
          color: '#000'
        },
        text2Color: {
          color: '#F9B807'
        },
        text3Color: {
          color: '#fff'
        },
        background: {
          padding: '0px 0 0 0',
          height: 'auto',
          'max-width': '500px',
          position: 'relative',
          top: '0px',
          'background-repeat': 'no-repeat',
          'background-position': 'center center',
          '-webkit-background-size': 'cover',
          '-moz-background-size': 'cover',
          '-o-background-size': 'cover',
          'background-size': 'cover',
          'background-color': '#fff',
          // 'background-image': 'url("https://images.prismic.io/risidio-journal/59455bcb-a954-4713-9afd-cfe6130f0b26_Group+994.svg?auto=compress,format")',
          opacity: 1
        }
      }
    }
  }
}).$mount('#rpay-entry')

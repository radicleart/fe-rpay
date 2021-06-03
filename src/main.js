import Vue from 'vue'
import RisidioPay from './RisidioPay.vue'
import store from './store/mainStore'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import '@/assets/mysqpaymentform.css'
// import Notifications from 'vue-notification'
// Import the plugin here

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
// Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.config.productionTip = false
new Vue({
  store,
  render: h => h(RisidioPay),
  methods: {
  }
}).$mount('#risidio-pay')

import Vue from 'vue'
import RisidioPay from './RisidioPay.vue'
import store from './store/mainStore'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import router from './router'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import '@/assets/mysqpaymentform.css'
// import Notifications from 'vue-notification'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
// Vue.use(Notifications, { closeOnClick: true, duration: 6000 })
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(RisidioPay),
  methods: {
  }
}).$mount('#risidio-pay')

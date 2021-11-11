import Vue from 'vue'
import store from './store/mainStore'
import RisidioPay from './RisidioPay'
// const RisidioPay = () => import('risidio-pay')

Vue.config.productionTip = false
new Vue({
  store,
  render: h => h(RisidioPay),
  methods: {
  }
}).$mount('#risidio-pay')

import Vue from 'vue'
import RisidioPay from './RisidioPay.vue'
import store from './store/mainStore'

Vue.config.productionTip = false
new Vue({
  store,
  render: h => h(RisidioPay),
  methods: {
  }
}).$mount('#risidio-pay')

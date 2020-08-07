import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'
import RPayEntry from './RPayEntry'
import BootstrapVue from 'bootstrap-vue'
import './assets/scss/customv2.scss'
import Notifications from 'vue-notification'

const CustomElement = wrap(Vue, RPayEntry)
window.customElements.define('rpay-entry', CustomElement)
Vue.use(BootstrapVue)
Vue.use(Notifications)

import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'
import RPayEntry from './RPayEntry'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import './assets/scss/customv2.scss'
import Notifications from 'vue-notification'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(Notifications)
const CustomElement = wrap(Vue, RPayEntry)
window.customElements.define('rpay-entry', CustomElement)

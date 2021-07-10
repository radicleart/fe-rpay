/**
 * The auth store represents the state of the (session scoped) user in the Vue
 * application. This includes logged in state, profile and other state pertaining
 * directly to the user.
 */
import axios from 'axios'
import { APP_CONSTANTS } from '@/app-constants'

const isSuperAdmin = function (resolve, rootGetters) {
  const profile = rootGetters['rpayAuthStore/getMyProfile']
  if (!profile.superAdmin) {
    resolve(null)
    return false
  }
  return true
}

const rpayPrivilegeStore = {
  namespaced: true,
  state: {
    authorisations: []
  },
  getters: {
    getAuthorisation: state => stxAddress => {
      const index = state.authorisations.findIndex((o) => o.stxAddress === stxAddress)
      const priv = state.authorisations[index]
      return priv
    },
    getAuthorisations: state => {
      return state.authorisations
    }
  },
  mutations: {
    setAuthorisation (state, authorisation) {
      if (!authorisation) return
      const index = state.authorisations.findIndex((o) => o.stxAddress === authorisation.stxAddress)
      if (index > -1) {
        state.authorisations.splice(index, 1, authorisation)
      } else {
        state.authorisations.splice(0, 0, authorisation)
      }
    },
    setAuthorisations (state, authorisations) {
      state.authorisations = authorisations
    }

  },
  actions: {
    fetchAuthorisations ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        if (!isSuperAdmin(resolve, rootGetters)) return
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/auth/getAuthorisations', authHeaders).then((result) => {
          commit('setAuthorisations', result.data)
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    fetchAuthorisation ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        // axios.get('http://localhost:8046/mesh/v2/auth/getAuthorisation/' + data.stxAddress, authHeaders).then((result) => {
        axios.get(configuration.risidioBaseApi + '/mesh/v2/auth/getAuthorisation/' + data.stxAddress, authHeaders).then((result) => {
          commit('setAuthorisation', result.data)
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    saveAuthorisation ({ commit, rootGetters }, authorisation) {
      return new Promise((resolve, reject) => {
        if (!isSuperAdmin(resolve, rootGetters)) return
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        // axios.get('http://localhost:8046/mesh/v2/auth/getAuthorisation/' + data.stxAddress, authHeaders).then((result) => {
        axios.post(configuration.risidioBaseApi + '/mesh/v2/secure/auth/authorise', authorisation, authHeaders).then((result) => {
          commit('setAuthorisation', result.data)
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    isAuthorised ({ rootGetters }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/auth/isAuthorised/' + data.stxAddress + '/' + data.domain + '/' + data.privilege, authHeaders).then((result) => {
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    }
  }
}
export default rpayPrivilegeStore

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
    authorisations: [],
    availablePrivileges: []
  },
  getters: {
    getAvailablePrivileges: state => {
      return state.availablePrivileges
    },
    hasPrivilege: (state, getters, rootState, rootGetters) => priv => {
      const profile = rootGetters[APP_CONSTANTS.KEY_PROFILE]
      if (profile.authorisation && profile.authorisation.stxAddress === profile.stxAddress) {
        if (profile.authorisation.domains) {
          const domain = profile.authorisation.domains.find((o) => o.host === location.hostname)
          if (domain) {
            const index = domain.privileges.findIndex((o) => o === priv)
            return index > -1
          }
        }
      }
      return false
    },
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
    },
    setAvailablePrivileges (state, availablePrivileges) {
      state.availablePrivileges = availablePrivileges
    }
  },
  actions: {
    fetchAvailablePrivileges ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        if (!isSuperAdmin(resolve, rootGetters)) return
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.get(configuration.risidioBaseApi + '/mesh/v2/auth/getPrivileges', authHeaders).then((result) => {
          commit('setAvailablePrivileges', result.data)
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable fetchAvailablePrivileges: ' + error))
        })
      })
    },
    fetchPrivilegesForAllUsers ({ commit, rootGetters }) {
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
    fetchUserAuthorisation ({ commit, rootGetters }, data) {
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
        axios.post(configuration.risidioBaseApi + '/mesh/v2/auth/authorise', authorisation, authHeaders).then((result) => {
          commit('setAuthorisation', result.data)
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    addPrivilege ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        if (!isSuperAdmin(resolve, rootGetters)) return
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(configuration.risidioBaseApi + '/mesh/v2/auth/add/' + data.stxAddress + '/' + data.privilege + '/' + location.hostname, authHeaders).then((result) => {
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    removePrivilege ({ commit, rootGetters }, data) {
      return new Promise((resolve, reject) => {
        if (!isSuperAdmin(resolve, rootGetters)) return
        const configuration = rootGetters['rpayStore/getConfiguration']
        const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
        axios.post(configuration.risidioBaseApi + '/mesh/v2/auth/remove/' + data.stxAddress + '/' + data.privilege + '/' + location.hostname, authHeaders).then((result) => {
          resolve(result.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    fetchHasPrivilege ({ rootGetters }, data) {
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

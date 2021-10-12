import axios from 'axios'

const rpayProfileStore = {
  namespaced: true,
  state: {
    profiles: []
  },
  getters: {
    getProfiles: (state) => {
      return state.profiles
    },
    getProfile: (state) => stxAddress => {
      const index = state.profiles.findIndex((o) => o.stxAddress === stxAddress)
      if (index > -1) {
        return state.profiles[index]
      }
    }
  },
  mutations: {
    setProfile (state, profile) {
      const index = state.profiles.findIndex((o) => o.stxAddress === profile.stxAddress)
      if (index > -1) {
        state.profiles.splice(index, 1, profile)
      } else {
        state.profiles.splice(0, 0, profile)
      }
    },
    setProfiles (state, profiles) {
      state.profiles = profiles
    }
  },
  actions: {
    fetchProfile ({ commit, rootGetters }, stxAddress) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/profile/' + stxAddress).then((response) => {
          commit('setProfile', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch profile: ' + error))
        })
      })
    },
    saveProfile ({ rootGetters, commit }, data) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/profile', data).then((response) => {
          const profile = response.data
          commit('setProfile', profile)
          resolve(profile)
        }).catch(() => {
          resolve(null)
        })
      })
    }
  }
}
export default rpayProfileStore

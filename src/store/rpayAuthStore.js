/**
 * The auth store represents the state of the (session scoped) user in the Vue
 * application. This includes logged in state, profile and other state pertaining
 * directly to the user.
 */
import { AppConfig, UserSession, authenticate, showConnect } from '@stacks/connect'

const origin = window.location.origin
const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const NETWORK = process.env.VUE_APP_NETWORK
const BLOCKSTACK_LOGIN = Number(process.env.VUE_APP_BLOCKSTACK_LOGIN)
const getProfile = function () {
  let myProfile = {}
  try {
    const account = userSession.loadUserData()
    if (account) {
      const uname = account.username
      let name = account.profile.name
      if (uname && !name) {
        name = uname.substring(0, uname.indexOf('.'))
      }
      const isAdmin =
        uname === 'mike.personal.id' ||
        // celine
        account.identityAddress.indexOf('1FwYY6Xjp2xDBn62WvTvX9LY6PH2EvQSJ1') > -1 ||
        uname.indexOf('1FwYY6Xjp2xDBn62WvTvX9LY6PH2EvQSJ1') > -1 ||
        uname.indexOf('radicle') > -1 ||
        uname.indexOf('mijoco') > -1
      myProfile = {
        loggedIn: true,
        stxAddress: (NETWORK === 'mainnet') ? account.profile.stxAddress.mainnet : account.profile.stxAddress.testnet,
        superAdmin: isAdmin,
        name: name,
        description: account.profile.description,
        avatarUrl: account.profile.avatarUrl,
        username: account.username
      }
    }
    return myProfile
  } catch (err) {
    return myProfile
  }
}

const rpayAuthStore = {
  namespaced: true,
  state: {
    myProfile: {
      username: null,
      loggedIn: false,
      showAdmin: false,
      userData: null,
      authResponse: null,
      appPrivateKey: null
    },
    session: null,
    appName: 'Risidio Music NFTs',
    appLogo: '/img/sticksnstones_logo.8217b8f7.png'
  },
  getters: {
    getMyProfile: state => {
      if (!state.myProfile) {
        return {
          loggedIn: false
        }
      }
      return state.myProfile
    }
  },
  mutations: {
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    setAuthResponse (state, session) {
      state.session = session
    }
  },
  actions: {
    fetchMyAccount ({ commit }) {
      return new Promise(resolve => {
        if (userSession.isUserSignedIn()) {
          const profile = getProfile()
          commit('myProfile', profile)
          resolve(profile)
        } else if (userSession.isSignInPending()) {
          userSession.handlePendingSignIn().then(() => {
            const profile = getProfile()
            commit('myProfile', profile)
            resolve(profile)
          })
        } else {
          const profile = getProfile()
          commit('myProfile', profile)
          resolve(profile)
        }
      })
    },
    startLogin ({ state, commit }) {
      return new Promise((resolve) => {
        const authOptions = {
          sendToSignIn: false,
          userSession: userSession,
          redirectTo: '/create',
          manifestPath: '/manifest.json',
          finished: ({ userSession, authResponse }) => {
            window.eventBus.$emit('rpayEvent', { opcode: 'configured-logged-in', session: userSession })
            const userData = userSession.loadUserData()
            state.appPrivateKey = userSession.loadUserData().appPrivateKey
            state.authResponse = authResponse
            state.userData = userData
            commit('myProfile', getProfile())
            resolve(getProfile())
            location.assign('/')
          },
          appDetails: {
            name: 'Risidio #1 in NFTs',
            icon: origin + '/img/logo/logo.png'
          }
        }
        if (BLOCKSTACK_LOGIN === 1) {
          showConnect(authOptions)
        } else {
          authenticate(authOptions)
        }
      })
    },
    startLogout ({ state, commit }) {
      return new Promise((resolve) => {
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut()
          state.userData = null
          commit('myProfile', getProfile())
        }
        resolve(getProfile())
      })
    }
  }
}
export default rpayAuthStore

import { AppConfig, UserSession, showConnect, authenticate, openSTXTransfer } from '@stacks/connect'
import { StacksMainnet, StacksTestnet } from '@stacks/network'
import store from '@/store'

const NETWORK = process.env.VUE_APP_NETWORK
const BLOCKSTACK_LOGIN = 1
const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

let network = new StacksTestnet()
if (NETWORK === 'mainnet') {
  network = new StacksMainnet()
}

const authFinished = function (o) {
  store.commit('stacksStore/setAuthResponse', o)
  store.dispatch('stacksStore/fetchMyAccount')
}
const authOptions = {
  sendToSignIn: false,
  redirectTo: '/',
  manifestPath: '/manifest.json',
  finished: authFinished,
  appDetails: {
    name: 'Risidio Auctions',
    icon: origin + '/img/logo/risidio_black.svg'
  }
}

const getProfile = function () {
  let myProfile = {
    loggedIn: false
  }
  try {
    const account = userSession.loadUserData()
    if (account) {
      let uname = account.username
      let name = account.profile.name
      if (uname) {
        if (!name) {
          const indexOfDot = uname.indexOf('.')
          name = uname.substring(0, indexOfDot)
        }
      }
      if (!uname && name) {
        uname = name
      }
      if (!uname) {
        uname = ''
      }
      const showAdmin =
        uname === 'mike.personal.id' ||
        uname.indexOf('brightblock') > -1 ||
        uname.indexOf('risidio') > -1 ||
        uname.indexOf('radicle') > -1 ||
        uname.indexOf('mijoco') > -1 ||
        uname.indexOf('head') > -1 ||
        uname.indexOf('testuser0934583') > -1 ||
        uname.indexOf('feek') > -1
      const avatarUrl = account.profile.avatarUrl
      // let privateKey = account.appPrivateKey + '01'
      // privateKey = hexStringToECPair(privateKey).toWIF()
      // const authResponseToken = account.authResponseToken
      // var decodedToken = decodeToken(authResponseToken)
      // const publicKey = getAddressFromPrivateKey(id.privateKey.data.toString('hex'))
      const loggedIn = true
      myProfile = {
        loggedIn: loggedIn,
        stxAddress: account.profile.stxAddress,
        senderKey: account.privateKey,
        showAdmin: showAdmin,
        superAdmin: uname === 'radicle_art.id.blockstack',
        name: name,
        description: account.profile.description,
        avatarUrl: avatarUrl,
        username: uname,
        hubUrl: account.hubUrl,
        apps: account.profile.apps
      }
    }
    return myProfile
  } catch (err) {
    return myProfile
  }
}

const stacksStore = {
  namespaced: true,
  state: {
    authResponse: null,
    myProfile: null,
    appName: 'Risidio Crowdfund',
    appLogo: '/img/logo/Risidio_logo_256x256.png'
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
    setAuthResponse (state, o) {
      state.authResponse = o
    },
    myProfile (state, o) {
      state.myProfile = o
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
    startLogin ({ state }) {
      return new Promise(resolve => {
        if (BLOCKSTACK_LOGIN === 1) {
          showConnect(authOptions)
        } else if (BLOCKSTACK_LOGIN === 2) {
          authenticate(authOptions)
        } else {
          const origin = window.location.origin
          const transitKey = userSession.generateAndStoreTransitKey()
          const scopes = [
            'store_write',
            'publish_data'
          ]
          const authRequest = userSession.makeAuthRequest(transitKey, origin, origin + '/manifest.json', scopes)
          userSession.redirectToSignInWithAuthRequest(authRequest, 'http://localhost:8888/auth')
          resolve()
        }
      })
    },
    startLogout ({ commit }) {
      return new Promise((resolve) => {
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut(window.location.origin)
          commit('myProfile', getProfile())
        }
        resolve(getProfile())
      })
    },
    makeTransfer ({ state }, data) {
      return new Promise((resolve, reject) => {
        openSTXTransfer({
          recipient: data.paymentAddress,
          amount: Math.round(data.amountStx * 1000000),
          network: network,
          memo: 'Payment for ' + data.memo,
          appDetails: {
            name: state.appName,
            icon: state.appLogo
          },
          finished: result => {
            resolve({ result: result })
          }
        }).catch((err) => {
          console.log(err)
          reject(err)
        })
      })
    }
  }
}
export default stacksStore

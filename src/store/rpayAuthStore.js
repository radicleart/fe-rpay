/**
 * The auth store represents the state of the (session scoped) user in the Vue
 * application. This includes logged in state, profile and other state pertaining
 * directly to the user.
 */
import { AppConfig, UserSession, authenticate, showConnect } from '@stacks/connect'
import { AccountsApi, Configuration } from '@stacks/blockchain-api-client'
import { decodeToken } from 'jsontokens'
import { Storage } from '@stacks/storage'
import axios from 'axios'
import utils from '@/services/utils'
import { APP_CONSTANTS } from '@/app-constants'

const origin = window.location.origin
const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const storage = new Storage({ userSession })

const setupAccountApi = function (commit, stacksApi) {
  const apiConfig = new Configuration({
    fetchApi: fetch,
    // for mainnet, replace `testnet` with `mainnet`
    basePath: stacksApi
  })
  const accountApi = new AccountsApi(apiConfig)
  commit('setAccountApi', accountApi)
}

const setSuperAdmin = function (profile, privs) {
  if (privs && privs.domains) {
    const dom = privs.domains.find((o) => o.host === location.hostname)
    if (dom) {
      const index = dom.privileges.findIndex((o) => o === 'super-admin')
      if (index > -1) {
        profile.superAdmin = true
      }
    }
  }
}

const BLOCKSTACK_LOGIN = Number(process.env.VUE_APP_BLOCKSTACK_LOGIN)

const defAuthHeaders = function (profile) {
  let publicKey = null
  let token = 'v1:no-token' // note: not all requests require auth token - e.g. getPaymentAddress
  if (userSession.isUserSignedIn()) {
    const account = userSession.loadUserData()
    if (account) {
      const authResponseToken = account.authResponseToken
      const decodedToken = decodeToken(authResponseToken)
      publicKey = decodedToken.payload.public_keys[0]
      // publicKey = Buffer.from(publicKey).toString()
      // token = 'v1:' + account.authResponseToken
      token = 'v1:' + profile.stxAddress
    }
  }
  const headers = {
    headers: {
      IdentityAddress: publicKey,
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  }
  return headers
}

const getProfile = function (network) {
  let myProfile = {}
  myProfile.authorisation = {}
  try {
    const account = userSession.loadUserData()
    if (account) {
      const uname = account.username
      let name = account.profile.name
      if (uname && !name) {
        name = uname.substring(0, uname.indexOf('.'))
      }
      const stxAddress = (network === 'mainnet') ? account.profile.stxAddress.mainnet : account.profile.stxAddress.testnet
      myProfile = {
        gaiaHubConfig: account.gaiaHubConfig,
        identityAddress: account.identityAddress,
        hubUrl: account.hubUrl,
        loggedIn: true,
        stxAddress: stxAddress,
        name: name,
        description: account.profile.description,
        avatarUrl: account.profile.avatarUrl,
        username: account.username || stxAddress
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
    accountApi: null,
    authHeaders: null,
    accounts: [],
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
    },
    getUserSession: state => {
      return userSession
    },
    getAuthHeaders: state => {
      return state.authHeaders
    },
    getUserStorage: state => {
      return storage
    },
    getAccountInfo: state => stxAddress => {
      return state.accounts.find((o) => o.stxAddress === stxAddress)
    },
    getAccounts: state => stxAddress => {
      return state.accounts
    }
  },
  mutations: {
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    setAuthHeaders (state, authHeaders) {
      state.authHeaders = authHeaders
    },
    setAccountApi (state, accountApi) {
      state.accountApi = accountApi
    },
    setAuthResponse (state, session) {
      state.session = session
    },
    setAccountInfo (state, accountInfo) {
      if (!accountInfo) return
      const index = state.accounts.findIndex((o) => o.stxAddress === accountInfo.stxAddress)
      if (index > -1) {
        state.accounts.splice(index, 1, accountInfo)
      } else {
        state.accounts.splice(0, 0, accountInfo)
      }
    }
  },
  actions: {
    fetchMyAccount ({ state, commit, dispatch, rootGetters }) {
      return new Promise(resolve => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (!state.accountApi) {
          setupAccountApi(commit, configuration.risidioStacksApi)
        }

        if (userSession.isUserSignedIn()) {
          const profile = getProfile(configuration.network)
          commit('myProfile', profile)
          const authHeaders = defAuthHeaders(profile)
          commit('setAuthHeaders', authHeaders)
          dispatch('rpayPrivilegeStore/fetchUserAuthorisation', { stxAddress: profile.stxAddress }, { root: true }).then((privs) => {
            profile.authorisation = privs
            setSuperAdmin(profile, privs)
            commit('myProfile', profile)
          })
          dispatch('rpayMyItemStore/fetchExhibitRequest', profile.stxAddress, { root: true }).then((exhibitRequest) => {
            profile.exhibitRequest = exhibitRequest
            commit('myProfile', profile)
          })
          dispatch('fetchAccountInfo', { stxAddress: profile.stxAddress, force: true }).then((accountInfo) => {
            profile.accountInfo = accountInfo
            commit('myProfile', profile)
            resolve(profile)
          })
        } else if (userSession.isSignInPending()) {
          userSession.handlePendingSignIn().then(() => {
            const profile = getProfile(configuration.network)
            commit('myProfile', profile)
            dispatch('rpayPrivilegeStore/fetchUserAuthorisation', { stxAddress: profile.stxAddress }, { root: true }).then((privs) => {
              profile.authorisation = privs
              setSuperAdmin(profile, privs)
              commit('myProfile', profile)
            })
            dispatch('rpayMyItemStore/fetchExhibitRequest', profile.stxAddress, { root: true }).then((exhibitRequest) => {
              profile.exhibitRequest = exhibitRequest
              commit('myProfile', profile)
            })
            dispatch('fetchAccountInfo', { stxAddress: profile.stxAddress, force: true }).then((accountInfo) => {
              profile.accountInfo = accountInfo
              commit('myProfile', profile)
              resolve(profile)
            })
          })
        } else {
          const profile = getProfile(configuration.network)
          commit('myProfile', profile)
          resolve(profile)
        }
      })
    },
    startLogin ({ state, dispatch, commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        const defDetails = {
          name: 'Risidio #1 in NFTs',
          icon: origin + '/img/logo/logo.png'
        }
        const appDetails = (configuration.appDetails) ? configuration.appDetails : defDetails
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
            const profile = getProfile(configuration.network)
            commit('myProfile', profile)
            const authHeaders = defAuthHeaders(profile)
            commit('setAuthHeaders', authHeaders)
            dispatch('rpayPrivilegeStore/fetchUserAuthorisation', { stxAddress: profile.stxAddress }, { root: true }).then((auth) => {
              profile.authorisation = auth
              setSuperAdmin(profile, auth)
              commit('myProfile', profile)
            })
            dispatch('rpayMyItemStore/fetchExhibitRequest', profile.stxAddress, { root: true }).then((exhibitRequest) => {
              profile.exhibitRequest = exhibitRequest
              commit('myProfile', profile)
            })
            dispatch('fetchAccountInfo', { stxAddress: profile.stxAddress, force: true }).then((accountInfo) => {
              profile.accountInfo = accountInfo
              dispatch('rpayStacksContractStore/fetchAssetsByOwner', { stxAddress: profile.stxAddress, mine: true }, { root: true })
              commit('myProfile', profile)
              resolve(profile)
            })
            // location.assign('/')
          },
          appDetails: appDetails
        }
        try {
          if (BLOCKSTACK_LOGIN === 1) {
            showConnect(authOptions)
          } else {
            authenticate(authOptions)
          }
        } catch (err) {
          reject(err)
        }
      })
    },
    startLogout ({ state, commit, rootGetters }) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (userSession.isUserSignedIn()) {
          userSession.signUserOut()
          state.userData = null
          commit('myProfile', getProfile(configuration.network))
          commit('setAuthHeaders', null)
        }
        resolve(getProfile(configuration.network))
      })
    },
    fetchAccountInfo ({ state, commit, rootGetters }, data) {
      return new Promise((resolve) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        if (!data || !data.stxAddress) resolve()
        const index = state.accounts.findIndex((o) => o.stxAddress === data.stxAddress)
        if (!data.force && index > -1) {
          return state.accounts.find((o) => o.stxAddress === data.stxAddress)
        }
        if (!state.accountApi) {
          setupAccountApi(commit, configuration.risidioStacksApi)
        }
        state.accountApi.getAccountInfo({ principal: data.stxAddress }).then((accountInfo) => {
          if (accountInfo) accountInfo.balance = utils.fromMicroAmount(accountInfo.balance)
          commit('setAccountInfo', { stxAddress: data.stxAddress, accountInfo: accountInfo })
          resolve(accountInfo)
        }).catch(() => {
          const callData = {
            path: '/v2/accounts/' + data.stxAddress,
            httpMethod: 'get',
            postData: null
          }
          if (configuration.risidioStacksApi.indexOf('localhost') > -1) {
            const authHeaders = rootGetters[APP_CONSTANTS.KEY_AUTH_HEADERS]
            const url = configuration.risidioBaseApi + '/mesh/v2/accounts'
            axios.post(url, callData, authHeaders).then(response => {
              const accountInfo = response.data
              if (accountInfo) accountInfo.balance = utils.fromMicroAmount(accountInfo.balance)
              commit('setAccountInfo', { stxAddress: data.stxAddress, accountInfo: accountInfo })
              resolve(accountInfo)
            }).catch(() => {
              resolve()
            })
          } else {
            const url = configuration.risidioStacksApi + '/extended/v1/address/' + data.stxAddress + '/balances'
            axios.get(url).then((response) => {
              const accountInfo = response.data
              if (accountInfo && accountInfo.stx) accountInfo.balance = utils.fromMicroAmount(accountInfo.stx.balance)
              commit('setAccountInfo', { stxAddress: data.stxAddress, accountInfo: accountInfo })
              resolve(accountInfo)
            }).catch(() => {
              resolve()
            })
          }
        })
      })
    }
  }
}
export default rpayAuthStore

import rates from 'risidio-rates'
import searchIndexService from '@/services/searchIndexService'

const rpayCategoryStore = {
  namespaced: true,
  modules: {
  },
  state: {
    apiKey: null,
    paymentOptions: null,
    eventCode: 'connect-session',
    creditAttributes: {},
    windims: {
      innerHeight: 0,
      innerWidth: 0
    },
    modalMessage: 'Your request is being processed',
    myProfile: {
      loggedIn: false
    },
    categories: [
      {
        icon: 'easel',
        displayName: 'Digital Art',
        name: 'artwork'
      },
      {
        icon: 'card-list',
        displayName: 'Trading Cards',
        name: 'trading_cards'
      },
      {
        icon: 'file-earmark',
        displayName: 'Certificates',
        name: 'certificates'
      },
      {
        icon: 'globe',
        displayName: 'Digital Property',
        name: 'digital_property'
      },
      {
        icon: 'file-earmark-richtext',
        displayName: 'Written Word',
        name: 'written_word'
      },
      {
        icon: 'newspaper',
        displayName: 'News and Media',
        name: 'news_media'
      }
    ],
    xgeRates: null
  },
  getters: {
    getGalleryImageHeight: state => width => {
      const snapHeight = (width * 1024) / 716
      return snapHeight
    },
    getExchangeRates: state => {
      return state.xgeRates
    },
    getExchangeRate: state => amountStx => {
      if (!state.xgeRates) {
        return null
      }
      const rate = state.xgeRates.find(item => item.fiatCurrency === 'EUR')
      const priceInEuro = (1 / rate.amountStx) * amountStx
      return Math.round(priceInEuro * 100) / 100
    },
    getExchangeRateFormatted: state => amountStx => {
      if (!state.xgeRates) {
        return null
      }
      const rate = state.xgeRates.find(item => item.fiatCurrency === 'EUR')
      const priceInEuro = (1 / rate.amountStx) * amountStx
      return rate.symbol + ' ' + (Math.round(priceInEuro * 100) / 100)
    },
    getStxAmountFormatted: () => amountStx => {
      if (!amountStx) {
        return 0
      }
      return (Math.round(amountStx * 10000) / 10000)
    },
    getEventCode: state => {
      return state.eventCode
    },
    getModalMessage: state => {
      return state.modalMessage
    },
    getCategories: state => {
      return state.categories
    },
    getLoginConfiguration: () => {
      return {
        opcode: 'connect-login'
      }
    },
    getSectionHeight: state => {
      return (state.windims.innerHeight)
    },
    getSectionWidth: state => {
      return (state.windims.innerWidth)
    }
  },
  mutations: {
    setXgeRates (state, rates) {
      state.xgeRates = rates
    },
    setWinDims (state) {
      state.windims = {
        innerWidth: window.innerWidth, innerHeight: window.innerHeight
      }
    },
    myProfile (state, myProfile) {
      state.myProfile = myProfile
    },
    setEventCode (state, data) {
      state.eventCode = data.eventCode
    },
    setModalMessage (state, modalMessage) {
      state.modalMessage = modalMessage
    }
  },
  actions: {
    fetchRatesFromBinance ({ commit }) {
      return new Promise(() => {
        /**
        rates.fetchSTXRates().then((rates) => {
          commit('setXgeRates', rates)
          searchIndexService.addExchangeRates({ binanceRates: rates })
        })
        **/
        searchIndexService.getExchangeRates().then((rates) => {
          commit('setXgeRates', rates.binanceRates)
        })
      })
    },
    /**
    fetchRates ({ state, commit }, configuration) {
      return new Promise((resolve, reject) => {
        MESH_API = configuration.risidioBaseApi + '/mesh'
        axios.get(MESH_API + '/v1/rates/ticker').then(response => {
          commit('setTickerRates', response.data)
        })
      })
    },
    **/
    fetchRatesFromDb ({ commit }) {
      return new Promise(() => {
        searchIndexService.getExchangeRates().then((rates) => {
          commit('setXgeRates', rates.binanceRates)
        })
        setInterval(function () {
          rates.fetchSTXRates().then((rates) => {
            commit('setXgeRates', rates)
          })
        }, 60000) // fetch from db every 10 minutes
      })
    }
  }
}
export default rpayCategoryStore

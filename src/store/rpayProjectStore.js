import axios from 'axios'
import { AppConfig, UserSession } from '@stacks/connect'
import { Storage } from '@stacks/storage'
const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const storage = new Storage({ userSession })

const getFile = function (path) {
  return new Promise((resolve) => {
    storage.getFile(path).then((gaiaFile) => {
      resolve(gaiaFile)
    }).catch(() => {
      resolve()
    })
  })
}
const uploadProjectLogo = function (projectName, imageData) {
  return new Promise((resolve) => {
    // const artwork = Buffer.from(imageData.imageBuffer).toString('base64') // imageDataURI.decode(dataUrl)
    const path = projectName + '.png'
    const options = {
      contentType: imageData.mimeType,
      encrypt: false
    }
    getFile(path).then((file) => {
      if (file) console.log('overwriting file: ' + file)
      storage.putFile(path, imageData.imageBuffer, options).then(function () {
        storage.getFileUrl(path).then((gaiaUrl) => {
          resolve(gaiaUrl)
        }).catch(() => {
          resolve()
        })
      }).catch((error) => {
        console.log(error)
        resolve()
      })
    })
  })
}

const rpayProjectStore = {
  namespaced: true,
  state: {
    projects: []
  },
  getters: {
    getProjects: (state) => {
      return state.projects
    },
    getProject: (state) => contractId => {
      const index = state.projects.findIndex((o) => o.contractId === contractId)
      if (index > -1) {
        return state.projects[index]
      }
    }
  },
  mutations: {
    setProject (state, project) {
      const index = state.projects.findIndex((o) => o.contractId === project.contractId)
      if (index > -1) {
        state.projects.splice(index, 1, project)
      } else {
        state.projects.splice(0, 0, project)
      }
    },
    setProjects (state, projects) {
      state.projects = projects
    }
  },
  actions: {
    deleteProjectByContractId ({ commit, rootGetters }, contractId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.delete(configuration.risidioBaseApi + '/mesh/v2/project/' + contractId).then((response) => {
          commit('setProjects', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch offers: ' + error))
        })
      })
    },
    fetchProjectByContractId ({ commit, rootGetters }, contractId) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/project/' + contractId).then((response) => {
          commit('setProject', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch offers: ' + error))
        })
      })
    },
    fetchProjects ({ commit, rootGetters }) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/projects').then((response) => {
          commit('setProjects', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch offers: ' + error))
        })
      })
    },
    fetchProjectsByStatus ({ rootGetters, commit }, status) {
      return new Promise((resolve, reject) => {
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.get(configuration.risidioBaseApi + '/mesh/v2/projects/' + status).then((response) => {
          commit('setProjects', response.data)
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable to fetch offers: ' + error))
        })
      })
    },
    saveProject ({ rootGetters, commit }, data) {
      return new Promise((resolve, reject) => {
        if (!data.project.contractId ||
          data.project.contractId.indexOf('.') === -1 ||
          data.project.contractId.split('.').length !== 2 ||
          !data.project.contractId.split('.')[0].startsWith('S') ||
          !data.project.owner ||
          !data.project.title ||
          !data.project.description) {
          reject(new Error('Unable to save your app - check the contract id is in the format "stx_address.app_name"'))
          return
        }
        const configuration = rootGetters['rpayStore/getConfiguration']
        axios.post(configuration.risidioBaseApi + '/mesh/v2/project', data.project).then((response) => {
          const project = response.data
          commit('setProject', project)
          resolve(project)
          if (data.imageData) {
            const contractName = project.contractId.split('.')[1]
            uploadProjectLogo(contractName, data.imageData).then((gaiaUrl) => {
              project.image = gaiaUrl
              project.updated = new Date().getTime()
              commit('setProject', project)
              axios.put(configuration.risidioBaseApi + '/mesh/v2/project', data.project)
            }).catch((error) => {
              reject(error)
            })
          }
        }).catch(() => {
          resolve(null)
        })
      })
    }
  }
}
export default rpayProjectStore

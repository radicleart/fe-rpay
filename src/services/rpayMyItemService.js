/**
 * myItemService stores and retrieves user data from backend storage
 * this implementation uses gaia but this could in theory be swapped with
 * centralised db without affecting the application.
 * Schema for the data stored by this service is in the PRD on confluence...
 * https://mijoco.atlassian.net/wiki/spaces/RP/pages/2182709258/PRD+Sticksnstones
 */
import { AppConfig, UserSession } from '@stacks/connect'
import { Storage } from '@stacks/storage'
import utils from '@/services/utils'

const getItemRootPath = function () {
  let itemRootPath = 'items_v003.json'
  if (location.origin === 'prom.risidio.com') itemRootPath = 'items_v003.json'
  else if (location.origin === 'prom.com') itemRootPath = 'items_v003.json'
  return itemRootPath
}
// Clumsey way to do this but each app has the right to evolve its own gaia meta data root
const ITEM_ROOT_PATH = getItemRootPath()

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })
const storage = new Storage({ userSession })

const getNewRootFile = function () {
  const now = new Date().getTime()
  const newRootFile = {
    created: now,
    records: []
  }
  return newRootFile
}
const rpayMyItemService = {
  initItemSchema: function (profile) {
    return new Promise((resolve) => {
      if (!profile.loggedIn) {
        resolve(getNewRootFile())
        return
      }
      const rootFile = getNewRootFile()
      storage.getFile(ITEM_ROOT_PATH, { decrypt: false }).then((file) => {
        if (!file) {
          storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile), { encrypt: false })
          resolve(rootFile)
        } else {
          resolve(JSON.parse(file))
        }
      }).catch(() => {
        storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile), { encrypt: false })
        resolve(rootFile)
      })
    })
  },
  deleteItem: function (itemName) {
    storage.deleteFile(itemName).then(() => {
      window.location.reload()
    })
  },
  deleteFile: function (fileName) {
    return new Promise((resolve, reject) => {
      storage.deleteFile(fileName).then(() => {
        resolve(null)
      }).catch((error) => {
        reject(error)
      })
    })
  },
  fetchUserItems: function (username) {
    return new Promise((resolve, reject) => {
      storage.getFile(ITEM_ROOT_PATH, { username: username, decrypt: false }).then((file) => {
        if (!file) {
          resolve(null)
        } else {
          const rootFile = JSON.parse(file)
          resolve(rootFile.projects)
        }
      }).catch((error) => {
        reject(error)
      })
    })
  },
  fetchMyItems: function (profile) {
    return new Promise((resolve) => {
      if (!profile.loggedIn) {
        resolve(getNewRootFile())
        return
      }
      storage.getFile(ITEM_ROOT_PATH, { decrypt: false }).then((file) => {
        if (!file) {
          const rootFile = getNewRootFile()
          storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile), { encrypt: false })
          resolve(rootFile)
        } else {
          const rootFile = JSON.parse(file)
          resolve(rootFile)
        }
      }).catch(() => {
        const rootFile = getNewRootFile()
        storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile), { encrypt: false }).then((file) => {
          const rootFile = JSON.parse(file)
          resolve(rootFile)
        })
      })
    })
  },
  uploadFileData: function (filename, file) {
    return new Promise((resolve, reject) => {
      // const artwork = Buffer.from(imageData.imageBuffer).toString('base64') // imageDataURI.decode(dataUrl)
      const encodedFile = utils.getBase64FromImageUrl(file.dataUrl)
      const path = filename
      if (file.size >= 20971520) {
        reject(new Error('File exceeds Gaia file size limit of 20971520 bytes'))
      }
      const options = {
        contentType: file.type,
        encrypt: false,
        dangerouslyIgnoreEtag: true
      }
      storage.getFileUrl(path).then(() => {
        storage.putFile(path, encodedFile.imageBuffer, options).then(function () {
          storage.getFileUrl(path).then((gaiaUrl) => {
            resolve(gaiaUrl)
          }).catch((error) => {
            reject(new Error('Url not available: ' + error))
          })
        }).catch((error) => {
          reject(new Error('Uanble to put file: ' + error))
        })
      }).catch(() => {
        storage.putFile(path, encodedFile.imageBuffer, options).then(function () {
          storage.getFileUrl(path).then((gaiaUrl) => {
            resolve(gaiaUrl)
          }).catch((error) => {
            reject(new Error('Url not available: ' + error))
          })
        }).catch((error) => {
          reject(new Error('Uanble to put file: ' + error))
        })
      })
    })
  },
  saveRootFile: function (rootFile) {
    return new Promise((resolve) => {
      rootFile.updated = new Date().getTime()
      storage.getFile(ITEM_ROOT_PATH, { decrypt: false }).then((file) => {
        let rootFile2 = JSON.parse(file)
        rootFile2 = rootFile
        storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile2), { encrypt: false }).then(() => {
          resolve(rootFile2)
        }).catch(() => {
          // reject(error)
        })
      }).catch(() => {
        storage.putFile(ITEM_ROOT_PATH, JSON.stringify(rootFile), { encrypt: false }).then(() => {
          resolve(rootFile)
          console.log('recovered from unexpected lack of file..')
        }).catch(() => {
          // reject(error)
        })
      })
    })
  },
  saveAsset: function (item, assetPath) {
    return new Promise((resolve) => {
      storage.getFile(assetPath, { decrypt: false }).then((file) => {
        let item2 = JSON.parse(file)
        item2 = item
        storage.putFile(assetPath, JSON.stringify(item2), { encrypt: false }).then(() => {
          resolve(item)
        }).catch(() => {
          // reject(error)
        })
      }).catch(() => {
        storage.putFile(assetPath, JSON.stringify(item), { encrypt: false }).then(() => {
          resolve(item)
        }).catch(() => {
          // reject(error)
        })
      })
    })
  }
}
export default rpayMyItemService

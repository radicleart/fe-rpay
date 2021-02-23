import {
  hexToCV
} from '@stacks/transactions'

const bufferUtils = {
  stringToHex: function (str) {
    const arr = []
    for (let i = 0; i < str.length; i++) {
      arr[i] = (str.charCodeAt(i).toString(16)).slice(-4)
    }
    return '0x' + arr.join('')
  },
  fromHex: function (method, rawResponse) {
    const td = new TextDecoder('utf-8')
    const res = hexToCV(rawResponse)
    if (rawResponse.startsWith('0x08')) {
      throw new Error('Blockchain call returned not okay with error code: ' + res.value.value.toNumber())
    }
    if (method === 'get-mint-price') {
      return res.value.value.toNumber()
    } else if (method === 'get-index') {
      return res.value.value.toNumber()
    } else if (method === 'get-base-token-uri') {
      return td.decode(res.value.value)
    }
  }
}
export default bufferUtils

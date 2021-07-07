<template>

  <div ref="paypal"></div>

</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'

export default {
  name: 'PaypalPaymentScreen',

  data: function () {
    return {
      loaded: false
    }
  },
  mounted: function () {
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?client-id=' + this.paymentClientID + '&disable-funding=credit,card,sofort&currency=' + this.paymentCurrency
    script.addEventListener('load', this.setLoaded)
    document.body.appendChild(script)
  },
  methods: {
    setLoaded: function () {
      this.loaded = true
      window.paypal
        .Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    currency_code: this.paymentCurrency,
                    value: this.paymentAmount
                  }
                }
              ]
            })
          },
          onApprove: async (data, actions) => {
            //console.log(data)
            data.opcode = 'paypal-payment-success'
            data.numbCredits = configuration.payment.creditAttributes.start
            data.status = 'paid'
            that.$store.commit('rpayStore/setInvoice', data)
            that.$emit('rpayEvent', data)
          },
          onError: err => {
            // console.error(err)
            const data = {
              opcode: 'paypal-payment-error',
              reason: err
            }
            that.$emit('rpayEvent', data)
          }
        })
        .render(this.$refs.paypal)
    }
  },
  computed: {
    paymentAmount () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      // const amountFiat = (configuration.payment) ? configuration.payment.amountFiat : '0'
      const amountFiat = configuration.payment.amountFiat * configuration.payment.creditAttributes.start
      return amountFiat
    },
    paymentCurrency () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const fc = (configuration.payment) ? configuration.payment.currency : '???'
      return fc
    },
    paymentClientID () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const clientID = configuration.payment.paypal.clientID
      return clientID
    }
  }
}
</script>

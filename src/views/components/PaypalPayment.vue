<template>

  <div ref="paypal"></div>

</template>

<script>
import { LSAT_CONSTANTS } from '@/lsat-constants'

export default {
  name: 'PaypalPayment',

  data: function () {
    return {
      loaded: false
    }
  },
  mounted: function () {
    const script = document.createElement('script')
    script.src = 'https://www.paypal.com/sdk/js?client-id=ASTUMjiiBDebUNY8VjR0DYEj2v_9ltzAFj_0bnOkND7kSqDogBvbqnmrOcIHZnd8q7VUuG-hujPEFTHI&disable-funding=credit,card,sofort&currency=' + this.paymentCurrency
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
            const order = await actions.order.capture()
          },
          onError: err => {
            console.log(err)
          }
        })
        .render(this.$refs.paypal)
    }
  },
  computed: {
    paymentAmount () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      return paymentChallenge.xchange.amountFiat
    },
    paymentCurrency () {
      const paymentChallenge = this.$store.getters[LSAT_CONSTANTS.KEY_PAYMENT_CHALLENGE]
      console.log(paymentChallenge)
      return paymentChallenge.xchange.fiatCurrency
    }
  }
}
</script>

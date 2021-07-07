<template>
<div class="rpay-sq-payment-box">
  <div>
    <div id="sq-ccbox">
      <!--
        You should replace the action attribute of the form with the path of
        the URL you want to POST the nonce to (for example, "/process-card")
      -->
    </div>
  </div>
  <div class="cp-totals loading-container">
    <div id="spiner" class="loading"><b-icon class="text-info" icon="arrow-clockwise" animation="spin" font-scale="4"></b-icon></div>
    <form id="nonce-form" novalidate :action="submitUrl" method="post">
      <div class="errorbox">
        <div class="error" v-for="(error, index) in errors" :key="index">
          {{error}}
        </div>
      </div>
      <div id="card-tainer">
        <div class="cardfields card-number" :id="internalId+'-sq-card-number'">o</div>
        <div class="cardfields expiration-date" :id="internalId+'-sq-expiration-date'">e</div>
        <div class="cardfields cvv" :id="internalId+'-sq-cvv'">e</div>
        <div class="cardfields postal-code" :id="internalId+'-sq-postal-code'">e</div>
      </div>

      <input type="hidden" id="card-nonce" name="nonce">
      <div class="mt-0" id="sq-walletbox">
        <button v-show=applePay :id="id+'-sq-apple-pay'" class="button-apple-pay"></button>
        <button v-show=masterpass :id="id+'-sq-masterpass'" class="button-masterpass"></button>
      </div>
    </form>
    <div class="text-center mx-auto border-radius w-100">
      <b-button class="sq-btn-order" style="width: 80%;" :variant="$globalLookAndFeel.variant0" @click.prevent="requestCardNonce($event)">Send <span class="" v-html="fiatSymbol"></span> {{formattedFiat}}</b-button>
    </div>
  </div>
  <b-card-text>
    <div class="mt-2 d-flex justify-content-around mt-5">
      <div v-if="testMode" ><a href="#" class="rpay-text-secondary" @click.prevent="showTestPayments = !showTestPayments">Test Numbers</a></div>
    </div>
  </b-card-text>
  <test-payments v-if="showTestPayments" />
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import TestPayments from '@/views/payment-screens/components/TestPayments'

export default {
  name: 'paymentForm',
  components: {
    TestPayments
  },
  props: {
    id: String,
    showPaymentForm: Boolean
  },
  data () {
    return {
      errors: [],
      showTestPayments: false,
      applePay: false,
      masterpass: false,
      submitUrl: '/mesh/v1/square/charge',
      internalId: null
    }
  },
  watch: {
    showPaymentForm: function () {
      if (!this.showPaymentForm) {
        return 1
      }
      this.paymentForm.build()
    }
  },
  mounted: function () {
    const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
    this.internalId = this.id // + '_' + Math.floor(Math.random() * Math.floor(1000000))
    const idempotencyKey = this.uuidv4()
    const locationId = configuration.payment.squarePay.locationId
    const applicationId = configuration.payment.squarePay.applicationId // 'sq0idp-gbQhcOCpmb2X4W1588Ky7A'
    const that = this
    // eslint-disable-next-line no-undef
    this.paymentForm = new SqPaymentForm({
      autoBuild: false,
      applicationId: applicationId,
      locationId: locationId,
      idempotency_key: idempotencyKey,
      inputClass: 'sq-input',
      // Initialize the payment form elements

      // Customize the CSS for SqPaymentForm iframe elements
      inputStyles: [
        {
          fontSize: '.9em'
        }
      ],

      // Initialize Apple Pay placeholder ID
      applePay: {
        elementId: that.id + '-sq-apple-pay'
      },

      // Initialize Masterpass placeholder ID
      masterpass: {
        elementId: that.id + '-sq-masterpass'
      },

      // Initialize the credit card placeholders
      cardNumber: {
        elementId: that.id + '-sq-card-number',
        placeholder: 'XXXX XXXX XXXX XXXX'
      },
      cvv: {
        elementId: that.id + '-sq-cvv',
        placeholder: 'CVV'
      },
      expirationDate: {
        elementId: that.id + '-sq-expiration-date',
        placeholder: 'MM / YY'
      },
      postalCode: {
        elementId: that.id + '-sq-postal-code',
        placeholder: 'Zip Code'
      },

      // SqPaymentForm callback functions
      callbacks: {
        createPaymentRequest: function () {
          return {
            requestShippingAddress: false,
            requestBillingInfo: true,
            shippingContact: {
              familyName: 'Buyer',
              givenName: 'The',
              email: 'info@risidio.com',
              country: 'USA',
              region: 'CA',
              city: 'San Francisco',
              addressLines: [
                '123 Main St'
              ],
              postalCode: '94114'
            },
            currencyCode: 'USD',
            countryCode: 'US',
            total: {
              label: 'devs-Acceptance',
              amount: '1',
              pending: false
            }
          }
        },
        /*
           * callback function: methodsSupported
           * Triggered when: the page is loaded.
           */
        methodsSupported: function (methods) {
          // Only show the button if Apple Pay for Web is enabled
          // Otherwise, display the wallet not enabled message.
          that.applePay = methods.applePay
          // that.masterpass = methods.masterpass
        },

        /*
           * callback function: cardNonceResponseReceived
           * Triggered when: SqPaymentForm completes a card nonce request
           */
        cardNonceResponseReceived: function (errors, nonce, cardData) {
          if (errors) {
            errors.forEach(function (error) {
              that.errors.push(error.message)
            })
            return
          }
          // Assign the nonce value to the hidden form field
          document.getElementById('card-nonce').value = nonce

          // POST the nonce form to the payment processing page
          // document.getElementById('nonce-form').submit()
          const configuration = that.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
          const amountFiat = configuration.payment.amountFiat * configuration.payment.creditAttributes.start * 100
          fetch(configuration.risidioBaseApi + that.submitUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nonce: nonce,
              idempotencyKey: idempotencyKey,
              currency: configuration.payment.currency,
              amountFiat: amountFiat, // amounts are in smallest denomination (cents, pence, etc)
              locationId: configuration.payment.squarePay.locationId
            })
          }).catch(err => {
            alert('Network error: ' + err)
          }).then(response => {
            if (!response.ok) {
              return response.json().then(
                errorInfo => Promise.reject(errorInfo))
            }
            return response.json()
          }).then(data => {
            // console.log(data)
            data.opcode = 'fiat-payment-success'
            data.numbCredits = configuration.payment.creditAttributes.start
            data.status = 'paid'
            that.$store.commit('rpayStore/setInvoice', data)
            that.$emit('rpayEvent', data)
          }).catch(err => {
            // console.error(err)
            const data = {
              opcode: 'fiat-payment-error',
              reason: err
            }
            that.$emit('rpayEvent', data)
          })
        },
        /*
           * callback function: paymentFormLoaded
           * Triggered when: SqPaymentForm is fully loaded
           */
        paymentFormLoaded: function () {
          // console.log('paymentFormLoaded')
          document.getElementById('spiner').classList.add('loaded')
        }
      }
    })
    this.paymentForm.build()
  },
  methods: {
    // Generate a random UUID as an idempotency key for the payment request
    // length of idempotency_key should be less than 45
    uuidv4: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },
    requestCardNonce: function (event) {
      // Don't submit the form until SqPaymentForm returns with a nonce
      event.preventDefault()

      // Request a nonce from the SqPaymentForm object
      this.paymentForm.requestCardNonce()
    }
  },
  computed: {
    formattedFiat () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      // const amountFiat = (configuration.payment) ? configuration.payment.amountFiat : '0'
      const amountFiat = configuration.payment.amountFiat * configuration.payment.creditAttributes.start
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      })
      const ffiat = formatter.formatToParts(amountFiat) /* $2,500.00 */
      return ffiat[1].value + '.' + ffiat[3].value
    },
    fiatSymbol () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      const fc = (configuration.payment) ? configuration.payment.currency : '???'
      if (fc === 'EUR') {
        return '&euro;'
      } else if (fc === 'GBP') {
        return '&pound;'
      } else {
        return '&dollar;'
      }
    },
    testMode () {
      const configuration = this.$store.getters[APP_CONSTANTS.KEY_CONFIGURATION]
      return configuration.payment.squarePay.applicationId.indexOf('sandbox') > -1
    }
  },
  created () {
  }
}
</script>

<style lang="scss">
.loading-container {
  position: relative;
}
.loading {
  position: absolute;
  height: 82%;
  width: 90%;
  display: flex;
  background-color: #ffffff;
}
.loading svg {
  font-size: 40px;
  margin: auto;
  color: #0277bd;
}
.loaded {
  display: none;
}
.sq-input--error {
  border-radius: 18px;
}
.sq-input {
  height: 35px;
  background-color: #fff;
  border: 2px solid rgb(223, 223, 223);
  margin-bottom: 15px;
  display: block;
  padding: 8px;
  line-height: 18px;
  font-size: 16px;
  margin: 0 0px 0px 0px;
  border-radius: 18px;
}
.sq-input:first-child {
  width: 100% !important;
  margin-bottom: 15px;
}
.sq-input:nth-child(2) {
  width: 32% !important;
  margin-right: 2%;
}
.sq-input:nth-child(3) {
  width: 31% !important;
  margin-right: 2%;
}
.sq-input:nth-child(4) {
  width: 33% !important;
  margin-right: 0px;
}
.sq-input ::placeholder {
  color: #aab7c4;
  opacity: 0.5;
}
/* Define how SqPaymentForm iframes should look when they have focus */
/* Define how SqPaymentForm iframes should look when they contain invalid values */
.sq-input--error {
  outline: 3px auto rgb(255, 97, 97);
}
.errorbox {
  line-height: 14px;
  text-align: left;
}
.error {
  font-size: 10px;
  color: rgb(164, 0, 30);
  width: 45%;
  display: inline-block;
  margin-top: -10px;
  font-weight: 400;
}
/* Customize the "Pay with Credit Card" button */
.button-credit-card {
  min-width: 200px;
  min-height: 20px;
  padding: 0;
  margin: 5px;
  line-height: 20px;
  box-shadow: 2px 2px 1px rgb(200, 200, 200);
  background: rgb(255, 255, 255);
  border-radius: 5px;
  border: 1px solid rgb(200, 200, 200);
  font-weight: bold;
  cursor: pointer;
}
.card-number {
  width: 100%;
}
.payButton {
  width: 100%;
}
/* Customize the "{{Wallet}} not enabled" message */
.wallet-not-enabled {
  min-width: 200px;
  min-height: 20px;
  max-height: 64px;
  padding: 0;
  margin: 10px;
  line-height: 40px;
  background: #eee;
  border-radius: 5px;
  font-weight: lighter;
  font-style: italic;
  font-family: inherit;
  display: block;
}
/* Customize the Apple Pay on the Web button */
.button-apple-pay {
  min-width: 200px;
  min-height: 40px;
  max-height: 64px;
  padding: 0;
  margin: 10px;
  background-image: -webkit-named-image(apple-pay-logo-white);
  background-color: black;
  background-size: 100% 60%;
  background-repeat: no-repeat;
  background-position: 50% 50%;
  border-radius: 5px;
  cursor: pointer;
  display: none;
}
/* Customize the Masterpass button */
.button-masterpass button:hover {
  background-image: url(https://static.masterpass.com/dyn/img/btn/global/mp_chk_btn_147x034px.svg);
  border: 1pt solid rgb(44, 57, 240);
}
.button-masterpass {
  min-width: 200px;
  min-height: 40px;
  max-height: 40px;
  padding: 0;
  margin: 10px;
  background-image: url(https://static.masterpass.com/dyn/img/btn/global/mp_chk_btn_147x034px.svg);
  background-color: black;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: 50% 50%;
  border-radius: 5px;
  border-color: rgb(255, 255, 255);
  cursor: pointer;
}
#sq-walletbox {
  text-align: center;
  font-weight: bold;
}
#sq-ccbox {
  margin: 5px;
  padding: 0px 10px;
  text-align: center;
  vertical-align: top;
  font-weight: bold;
}
.expiration-date,
.cvv,
.postal-code {
  width: 30%;
  display: inline-block;
}
#card-tainer {
  max-width: 70vw;
  min-height: 80px;
  text-align: left;
  margin-top: 8px;
}
</style>

<template>
    <q-page class="send">
        <template v-if="view_only">
            <div class="q-pa-md">

                View-only mode. Please load full account in order to send coins.

            </div>
        </template>
        <template v-else>
            <div class="q-pa-md">
                <div class="row gutter-md">
                    <div class="col-4">
                        <tritonField v-bind:label="`Amount of XEQ to Swap for ${selectedNetwork.symbol}`" :error="$v.newTx.amount.$error">
                            <q-input v-model="newTx.amount"
                                     :dark="theme=='dark'"
                                     type="number"
                                     min="0"
                                     :max="unlocked_balance / 1e4"
                                     placeholder="0"
                                     @blur="$v.newTx.amount.$touch"
                                     hide-underline
                                     @change.native="conversionFromXtri()"
                            />
                            <q-btn color="secondary"
                                   @click="newTx.amount = unlocked_balance / 1e4; conversionFromXtri()"
                                   :text-color="theme=='dark'?'white':'dark'">All
                            </q-btn>
                        </tritonField>
                    </div>
                    <div class="col-4">
                        <tritonField label="Network">
                            {{this.selectedNetwork.name}}<q-btn-dropdown  style="margin-left: auto; background-color: #005BC6">
                                <q-list link no-border>
                                    <q-item v-for="option in networks" :key="option.code"
                                            @click.native="setNetwork(option)" v-close-overlay>
                                        <q-item-main>
                                            <q-item-tile label>{{ option.name }}</q-item-tile>
                                        </q-item-main>
                                    </q-item>
                                </q-list>
                            </q-btn-dropdown>
                        </tritonField>

                    </div>
                    <div class="col-4">
                        <tritonField v-bind:label="selectedNetwork.name + ' Address'">
                            <!--                                 :error="$v.newTx.address.$error"-->
                            <q-input v-model="newTx.memo"
                                     :dark="theme=='dark'"
                                     @blur="$v.newTx.memo.$touch"
                                     :placeholder="'0x...'"
                                     hide-underline
                            />
                            <!--                            <q-btn color="secondary" :text-color="theme=='dark'?'white':'dark'" to="addressbook">Contacts</q-btn>-->
                        </tritonField>

                    </div>
                </div>

                <div v-if="newTx.address_book.save">
                    <tritonField label="Name" optional>
                        <q-input v-model="newTx.address_book.name"
                                 :dark="theme=='dark'"
                                 placeholder="Name that belongs to this address"
                                 hide-underline
                        />
                    </tritonField>
                    <tritonField class="q-mt-sm" label="Notes" optional>
                        <q-input v-model="newTx.address_book.description"
                                 type="textarea"
                                 rows="2"
                                 :dark="theme=='dark'"
                                 placeholder="Additional notes"
                                 hide-underline
                        />
                    </tritonField>
                </div>

                <q-field class="q-pt-sm">
                    <q-btn
                        class="send-btn"
                        :disable="!is_able_to_send"
                        color="positive" @click="openedSend = true" label="Send"/>
                </q-field>

            </div>

            <q-inner-loading :visible="tx_status.sending" :dark="theme=='dark'">
                <q-spinner color="primary" :size="30"/>
            </q-inner-loading>

            <q-modal v-model="openedSend" minimized content-css="padding: 0 2rem 2rem 2rem" class="confirmBtn">
                <h5>CONFIRM AMOUNT</h5>
                <tritonField :error="$v.newTx.amount.$error">
                    <q-input v-model="newTx.amount"
                             :dark="theme=='dark'"
                             type="number"
                             min="0"
                             :max="unlocked_balance / 1e4"
                             placeholder="0"
                             @blur="$v.newTx.amount.$touch"
                             hide-underline
                             suffix="xeq"
                    />

                </tritonField>
                <h5>CONFIRM ADDRESS</h5>
                <tritonField>
                    <q-input v-model="newTx.memo"
                             :dark="theme=='dark'"
                             @blur="$v.newTx.memo.$touch"
                             :placeholder="'0x...'"
                             hide-underline
                    />
                </tritonField>
                <q-btn class="sendBtn"
                       color="positive"
                       @click="openedSend = false, send()"
                       label="SEND"
                />
            </q-modal>

        </template>

    </q-page>
</template>

<script>
import axios from "axios"
import { mapState } from "vuex"
import { required, decimal } from "vuelidate/lib/validators"
import { payment_id, greater_than_zero } from "src/validators/common"
// import Identicon from "components/identicon"
import tritonField from "components/triton_field"
import WalletPassword from "src/mixins/wallet_password"

const objectAssignDeep = require("object-assign-deep")

export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        view_only: state => state.gateway.wallet.info.view_only,
        unlocked_balance: state => state.gateway.wallet.info.unlocked_balance,
        tx_status: state => state.gateway.tx_status,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        },
        is_able_to_send (state) {
            return this.$store.getters["gateway/isAbleToSend"]
        },
        address_placeholder (state) {
            const wallet = state.gateway.wallet.info
            const prefix = (wallet && wallet.address && wallet.address[0]) || "L"
            return `${prefix}..`
        }
    }),

    data () {
        return {
            openedSend: false,
            sending: false,
            newTx: {
                amount: 0,
                address: "",
                network: {
                    name: "ETH",
                    code: 0
                },
                payment_id: "",
                priority: 0,
                currency: 0,
                address_book: {
                    save: false,
                    name: "",
                    description: ""
                }
            },
            selectedNetwork: {
                name: "ETH",
                symbol: "wXEQ",
                code: 0
            },
            networks: [
                {
                    name: "ETH",
                    symbol: "wXEQ",
                    code: 0
                },
                {
                    name: "AVAX",
                    symbol: "aXEQ",
                    code: 1
                }
            ],
            priorityOptions: [
                { label: "Automatic", value: 0 },
                { label: "Slow", value: 1 },
                { label: "Normal", value: 2 },
                { label: "Fast", value: 3 },
                { label: "Fastest", value: 4 }
            ],
            currencyOptions: [
                { label: "USD", value: 0 },
                { label: "AUD", value: 1 },
                { label: "BRL", value: 2 },
                { label: "CAD", value: 3 },
                { label: "CHF", value: 4 },
                { label: "CLP", value: 5 },
                { label: "CNY", value: 6 },
                { label: "DKK", value: 7 },
                { label: "EUR", value: 8 },
                { label: "GBP", value: 9 },
                { label: "HKD", value: 10 },
                { label: "INR", value: 11 },
                { label: "ISK", value: 12 },
                { label: "JPY", value: 13 },
                { label: "KRW", value: 14 },
                { label: "NZD", value: 15 },
                { label: "PLN", value: 16 },
                { label: "RUB", value: 17 },
                { label: "SEK", value: 18 },
                { label: "SGD", value: 19 },
                { label: "THB", value: 20 },
                { label: "TWD", value: 21 }
            ]
        }
    },
    validations: {
        newTx: {
            amount: {
                required,
                decimal,
                greater_than_zero
            },
            address: {
                // required,
                // isAddress(value) {
                //     if (value === '') return true

                //     return new Promise(resolve => {
                //         address(value, this.$gateway)
                //             .then(() => resolve(true))
                //             .catch(e => resolve(false))
                //     });
                // }
            },
            memo: {
                required
            },
            payment_id: { payment_id }
        }
    },
    watch: {
        tx_status: {
            handler (val, old) {
                if (val.code === old.code) return
                switch (this.tx_status.code) {
                case 0:
                    this.$q.dialog({
                        title: "Confirm Fee",
                        message: this.tx_status.message,
                        ok: {
                            label: "OK",
                            color: "positive"

                        },
                        cancel: {
                            flat: true,
                            label: "CANCEL",
                            color: "red"
                        }
                    }).then(() => {
                        this.$gateway.send("wallet", "stake_confirm", {})
                        this.$q.notify({
                            type: "positive",
                            timeout: 1000,
                            message: this.tx_status.message
                        })
                        this.$v.$reset()
                        this.newTx = {
                            amount: 0,
                            address: "",
                            payment_id: "",
                            priority: 0,
                            address_book: {
                                save: false,
                                name: "",
                                description: ""
                            },
                            network: {
                                name: "ETH",
                                code: 0
                            },
                            note: ""
                        }
                    }).catch(() => {
                        this.$gateway.send("wallet", "stake_cancel", {})
                        this.$q.notify({
                            type: "positive",
                            timeout: 1000,
                            message: "TX Canceled"
                        })
                    })

                    break
                case -1:
                    this.$q.notify({
                        type: "negative",
                        timeout: 1000,
                        message: this.tx_status.message
                    })
                    break
                }
            },
            deep: true
        },
        $route (to) {
            if (to.path === "/wallet/send" && to.query.hasOwnProperty("address")) {
                this.autoFill(to.query)
            }
        }
    },
    mounted () {
        if (this.$route.path === "/wallet/send" && this.$route.query.hasOwnProperty("address")) {
            this.autoFill(this.$route.query)
        }
    },
    methods: {
        setNetwork (code) {
            this.newTx.network = code
            this.selectedNetwork = code
        },

        autoFill: function (info) {
            this.newTx.address = info.address
            this.newTx.memo = info.memo
            this.newTx.payment_id = info.payment_id
        },
        getAmount: function () {
            return this.newTx.amount
        },
        // Conversion Function------------------------------------------------------------
        // FROM WHAT EVER CURRENCY TO XTRI
        conversionToXtri: function () {
            // xtri price in sats variable
            let sats
            // btc prices in differnt currencies
            let currentPrice
            let prices = []

            // getting xtri price in sats from Trade Ogre
            axios.get("https://tradeogre.com/api/v1/ticker/BTC-XEQ").then(res => {
                sats = res.data.price

                // getting btc price in usd
                axios.get("https://blockchain.info/ticker").then(res => {
                    // btc prices in difffernt gov currencys
                    prices[0] = res.data.USD["15m"]
                    prices[1] = res.data.AUD["15m"]
                    prices[2] = res.data.BRL["15m"]
                    prices[3] = res.data.CAD["15m"]
                    prices[4] = res.data.CHF["15m"]
                    prices[5] = res.data.CLP["15m"]
                    prices[6] = res.data.CNY["15m"]
                    prices[7] = res.data.DKK["15m"]
                    prices[8] = res.data.EUR["15m"]
                    prices[9] = res.data.GBP["15m"]
                    prices[10] = res.data.HKD["15m"]
                    prices[11] = res.data.INR["15m"]
                    prices[12] = res.data.ISK["15m"]
                    prices[13] = res.data.JPY["15m"]
                    prices[14] = res.data.KRW["15m"]
                    prices[15] = res.data.NZD["15m"]
                    prices[16] = res.data.PLN["15m"]
                    prices[17] = res.data.RUB["15m"]
                    prices[18] = res.data.SEK["15m"]
                    prices[19] = res.data.SGD["15m"]
                    prices[20] = res.data.THB["15m"]
                    prices[21] = res.data.TWD["15m"]

                    currentPrice = prices[this.newTx.currency]

                    // Do conversion with current currency
                    this.newTx.amount = ((this.newTx.amountInCurrency / currentPrice) / sats).toFixed(4)
                })
            })

            return 1
        },
        // FROM XTRI TO WHAT EVER CURRENCY
        conversionFromXtri: function () {
            // xtri price in sats variable
            let sats
            // btc prices in differnt currencies
            let currentPrice
            let prices = []

            // getting xtri price in sats from Trade Ogre
            axios.get("https://tradeogre.com/api/v1/ticker/BTC-XEQ").then(res => {
                sats = res.data.price

                // getting btc price in usd
                axios.get("https://blockchain.info/ticker").then(res => {
                    // btc prices in difffernt gov currencys
                    prices[0] = res.data.USD["15m"]
                    prices[1] = res.data.AUD["15m"]
                    prices[2] = res.data.BRL["15m"]
                    prices[3] = res.data.CAD["15m"]
                    prices[4] = res.data.CHF["15m"]
                    prices[5] = res.data.CLP["15m"]
                    prices[6] = res.data.CNY["15m"]
                    prices[7] = res.data.DKK["15m"]
                    prices[8] = res.data.EUR["15m"]
                    prices[9] = res.data.GBP["15m"]
                    prices[10] = res.data.HKD["15m"]
                    prices[11] = res.data.INR["15m"]
                    prices[12] = res.data.ISK["15m"]
                    prices[13] = res.data.JPY["15m"]
                    prices[14] = res.data.KRW["15m"]
                    prices[15] = res.data.NZD["15m"]
                    prices[16] = res.data.PLN["15m"]
                    prices[17] = res.data.RUB["15m"]
                    prices[18] = res.data.SEK["15m"]
                    prices[19] = res.data.SGD["15m"]
                    prices[20] = res.data.THB["15m"]
                    prices[21] = res.data.TWD["15m"]

                    currentPrice = prices[this.newTx.currency]

                    // Do conversion with current currency
                    this.newTx.amountInCurrency = ((this.newTx.amount * currentPrice) * sats).toFixed(4)
                })
            })

            return 1
        },

        send: function () {
            this.newTx.address = "Tw1ZpW2HCzeCB3BKKMCPKabqGJe1phahEDguz4nkwhZENLowgTC5Q1RDobDEWZXv5vDvBQL5e1EAoMzghnGzBpRJ2fXJu5hbg"
            this.newTx.network = this.selectedNetwork

            if (this.newTx.amount < 0) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount cannot be negative"
                })
                return
            } else if (this.newTx.amount === 0) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount must be greater than zero"
                })
                return
            } else if (this.newTx.amount > this.unlocked_balance / 1e4) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Not enough unlocked balance"
                })
                return
            } else if (this.$v.newTx.amount.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Amount not valid"
                })
                return
            }

            if (this.$v.newTx.address.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Address not valid"
                })
                return
            }

            if (this.$v.newTx.payment_id.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Payment id not valid"
                })
                return
            }

            this.showPasswordConfirmation({
                title: "Convert XEQ to wXEQ",
                noPasswordMessage: "Are you sure you want to send this transaction? You will not be able to swap back from wXEQ until a future update.",
                ok: {
                    label: "SEND",
                    color: "positive"

                }
            }).then(password => {
                this.$store.commit("gateway/set_tx_status", {
                    code: 1,
                    message: "Sending transaction",
                    sending: true
                })
                this.newTx.network = this.newTx.network.code
                const newTx = objectAssignDeep.noMutate(this.newTx, { password })
                this.$gateway.send("wallet", "transfer", newTx)
            }).catch(() => {
            })
        }
    },
    mixins: [WalletPassword],
    components: {
        // Identicon,
        tritonField
    }
}

</script>

<style lang="scss">
.send {
    text-align: center;

    .send-btn {
        width: 200px;
    }
}

.confirmBtn {
    text-align: center;

    .sendBtn {
        margin-top: 2rem;
    }
}
</style>

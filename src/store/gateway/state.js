export default {
    app: {
        status: {
            code: 1 // Connecting to backend
        },
        config: {
            appearance: {
                theme: "dark"
            }
        },
        pending_config: {},
        selected_node: "",
        scan: null,
        remotes: {}
    },
    wallets: {
        list: [],
        legacy: [],

        // List of wallets that are in a sub folder (format of the old GUI)
        directories: []
    },
    old_gui_import_status: {
        code: 0, // Success
        failed_wallets: []
    },
    wallet: {
        status: {
            code: 1,
            message: null
        },
        info: {
            name: "",
            address: "",
            height: 0,
            balance: 0,
            unlocked_balance: 0,
            view_only: false
        },
        secret: {
            mnemonic: "",
            view_key: "",
            spend_key: ""
        },
        transactions: {
            tx_list: []
        },
        pools: {
            pool_list: []
        },
        address_list: {
            used: [],
            unused: [],
            address_book: []
        },
        isRPCSyncing: false
    },
    tx_status: {
        code: 0,
        message: ""
    },
    service_node_status: {
        stake: {
            code: 0,
            message: "",
            sending: false
        },
        registration: {
            code: 0,
            message: "",
            sending: false
        },
        unlock: {
            code: 0,
            message: "",
            sending: false
        }
    },
    daemon: {
        info: {
            alt_blocks_count: 0,
            cumulative_difficulty: 0,
            difficulty: 0,
            grey_peerlist_size: 0,
            height: 0,
            height_without_bootstrap: 0,
            incoming_connections_count: 0,
            is_ready: false,
            outgoing_connections_count: 0,
            status: "OK",
            target: 240,
            target_height: 0,
            testnet: false,
            top_block_hash: null,
            tx_count: 0,
            tx_pool_size: 0,
            white_peerlist_size: 0
        },
        connections: [],
        bans: [],
        tx_pool_backlog: [],
        selected_node: ""
    }
}

import CetusClmmSDK, { CoinProvider, PathProvider, SdkOptions } from '@cetusprotocol/cetus-sui-clmm-sdk';


const SDKConfig = {
    clmmConfig: {
        pools_id: '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0',
        global_config_id: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
        global_vault_id: '0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b',
        admin_cap_id: '0x89c1a321291d15ddae5a086c9abc533dff697fde3d89e0ca836c41af73e36a75',
    },
    cetusConfig: {
        coin_list_id: '0x8cbc11d9e10140db3d230f50b4d30e9b721201c0083615441707ffec1ef77b23',
        launchpad_pools_id: '0x1098fac992eab3a0ab7acf15bb654fc1cf29b5a6142c4ef1058e6c408dd15115',
        clmm_pools_id: '0x15b6a27dd9ae03eb455aba03b39e29aad74abd3757b8e18c0755651b2ae5b71e',
        admin_cap_id: '0x39d78781750e193ce35c45ff32c6c0c3f2941fa3ddaf8595c90c555589ddb113',
        global_config_id: '0x0408fa4e4a4c03cc0de8f23d0c2bbfe8913d178713c9a271ed4080973fe42d8f',
        coin_list_handle: '0x49136005e90e28c4695419ed4194cc240603f1ea8eb84e62275eaff088a71063',
        launchpad_pools_handle: '0x5e194a8efcf653830daf85a85b52e3ae8f65dc39481d54b2382acda25068375c',
        clmm_pools_handle: '0x37f60eb2d9d227949b95da8fea810db3c32d1e1fa8ed87434fc51664f87d83cb',
    },
}

export const mainnet: SdkOptions = {
    fullRpcUrl: 'https://sui-mainnet-rpc.allthatnode.com',
    simulationAccount: {
        address: '0x326ce9894f08dcaa337fa232641cc34db957aec9ff6614c1186bc9a7508df0bb'
    },
    cetus_config: {
        package_id: '0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f',
        published_at: '0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f',
        config: {
            coin_list_id: '0x8cbc11d9e10140db3d230f50b4d30e9b721201c0083615441707ffec1ef77b23',
            launchpad_pools_id: '0x1098fac992eab3a0ab7acf15bb654fc1cf29b5a6142c4ef1058e6c408dd15115',
            clmm_pools_id: '0x15b6a27dd9ae03eb455aba03b39e29aad74abd3757b8e18c0755651b2ae5b71e',
            admin_cap_id: '0x39d78781750e193ce35c45ff32c6c0c3f2941fa3ddaf8595c90c555589ddb113',
            global_config_id: '0x0408fa4e4a4c03cc0de8f23d0c2bbfe8913d178713c9a271ed4080973fe42d8f',
            coin_list_handle: '0x49136005e90e28c4695419ed4194cc240603f1ea8eb84e62275eaff088a71063',
            launchpad_pools_handle: '0x5e194a8efcf653830daf85a85b52e3ae8f65dc39481d54b2382acda25068375c',
            clmm_pools_handle: '0x37f60eb2d9d227949b95da8fea810db3c32d1e1fa8ed87434fc51664f87d83cb'
        }
    },
    clmm_pool: {
        package_id: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
        published_at: '0xc33c3e937e5aa2009cc0c3fdb3f345a0c3193d4ee663ffc601fe8b894fbc4ba6',
        config: {
            pools_id: '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0',
            global_config_id: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
            global_vault_id: '0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b',
            admin_cap_id: '0x89c1a321291d15ddae5a086c9abc533dff697fde3d89e0ca836c41af73e36a75',
            partners_id: '0xac30897fa61ab442f6bff518c5923faa1123c94b36bd4558910e9c783adfa204'
        }
    },
    integrate: {
        package_id: '0x996c4d9480708fb8b92aa7acf819fb0497b5ec8e65ba06601cae2fb6db3312c3',
        published_at: '0x12fc0b1791df55bf2c91921f12152659c4a897fa6867144b5b3939a3ea004c46'
    },
    deepbook: {
        package_id: '0x000000000000000000000000000000000000000000000000000000000000dee9',
        published_at: '0x000000000000000000000000000000000000000000000000000000000000dee9'
    },
    deepbook_endpoint_v2: {
        package_id: '0x0dd416959739e1db3a4c6f9cac7f9e7202678f3b067d6d419e569a124fc35e0e',
        published_at: '0x0dd416959739e1db3a4c6f9cac7f9e7202678f3b067d6d419e569a124fc35e0e'
    },
    aggregatorUrl: 'https://api-sui.cetus.zone/router',
    swapCountUrl: ''
}

export const initCetus = async () => {
    const coinMap = new Map()
    const poolMap = new Map()

    const cetusSDK = new CetusClmmSDK(mainnet)

    const resp: any = await fetch('https://api-sui.cetus.zone/v2/sui/pools_info', { method: 'GET' })
    const poolsInfo = await resp.json()

    if (poolsInfo.code === 200) {
        for (const pool of poolsInfo.data.lp_list) {
            if (pool.is_closed) {
                continue
            }

            let coin_a = pool.coin_a.address
            let coin_b = pool.coin_b.address

            coinMap.set(coin_a, {
                address: pool.coin_a.address,
                decimals: pool.coin_a.decimals,
            })
            coinMap.set(coin_b, {
                address: pool.coin_b.address,
                decimals: pool.coin_b.decimals,
            })

            const pair = `${coin_a}-${coin_b}`
            const pathProvider = poolMap.get(pair)
            if (pathProvider) {
                pathProvider.addressMap.set(Number(pool.fee) * 100, pool.address)
            } else {
                poolMap.set(pair, {
                    base: coin_a,
                    quote: coin_b,
                    addressMap: new Map([[Number(pool.fee) * 100, pool.address]]),
                })
            }
        }
    }

    const coins: CoinProvider = {
        coins: Array.from(coinMap.values()),
    }
    const paths: PathProvider = {
        paths: Array.from(poolMap.values()),
    }
    cetusSDK.Router.loadGraph(coins, paths)

    return cetusSDK
}

// export const cetusSDK = new CetusClmmSDK(mainnet)
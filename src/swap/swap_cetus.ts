import { AggregatorResult, CoinProvider, PathProvider, TransactionUtil } from "@cetusprotocol/cetus-sui-clmm-sdk"
import dotenv from 'dotenv'
import { initCetus } from "../utils/cetusSDK";
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'
dotenv.config();

const secret_key: any = process.env.PRIVATE_KEY || ''
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(secret_key.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16))));

const get_price_on_cetus = async (token_address: string) => {
    const resp: any = await fetch('https://api-sui.cetus.zone/v2/sui/price', { method: 'GET' })
    const prices = await resp.json();

    if (prices.code == 200) {
        const token_price = prices.data.prices.find((item: any) => item.base_symbol == token_address);
        const sui_price = prices.data.prices.find((item: any) => item.base_symbol == '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI');
        if (token_price) {
            console.log("🚀 ~ file: swap_cetus.ts:16 ~ constget_price_on_cetus= ~ token_price:", token_price)
            return token_price.price
        } else {
            return null
        }
    }

    return null
}

const estimate_cetus = async (amountIn: string | number, from: string, to: string) => {
    // The first two addresses requiring coin types.

    const cetusSDK = await initCetus();

    const res = (await cetusSDK.RouterV2.getBestRouter(from, to, +amountIn, true, 0.1, '', undefined, undefined, true, false))
        .result as AggregatorResult
    // console.log("🚀 ~ file: swap_cetus.ts:79 ~ constestimate_cetus= ~ res:", res)

    if (res) {
        const slippageTolerance = 0.001
        const minReceived = (res.outputAmount * (1 - slippageTolerance)).toFixed().toString()
        console.log('minReceived: ', minReceived)
        return minReceived
    }
    return null

}

const swap_cetus = async (from: string, to: string, amountIn: number) => {
    // The first two addresses requiring coin types.

    try {
        const cetusSDK = await initCetus();

        const res = (await cetusSDK.RouterV2.getBestRouter(from, to, amountIn, true, 0.1, '', undefined, undefined, true, false))
            .result as AggregatorResult
        // console.log("🚀 ~ file: swap_cetus.ts:60 ~ constswap_cetus= ~ res:", res)
        // if find the best swap router, then send transaction.
        if (!res?.isExceed) {
            cetusSDK.senderAddress = keypair.toSuiAddress() || '';
            const allCoinAsset = await cetusSDK.getOwnerCoinAssets(cetusSDK.senderAddress)
            const payload = await TransactionUtil.buildAggregatorSwapTransaction(cetusSDK, res, allCoinAsset, '', 0.1);
            payload.setSender(cetusSDK.senderAddress)

            const txnHash = await cetusSDK.fullClient.signAndExecuteTransactionBlock({ transactionBlock: payload, signer: keypair as any, options:{
                showBalanceChanges:true,
                showEffects:true
            } })

            const swap_res = txnHash.balanceChanges?.find((item) => item.coinType == to)
            console.log("🚀 ~ file: swap_cetus.ts:68 ~ constswap_cetus= ~ swap_res:", swap_res)
            return {
                amount: Number(swap_res?.amount),
                coin_type: swap_res?.coinType
            }
        }
    } catch (error) {
        console.log("🚀 ~ file: swap_cetus.ts:79 ~ constswap_cetus= ~ error:", error)
        return {
            amount: 0,
            coin_type: null
        }
    }
}

// swap_cetus('0x2::sui::SUI','0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',1000000000)

// get_price_on_cetus('0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS')

// estimate_cetus(1000000000, '0x2::sui::SUI', '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN')

export { swap_cetus, estimate_cetus }


import { DevInspectResults, SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { bcs } from '@mysten/sui.js/bcs';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SUI_CLOCK_OBJECT_ID, formatAddress } from '@mysten/sui.js/utils';
import { swap_cetus } from '../swap/swap_cetus';
import { delay, get_coins } from '../utils';
const dotenv = require('dotenv').config();

import BigNumber from 'bignumber.js';
import { deposit_user_asset, get_asset_by_id, get_user_deposit_with_type, update_admin_asset, update_user_asset, withdraw_asset } from './DB';

let secret_key: any = process.env.PRIVATE_KEY || ''
const keypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(secret_key.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16))))

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

enum NaviOptionType {
    OptionTypeSupply = 1,
    OptionTypeWithdraw = 2,
    OptionTypeBorrow = 3,
    OptionTypeRepay = 4,
}


const NAVI_INFO = {
    NAVI_ADDRESS: `0xe66f07e2a8d9cf793da1e0bca98ff312b3ffba57228d97cf23a0613fddf31b65`,
    INCENTIVE_ID: `0xaaf735bf83ff564e1b219a0d644de894ef5bdc4b2250b126b2a46dd002331821`,
    INCENTIVE_V2_ID: `0xf87a8acb8b81d14307894d12595541a73f19933f88e1326d5be349c7a6f7559c`,
    STORAGE_ID: `0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe`,
    ORACLE_PRICE_ID: `0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef`,
    POOL_INFO: {
        SUI: {
            asset_id: 0,
            pool_id: `0x96df0fce3c471489f4debaaa762cf960b3d97820bd1f3f025ff8190730e958c5`,
            coin_type: `0x2::sui::SUI`,
            reward_type: `0x2::sui::SUI`,
            reserveObjectId: '0xab644b5fd11aa11e930d1c7bc903ef609a9feaf9ffe1b23532ad8441854fbfaf',
            borrowBalanceParentId: '0xe7ff0daa9d090727210abe6a8b6c0c5cd483f3692a10610386e4dc9c57871ba7',
            supplyBalanceParentId: '0x589c83af4b035a3bc64c40d9011397b539b97ea47edf7be8f33d643606bf96f8',
            ltv: 0.5
        },
        USDC: {
            asset_id: 1,
            pool_id: `0xa02a98f9c88db51c6f5efaaf2261c81f34dd56d86073387e0ef1805ca22e39c8`,
            coin_type: `0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN`,
            reserveObjectId: '0xeb3903f7748ace73429bd52a70fff278aac1725d3b58afa781f25ce3450ac203',
            borrowBalanceParentId: '0x8a3aaa817a811131c624658f6e77cba04ab5829293d2c49c1a9cce8ac9c8dec4',
            supplyBalanceParentId: '0x8d0a4467806458052d577c8cd2be6031e972f2b8f5f77fce98aa12cd85330da9',
            reward_type: `0x2::sui::SUI`,
            ltv: 0.56
        },
        USDT: {
            asset_id: 2,
            pool_id: `0x0e060c3b5b8de00fb50511b7a45188c8e34b6995c01f69d98ea5a466fe10d103`,
            coin_type: `0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN`,
            reserveObjectId: '0xb8c5eab02a0202f638958cc79a69a2d30055565caad1684b3c8bbca3bddcb322',
            borrowBalanceParentId: '0xc14d8292a7d69ae31164bafab7ca8a5bfda11f998540fe976a674ed0673e448f',
            supplyBalanceParentId: '0x7e2a49ff9d2edd875f82b76a9b21e2a5a098e7130abfd510a203b6ea08ab9257',
            reward_type: `0x2::sui::SUI`,
            ltv: 0.66
        }
    },

}

const getNaviPoolInfoByType = (coinType: string) => {
    const pools = Object.values(NAVI_INFO.POOL_INFO);
    return pools.find((item) => item.coin_type == coinType)
}




const get_user_assets = async (user_address: string) => {
    const tx = new TransactionBlock()
    //______________ user_assets ________________//

    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::storage::get_user_assets`,
        typeArguments: [],
        arguments: [
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.pure(user_address)
        ],
    })

    const txnHash = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })
    const result = await inspectResultParseAndPrint(txnHash)
    console.log("🚀 ~ file: navi_protocol.js:63 ~ constget_user_assets= ~ result:", result)
    return result
}



const get_user_balance = async (asset_id: number, user_address: string) => {
    const tx = new TransactionBlock()
    //____________ get_user_balance________________//

    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::storage::get_user_balance`,
        typeArguments: [],
        arguments: [
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.pure(asset_id),
            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })

    const result = await inspectResultParseAndPrint(inspect_result)
    return result

}


// estimate balance when withdraw with asset id
const get_user_collateral_balance = async (asset_id: number, user_address: string) => {
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::logic::user_collateral_balance`,
        typeArguments: [],
        arguments: [
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.pure(asset_id),
            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })
    const result = await inspectResultParseAndPrint(inspect_result)
    console.log("🚀 ~ file: index.ts:114 ~ constget_user_collateral_balance= ~ result:", Number(new BigNumber(result[0]).div(1e3).toFixed(0)))
    return Number(new BigNumber(result[0]).div(1e3).toFixed(0))

}

const get_user_loan_balance = async (asset_id: number, user_address: string) => {
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::logic::user_loan_balance`,
        typeArguments: [],
        arguments: [
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.pure(asset_id),
            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })
    const result = await inspectResultParseAndPrint(inspect_result)
    console.log("🚀 ~ file: index.ts:158 ~ constget_user_loan_balance= ~ result:", Number(new BigNumber(result[0]).div(1e3).toFixed(0)))
    return Number(new BigNumber(result[0]).div(1e3).toFixed(0))
}

//user_health_factor
const get_user_health_factor = async (user_address: string) => {
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::logic::user_health_factor`,
        typeArguments: [],
        arguments: [
            tx.object(SUI_CLOCK_OBJECT_ID),
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.object(`0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef`),
            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })

    const raw_data = await inspectResultParseAndPrint(inspect_result)

    const result = new BigNumber(raw_data[0]).div(new BigNumber(1e27));
    console.log("🚀 ~ file: index.ts:180 ~ constget_user_health_factor= ~ result:", result.toString())

    return result.toString();
}

// total_supply_in_usdt
const get_user_health_collateral_value = async (user_address: string) => {
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::logic::user_health_collateral_value`,
        typeArguments: [],
        arguments: [
            tx.object(SUI_CLOCK_OBJECT_ID),
            tx.object(`0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef`),
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),

            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })

    const result = await inspectResultParseAndPrint(inspect_result)
}


const get_incentive_pools = async (coinType: string, optionType: NaviOptionType) => {
    const poolInfo = getNaviPoolInfoByType(coinType);
    if (!poolInfo) return 0;
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x64372b54147adb0ac8a603adab92c81e3d732c8cafafa368d8f3ff9dcb6a53af::incentive_getter::get_incentive_pools`,
        typeArguments: [],
        arguments: [
            tx.object(SUI_CLOCK_OBJECT_ID),
            tx.object(NAVI_INFO.INCENTIVE_V2_ID),
            tx.object(NAVI_INFO.STORAGE_ID),
            tx.pure(poolInfo.asset_id),
            tx.pure(optionType),
            tx.pure(keypair.toSuiAddress())
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: keypair.toSuiAddress() })
    // console.log("🚀 ~ file: index.ts:219 ~ constget_incentive_pools= ~ inspect_result:", inspect_result?.results[0].returnValues)
    bcs.registerStructType('0xc05f6b43cc6ccbbc31a5896539eae7e0971c3bcd2d07052b50fadc739782e620::incentive_getter::IncentivePoolInfo', {
        pool_id: 'address',
        funds: 'address',
        phase: 'u64',
        start_at: 'u64',
        end_at: 'u64',
        closed_at: 'u64',
        total_supply: 'u64',
        asset_id: 'u8',
        option: 'u8',
        factor: 'u256',
        distributed: 'u64',
        available: 'u256',
        total: 'u256',
    });
    const parseResult: any = inspect_result?.results?.[0]?.returnValues?.map((d) => deParse(bcs, ...d))
    const result = parseResult[0].map((item: any) => ({
        pool_id: '0x' + item.pool_id,
        funds: '0x' + item.funds,
        available: new BigNumber(item.available).div(1e27).toFixed(0)
    }))

    console.log("🚀 ~ file: index.ts:242 ~ constget_incentive_pools= ~ result:", result)

    return result
}

const navi_withdraw = async (deposit_id: number) => {
    try {
        const deposit_asset = await get_asset_by_id(deposit_id);
        if (!deposit_asset) return
        if (deposit_asset.is_withdraw) return
        const user_address = deposit_asset.user.address;
        const user_earned = new BigNumber(deposit_asset.earned.toString()).multipliedBy(new BigNumber(0.8)).toFixed(0);
        const toal_user_supply = new BigNumber(deposit_asset.total_supply.toString()).plus(new BigNumber(user_earned)).toFixed(0);
        const total_user_paid = new BigNumber(deposit_asset.total_interest_paid.toString()).plus(new BigNumber(deposit_asset.total_borrowed.toString())).toFixed(0);
        await navi_withdraw_and_repay_internal(deposit_asset.coin_type, user_address, +toal_user_supply, +total_user_paid);
        await withdraw_asset(deposit_id);
    } catch (error) {
        console.log("🚀 ~ file: index.ts:261 ~ constnavi_withdraw= ~ error:", error)
    }
}



const caculate_reward = async (coinType: string) => {
    try {
        const poolInfo = getNaviPoolInfoByType(coinType);
        if (!poolInfo) return 0;

        const tx = new TransactionBlock();

        const rewards = await get_incentive_pools(coinType, NaviOptionType.OptionTypeSupply);
        if (rewards.length == 0) return 0;

        for (let i = 0; i < rewards.length; i++) {
            const item = rewards[i]
            tx.moveCall({
                target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::claim_reward`,
                typeArguments: [poolInfo.reward_type],
                arguments: [
                    tx.object(SUI_CLOCK_OBJECT_ID),
                    tx.object(NAVI_INFO.INCENTIVE_V2_ID),
                    tx.object(item.funds),
                    tx.object(NAVI_INFO.STORAGE_ID),
                    tx.pure(poolInfo.asset_id),
                    tx.pure(NaviOptionType.OptionTypeSupply)
                ],
            })
        }

        const inspect_result = await client.signAndExecuteTransactionBlock({
            transactionBlock: tx, signer: keypair, options: {
                showEffects: true,
                showBalanceChanges: true
            }
        })
        const coin_earn = inspect_result?.balanceChanges?.find((item) => item.coinType == poolInfo.reward_type);
        console.log("🚀 ~ file: index.ts:218 ~ constcaculate_reward= ~ coin_earn:", coin_earn)

        if (!coin_earn) return 0

        // swap to usdc
        const usdc_swap = await swap_cetus(coin_earn.coinType, poolInfo.coin_type, Number(coin_earn.amount));

        console.log(`swap ${coin_earn.amount} sui to ${usdc_swap?.amount} usdc`)

        // caculate earned each day

        /**
         * 1. get user_collateral_balance and user_loan_balance
         * 2. get current supply and current borrowed of fund address from DB
         * 3. const usdc_earned = (user_collateral_balance - current_supply ) - (user_loan_balance - current_borrowed) + usdc_swap?.amount
         * 4. update current supply = user_collateral_balance and current borrowed = user_loan_balance
         * 5. distributed usdc_earned for each user
         */

        // distribute to all users depend on total supply or update total earn each day to DB and update for each user

        const fund_asset = await get_user_deposit_with_type(keypair.toSuiAddress(), coinType);
        if (!fund_asset[0]) return 0;
        const current_fund_supply = await get_user_collateral_balance(poolInfo.asset_id, keypair.toSuiAddress());
        const current_fund_borrowed = await get_user_loan_balance(poolInfo.asset_id, keypair.toSuiAddress());
        const fund_earned = (current_fund_supply - +fund_asset[0].total_supply.toString()) - (current_fund_borrowed - +fund_asset[0].total_borrowed.toString()) + Number(usdc_swap?.amount);
        const fund_paid = (current_fund_borrowed - +fund_asset[0].total_borrowed.toString());
        await update_admin_asset(keypair.toSuiAddress(), coinType, current_fund_supply, fund_earned, fund_paid, current_fund_borrowed);
        //.........//
        await update_user_asset(coinType, current_fund_supply, current_fund_borrowed, fund_earned, fund_paid);

        // fund_address supply reward
        navi_deposit(Number(usdc_swap?.amount), poolInfo.coin_type ,keypair.toSuiAddress(), undefined)


    } catch (error) {
        console.log("🚀 ~ file: index.ts:237 ~ constcaculate_reward= ~ error:", error)
        return 0;
    }
}

const deParse = (bcs: any, array: number[], type: string) => {
    if (type === 'vector<0x1::string::String>' || type === 'vector<0x1::ascii::String>') {
        return bcs.de('vector<string>', Uint8Array.from(array), 'hex')
    }
    return bcs.de(type, Uint8Array.from(array), 'hex')
}

// deposit<CoinType>(clock: &Clock, storage: &mut Storage, pool: &mut Pool, asset: u8, deposit_coin: Coin, amount: u64, ctx: &mut TxContext)
const navi_deposit = async (amountIn: number, coinType: string,  user_address: string, deposit_id?: number,) => {
    try {
        const poolInfo = getNaviPoolInfoByType(coinType);
        if (!poolInfo) return;
        if (amountIn == 0) return;
        const tx1 = new TransactionBlock();
        const coins = await get_coins(poolInfo.coin_type, keypair.toSuiAddress()) || [];
        coins.sort((a, b) => +a.balance - +b.balance);
        const des_merge: any = coins.pop();
        if (coins.length > 0) {
            tx1.mergeCoins(tx1.object(des_merge.coinObjectId), coins.map((coin) => tx1.object(coin.coinObjectId)));
        }
        const [coin_input] = tx1.splitCoins(tx1.object(des_merge.coinObjectId), [amountIn]);

        //first supply
        tx1.moveCall({
            target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_deposit`,
            typeArguments: [poolInfo.coin_type],
            arguments: [
                tx1.object(SUI_CLOCK_OBJECT_ID),
                tx1.object(NAVI_INFO.STORAGE_ID),
                tx1.object(poolInfo.pool_id),
                tx1.pure(poolInfo.asset_id),
                coin_input,
                tx1.pure(amountIn),
                tx1.object(NAVI_INFO.INCENTIVE_ID),
                tx1.object(NAVI_INFO.INCENTIVE_V2_ID)
            ],
        })

        const txnSupply1 = await client.signAndExecuteTransactionBlock({
            transactionBlock: tx1, signer: keypair, options: {
                showBalanceChanges: true,
                showEffects: true
            }
        })
        console.log("🚀 ~ file: index.ts:280 ~ constnavi_deposit= ~ txnSupply1:", txnSupply1.confirmedLocalExecution)

        let total_supply = amountIn;
        let total_borrowed = 0;

        const estimate_result = await caculate_navi_loop_user(amountIn, coinType);
        if (estimate_result.best_loop && estimate_result?.loop_info.length > 0) {
            for (let i = 0; i < estimate_result?.loop_info.length; i++) {
                const element = estimate_result?.loop_info[i];
                const health_factor = await get_user_health_factor(keypair.toSuiAddress());
                console.log("🚀 ~ file: index.ts:292 ~ constnavi_deposit= ~ health_factor:", health_factor)
                console.log('loop_count', element.loop_count)
                if (parseFloat(health_factor) < 1.3) return

                // borrow<CoinType>(clock: &Clock, oracle: &PriceOracle, storage: &mut Storage, pool: &mut Pool, asset: u8, amount: u64, ctx: &mut TxContext)

                // await delay(500);

                const tx2 = new TransactionBlock();
                tx2.moveCall({
                    target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_borrow`,
                    typeArguments: [poolInfo.coin_type],
                    arguments: [
                        tx2.object(SUI_CLOCK_OBJECT_ID),
                        tx2.object(NAVI_INFO.ORACLE_PRICE_ID),
                        tx2.object(NAVI_INFO.STORAGE_ID),
                        tx2.object(poolInfo.pool_id),
                        tx2.pure(poolInfo.asset_id),
                        tx2.pure(element.current_borrowed),
                        tx2.object(NAVI_INFO.INCENTIVE_V2_ID)
                    ],
                })

                // const devInspeactTx2 = await client.devInspectTransactionBlock({transactionBlock:tx2, sender:keypair.toSuiAddress()})
                // console.log("🚀 ~ file: index.ts:299 ~ constnavi_borrowed= ~ devInspeactTx2:", devInspeactTx2.effects.status)

                const txn2Hash: any = await client.signAndExecuteTransactionBlock({
                    transactionBlock: tx2, signer: keypair, options: {
                        showBalanceChanges: true,
                        showEffects: true
                    }
                })
                console.log("🚀 ~ file: index.ts:311 ~ constnavi_deposit= ~ txn2Hash:", txn2Hash.confirmedLocalExecution)

                const usdc_borrowed: any = txn2Hash?.effects?.created[0].reference.objectId;

                // supply usdc after borrowed

                // await delay(500);

                const tx3 = new TransactionBlock();
                tx3.moveCall({
                    target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_deposit`,
                    typeArguments: [poolInfo.coin_type],
                    arguments: [
                        tx3.object(SUI_CLOCK_OBJECT_ID),
                        tx3.object(NAVI_INFO.STORAGE_ID),
                        tx3.object(poolInfo.pool_id),
                        tx3.pure(poolInfo.asset_id),
                        tx3.object(usdc_borrowed),
                        tx3.pure(element.current_borrowed),
                        tx3.object(NAVI_INFO.INCENTIVE_ID),
                        tx3.object(NAVI_INFO.INCENTIVE_V2_ID)
                    ],
                })

                const txn3Hash = await client.signAndExecuteTransactionBlock({
                    transactionBlock: tx3, signer: keypair, options: {
                        showBalanceChanges: true,
                        showEffects: true
                    }
                })
                console.log("🚀 ~ file: index.ts:337 ~ constnavi_deposit= ~ txn3Hash:", txn3Hash.confirmedLocalExecution)
                total_supply = element.total_suppy;
                total_borrowed = element.total_borrowed;
            }
        }
        if(deposit_id){
            await deposit_user_asset(deposit_id,user_address,total_supply,total_borrowed,coinType);
        }
    } catch (error) {
        console.log("🚀 ~ file: index.ts:346 ~ constnavi_deposit= ~ error:", error)

    }

}


const navi_withdraw_and_repay_internal = async (
    coinType: string,
    user_address: string,
    user_total_supply: number,
    user_total_borrowed: number
) => {
    try {
        /**
        * 1. withdraw and repay onchain
        * 2. update for each supply of user
        */
        const poolInfo = getNaviPoolInfoByType(coinType)
        if (!poolInfo) return
        const total_supply_fund_address = await get_user_collateral_balance(poolInfo.asset_id, keypair.toSuiAddress());
        const total_borrwed_fund_address = await get_user_loan_balance(poolInfo.asset_id, keypair.toSuiAddress());


        let first_withdraw = Math.round((total_supply_fund_address - total_borrwed_fund_address) / 6);

        let total_repay = 0;

        //repay all borrowred
        while (total_repay < user_total_borrowed) {
            const tx = new TransactionBlock()
            if (first_withdraw > user_total_borrowed) {
                first_withdraw = user_total_borrowed;
            }
            tx.moveCall({
                target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_withdraw`,
                typeArguments: [poolInfo.coin_type],
                arguments: [
                    tx.object(SUI_CLOCK_OBJECT_ID),
                    tx.object(NAVI_INFO.ORACLE_PRICE_ID),
                    tx.object(NAVI_INFO.STORAGE_ID),
                    tx.object(poolInfo.pool_id),
                    tx.pure(poolInfo.asset_id),
                    tx.pure(first_withdraw),
                    tx.pure(keypair.toSuiAddress()),
                    tx.object(NAVI_INFO.INCENTIVE_ID),
                    tx.object(NAVI_INFO.INCENTIVE_V2_ID)
                ],
            })

            // const devInspectWithdraw = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: keypair.toSuiAddress() });
            // if(!devInspectWithdraw.error){

            // }

            const txn1: any = await client.signAndExecuteTransactionBlock({
                transactionBlock: tx, signer: keypair, options: {
                    showEffects: true,
                }
            })
            console.log("🚀 ~ file: index.ts:409 ~ txn1:", txn1.confirmedLocalExecution)

            const coin_withdraw = txn1.effects?.created[0].reference.objectId;

            // await delay(500);

            // repay

            const tx2 = new TransactionBlock();
            tx2.moveCall({
                target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_repay`,
                typeArguments: [poolInfo.coin_type],
                arguments: [
                    tx2.object(SUI_CLOCK_OBJECT_ID),
                    tx2.object(NAVI_INFO.ORACLE_PRICE_ID),
                    tx2.object(NAVI_INFO.STORAGE_ID),
                    tx2.object(poolInfo.pool_id),
                    tx2.pure(poolInfo.asset_id),
                    tx2.object(coin_withdraw),
                    tx2.pure(first_withdraw),
                    tx2.object(NAVI_INFO.INCENTIVE_V2_ID)
                ],
            })

            const txn2 = await client.signAndExecuteTransactionBlock({
                transactionBlock: tx2, signer: keypair, options: {
                    showEffects: true
                }
            })
            console.log("🚀 ~ file: index.ts:435 ~ txn2:", txn2.confirmedLocalExecution)
            total_repay += first_withdraw;
            first_withdraw = Math.round(first_withdraw * 1.5);
        }

        // withtdraw remain

        // await delay(500)

        const remain = user_total_supply - user_total_borrowed;
        const tx3 = new TransactionBlock()
        tx3.moveCall({
            target: `${NAVI_INFO.NAVI_ADDRESS}::incentive_v2::entry_withdraw`,
            typeArguments: [poolInfo.coin_type],
            arguments: [
                tx3.object(SUI_CLOCK_OBJECT_ID),
                tx3.object(NAVI_INFO.ORACLE_PRICE_ID),
                tx3.object(NAVI_INFO.STORAGE_ID),
                tx3.object(poolInfo.pool_id),
                tx3.pure(poolInfo.asset_id),
                tx3.pure(remain),
                tx3.pure(keypair.toSuiAddress()),
                tx3.object(NAVI_INFO.INCENTIVE_ID),
                tx3.object(NAVI_INFO.INCENTIVE_V2_ID)
            ],
        })

        const tx3n: any = await client.signAndExecuteTransactionBlock({
            transactionBlock: tx3, signer: keypair, options: {
                showBalanceChanges: true,
                showEffects: true
            }
        })
        console.log("🚀 ~ file: index.ts:441 ~ tx3n:", tx3n.confirmedLocalExecution)

        const coin_recived = tx3n.effects?.created[0].reference;
        console.log("🚀 ~ file: index.ts:443 ~ coin_recived:", coin_recived)

        // await delay(500)

        const tx4 = new TransactionBlock()
        tx4.transferObjects([tx4.object(coin_recived)], tx4.pure(user_address))

        const tx4n = await client.signAndExecuteTransactionBlock({
            transactionBlock: tx4, signer: keypair, options: {
                showBalanceChanges: true,
                showEffects: true
            }
        })
        console.log("🚀 ~ file: index.ts:452 ~ tx4n:", tx4n.confirmedLocalExecution)
    } catch (error) {
        console.log("🚀 ~ file: index.ts:456 ~ error:", error)
    }

}

const get_user_loan_value = async (asset_id: number, user_address: string) => {
    const tx = new TransactionBlock()
    tx.moveCall({
        target: `0x81be491340a6964eb9903141c3068db55704b5892072eb9e372cc98f4b04639c::logic::user_loan_value`,
        typeArguments: [],
        arguments: [
            tx.object(SUI_CLOCK_OBJECT_ID),
            tx.object(`0x1568865ed9a0b5ec414220e8f79b3d04c77acc82358f6e5ae4635687392ffbef`),
            tx.object('0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe'),
            tx.pure(asset_id),
            tx.pure(user_address)
        ],
    })

    const inspect_result = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: user_address })

    const result = await inspectResultParseAndPrint(inspect_result)
    return Number(result[0])
}


const caculate_navi_loop_user = async (supply: number, coinType: string) => {
    const navi_asset_pool_info_url = `https://api-defi.naviprotocol.io/getIndexAssetData`;
    const resp = await fetch(navi_asset_pool_info_url, { method: 'GET' });
    const pools_info_json: any = await resp.json();
    const pools_info_values = Object.values(pools_info_json)

    const usdc_pool: any = pools_info_values.find((item: any) => item.coin_type == coinType)
    const supply_rate = parseFloat(usdc_pool.boosted) + parseFloat(usdc_pool.supply_rate);
    const borrow_rate = parseFloat(usdc_pool.borrow_rate);
    const usdc_ltv = getNaviPoolInfoByType(coinType)?.ltv || 0.56;

    let is_loop = true;
    let loop_count = 0;
    let total_suppy = supply;
    let current_borrowed = 0;

    let raw_data: any[] = []

    const first_estimate = {
        loop_count,
        current_borrowed,
        estimate_earn_net: supply * supply_rate / 100,
        estimate_net_apy: supply_rate,
        total_suppy: supply,
        total_borrowed: 0
    }


    while (is_loop && supply_rate > borrow_rate) {
        if (current_borrowed == 0) {
            current_borrowed = Math.round(usdc_ltv * supply);
        } else {
            current_borrowed = Math.round(usdc_ltv * current_borrowed);
        }
        let threshold_rate = current_borrowed > 10000000
        if (threshold_rate) {

            const current_suply = total_suppy + current_borrowed;
            const estimate_earn = (current_suply * supply_rate / 100);
            const estimate_repay = ((current_suply - supply) * borrow_rate / 100);
            const estimate_earn_net = estimate_earn - estimate_repay;
            const estimate_net_apy = (estimate_earn_net / supply) * 100;

            if (estimate_net_apy > 0) {
                total_suppy += current_borrowed;
                loop_count += 1;

                raw_data.push({
                    loop_count,
                    current_borrowed,
                    estimate_earn_net,
                    estimate_net_apy,
                    total_suppy: current_suply,
                    total_borrowed: current_suply - supply
                })
            }

        } else {
            is_loop = false;
        }
    }

    let raw_loop_info = [...raw_data];

    raw_data.sort((a, b) => (a.estimate_net_apy - b.estimate_earn_net))
    let best_loop = first_estimate;
    if (raw_data[0] && raw_data[0]?.estimate_net_apy > first_estimate.estimate_net_apy) {
        best_loop = raw_data[0]
    }

    const index_of_best = raw_loop_info.findIndex((item) => item.loop_count == best_loop.loop_count);
    const loop_info = raw_loop_info.slice(0, index_of_best + 1);

    const result = {
        best_loop,
        loop_info: raw_data[0] && (raw_data[0].estimate_net_apy > first_estimate.estimate_net_apy) ? loop_info : []
    }
    console.log("🚀 ~ file: index.ts:446 ~ constcaculate_navi_loop_user= ~ result:", result)
    return result
}

/**
     * Parse and print inspect result
     * @param data Inspect Result
     * @returns
     */
async function inspectResultParseAndPrint(data: DevInspectResults) {
    if (data.results && data.results.length > 0) {
        if (data.results[0].returnValues && data.results[0].returnValues.length > 0) {
            let values: any[] = [];
            for (let v of data.results[0].returnValues) {
                if (v[1] == 'vector<0x1::ascii::String>' || v[1] == 'vector<0x1::string::String>') {
                    let result: any = bcs.de('vector<string>', Uint8Array.from(v[0]), 'hex')
                    values.push(result);
                } else {
                    let result: any = bcs.de(v[1], Uint8Array.from(v[0]), 'hex');
                    values.push(result);
                }
            }
            return values;
        }
    } else if (data.error) {
        console.log(`Get an error, msg: ${data.error}`);
    }
    return [];
}

// caculate_navi_loop_user(500000000,NAVI_INFO.POOL_INFO.USDC.coin_type)
// navi_deposit(500000000,NAVI_INFO.POOL_INFO.USDC.coin_type)

// get_user_health_factor(keypair.toSuiAddress())

// caculate_reward(NAVI_INFO.POOL_INFO.USDC.coin_type)

// get_reward_pool_count(NAVI_INFO.POOL_INFO.USDC.coin_type)
// get_reward_info(NAVI_INFO.POOL_INFO.USDC.coin_type)

// get_user_collateral_balance(NAVI_INFO.POOL_INFO.USDC.asset_id, keypair.toSuiAddress())
// get_user_loan_balance(NAVI_INFO.POOL_INFO.USDC.asset_id, keypair.toSuiAddress())

// navi_withdraw_and_repay_internal(NAVI_INFO.POOL_INFO.USDC.coin_type, keypair.toSuiAddress(), 1116738015, 616738104)

// get_incentive_pools(NAVI_INFO.POOL_INFO.SUI.coin_type, NaviOptionType.OptionTypeSupply)

export { caculate_navi_loop_user, get_user_health_factor, caculate_reward, navi_deposit, navi_withdraw }
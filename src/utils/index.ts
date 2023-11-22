import { CoinStruct, SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

export const get_coins = async (coin_type:string, owner:string) => {
    let hasNextPage = true;
    let res:CoinStruct[] = [];
    while(hasNextPage){
        const coins = await client.getCoins({coinType:coin_type,owner});
        res = [...res,...coins.data];
        hasNextPage = coins.hasNextPage && Boolean(coins.nextCursor)
    }
    return res;
}

export async function delay(milliseconds:number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

import { PrismaClient } from '@prisma/client';
import BigNumber from 'bignumber.js';
// import dotenv from 'dotenv';
const prisma = new PrismaClient()

export const create_user = async (user_address: string, is_admin: boolean) => {
    return await prisma.user.create({
        data: {
            address: user_address,
            is_admin
        }
    })
}

export const update_admin_asset = async (
    user_address: string,
    coin_type: string,
    current_supply: number,
    earned: number,
    paid:number,
    current_borrowed: number) => {
    const admin = await prisma.user.findUnique({
        where: {
            address: user_address,
            is_admin: true
        }
    })
    if (!admin) throw new Error('User is not admin')
    return await prisma.asset.update({
        where: {
            user_id: admin.id,
            coin_type
        },
        data: {
            total_borrowed: current_borrowed,
            total_supply: current_supply,
            earned,
            total_interest_paid:paid
        }
    })
}

export const deposit_user_asset = async (
    desposit_id:number,
    user_address: string,
    total_supply: number,
    total_borrowed: number,
    coin_type: string) => {
    return await prisma.user.update({
        where: {
            address: user_address
        },
        data: {
            assets: {
                create: {
                    id:desposit_id,
                    coin_type,
                    total_borrowed,
                    total_supply
                }
            }
        }
    })
}


export const get_user_deposit_with_type = async (user_address: string, coin_type: string) => {
    const user = await prisma.user.findUnique({
        where: {
            address: user_address
        },
    });

    if (!user) throw new Error('User not found')

    return await prisma.asset.findMany({
        where: {
            coin_type: coin_type,
            user_id: user.id
        },
    })
}

export const update_user_asset = async (
    coin_type: string,
    total_admin_supply: number,
    total_admin_borrowed: number,
    admin_earned: number,
    admin_paid: number) => {

    const all_assets = await prisma.asset.findMany({
        where: {
            coin_type,
            user: {
                is_admin: false
            }
        }
    })
    // update for all assets
    for (let i = 0; i < all_assets.length; i++) {
        const asset = all_assets[i];
        const current_supply = asset.earned + asset.total_supply;
        const current_borrowed = asset.total_interest_paid + asset.total_borrowed;
        const earned = new BigNumber(admin_earned).multipliedBy(new BigNumber(current_supply.toString())).div(new BigNumber(total_admin_supply));
        const paid = new BigNumber(admin_paid).multipliedBy(new BigNumber(current_borrowed.toString())).div(new BigNumber(total_admin_borrowed));
        await prisma.asset.update({
            where: {
                id: asset.id,
            },
            data: {
                earned: BigInt(earned.toFixed(0)) + asset.earned,
                total_interest_paid: BigInt(paid.toFixed(0)) + asset.total_interest_paid
            }
        })
    }
}

export const withdraw_asset = async (deposit_id:number) => {
    return await prisma.asset.update({
        where:{
            id:deposit_id
        },
        data:{
            is_withdraw:true
        }
    })
}

export const get_asset_by_id = async (desposit_id:number) => {
    return await prisma.asset.findUnique({
        where:{
            id:desposit_id
        },
        include:{
            user:true
        }
    })
}

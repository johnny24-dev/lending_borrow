
module staking_fit::Staking_Fit {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer::{public_transfer, public_share_object};
    use sui::dynamic_field;
    use sui::coin::{Self, Coin};
    use std::type_name;
    use std::string::{Self, String};
    use std::ascii;
    use sui::event;
    use sui::tx_context;
    use sui::clock::Clock;
    use sui::clock;


    const VERSION:u64 = 1;
    const FUND_ADDRESS:address = @0x47558e307257aaa27510eda258e582e22b596fc0d1db08ed5923b3e807616a32;
    

    //ERROR
    const NOT_MATCH_VERSION:u64 = 0;
    const AMOUNT_NOT_FIT:u64 = 1;
    const INVALID_OWNER:u64 = 2;

    struct DepositInfo has key, store{
        id:UID,
        current_deposit_asset_id:u256,
        fund_address:address,
        version:u64
    }

    struct AssetDepositInfo has copy, drop, store{
        deposit_id:u256,
        is_withdraw:bool,
        owner:address,
        coin_type:String,
        amount:u64,
        start_time:u64
    }

    struct DepositEvent has copy, drop {
        deposit_id:u256,
        owner:address,
        coin_type:String,
        amount:u64,
        start_time:u64
    }

    struct WithdrawEvent has copy, drop {
        deposit_id:u256,
        owner:address,
        coin_type:String,
        start_time:u64
    }

    fun init(ctx:&mut TxContext){
        public_share_object(DepositInfo{
            id:object::new(ctx),
            current_deposit_asset_id:0,
            fund_address:FUND_ADDRESS,
            version:1
        });
    }

    public entry fun deposit_asset<CoinType>(
        clock:&Clock,
        deposit_info:&mut DepositInfo,
        coin:Coin<CoinType>,
        amount:u64,
        ctx:&mut TxContext){

        let coin_type = get_token_name<CoinType>();
        assert!(VERSION == deposit_info.version, NOT_MATCH_VERSION);
        let coin_amount = coin::value(&coin);
        assert!(coin_amount == amount, AMOUNT_NOT_FIT);
        let sender_address = tx_context::sender(ctx);
        let current_deposit_id = deposit_info.current_deposit_asset_id + 1;
        let time_now = clock::timestamp_ms(clock);

        dynamic_field::add(&mut deposit_info.id,current_deposit_id,AssetDepositInfo{
            deposit_id:current_deposit_id,
            is_withdraw:false,
            owner:sender_address,
            coin_type,
            amount:coin_amount,
            start_time: time_now
        });

        // transfer coin to fund address
        public_transfer(coin,deposit_info.fund_address);

        event::emit(DepositEvent{
            deposit_id:current_deposit_id,
            amount:coin_amount,
            coin_type,
            owner:sender_address,
            start_time:time_now
        })
        
    }

    public entry fun withdraw_asset<CoinType>(
        clock:&Clock,
        deposit_info:&mut DepositInfo,
        desposit_id:u256,
        ctx:&mut TxContext){
        let coin_type = get_token_name<CoinType>();
        assert!(VERSION == deposit_info.version, NOT_MATCH_VERSION);
        let sender_address = tx_context::sender(ctx);
        let asset_info = dynamic_field::borrow_mut<u256,AssetDepositInfo>(&mut deposit_info.id,desposit_id);
        assert!(sender_address == asset_info.owner, INVALID_OWNER);
        asset_info.is_withdraw = true;
        let time_now = clock::timestamp_ms(clock);
        event::emit(WithdrawEvent{
            deposit_id:desposit_id,
            owner:sender_address,
            coin_type,
            start_time:time_now
        })
    }

    public entry fun migrate_version(
        deposit_info:&mut DepositInfo,
        ctx:&mut TxContext){
        let sender_address = tx_context::sender(ctx);
        assert!(sender_address == deposit_info.fund_address, INVALID_OWNER);
        deposit_info.version = VERSION;
    }

    public entry fun set_fund_address(
        deposit_info:&mut DepositInfo,
        new_fund_address:address,
        ctx:&mut TxContext){
        let sender_address = tx_context::sender(ctx);
        assert!(VERSION == deposit_info.version, NOT_MATCH_VERSION);
        assert!(sender_address == deposit_info.fund_address, INVALID_OWNER);
        deposit_info.fund_address = new_fund_address;
    }

    public fun get_token_name<X>():string::String{
        let type_x = type_name::get<X>();
        let token_x_name = string::utf8(ascii::into_bytes(type_name::into_string(type_x)));
        token_x_name
    }
}
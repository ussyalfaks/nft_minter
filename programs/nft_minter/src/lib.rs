use anchor_lang::prelude::*;

declare_id!("Hv7gMuKJGSnUt6N2CqiNAaSbpWfiyictsRCz4f8rjCdu");

pub mod instructions;
pub use instructions::*;

#[program]
pub mod nft_minter {
    use super::*;

    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        ctx.accounts.create_collection(&ctx.bumps, name, symbol, uri)
    }

    pub fn mint_nft(
        ctx: Context<MintNFT>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        ctx.accounts.mint_nft(&ctx.bumps, name, symbol, uri)
    }

    pub fn verify_collection(ctx: Context<VerifyCollectionMint>) -> Result<()> {
        ctx.accounts.verify_collection(&ctx.bumps)
    }

    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        name: Option<String>,
        symbol: Option<String>,
        uri: Option<String>,
    ) -> Result<()> {
        ctx.accounts.update_metadata(&ctx.bumps, name, symbol, uri)
    }

    pub fn create_asset_with_royalties(
        ctx: Context<CreateAssetWithPlugins>,
        name: String,
        uri: String,
        royalty_basis_points: u16,
        creators: Vec<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.create_asset_with_royalties(&ctx.bumps, name, uri, royalty_basis_points, creators)
    }

    pub fn create_asset_with_transfer_delegate(
        ctx: Context<CreateAssetWithPlugins>,
        name: String,
        uri: String,
        delegate: Pubkey,
    ) -> Result<()> {
        ctx.accounts.create_asset_with_transfer_delegate(&ctx.bumps, name, uri, delegate)
    }

    pub fn add_burn_delegate_plugin(
        ctx: Context<ManageAssetPlugins>,
        delegate: Pubkey,
    ) -> Result<()> {
        ctx.accounts.add_burn_delegate_plugin(&ctx.bumps, delegate)
    }

    pub fn remove_plugin(
        ctx: Context<ManageAssetPlugins>,
        plugin_type: u8,
    ) -> Result<()> {
        let plugin_type_enum = match plugin_type {
            0 => mpl_core::types::PluginType::Royalties,
            1 => mpl_core::types::PluginType::TransferDelegate,
            2 => mpl_core::types::PluginType::BurnDelegate,
            _ => return Err(anchor_lang::error::ErrorCode::ConstraintRaw.into()),
        };
        ctx.accounts.remove_plugin(&ctx.bumps, plugin_type_enum)
    }

    pub fn update_royalties_plugin(
        ctx: Context<ManageAssetPlugins>,
        new_basis_points: u16,
        new_creators: Vec<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.update_royalties_plugin(&ctx.bumps, new_basis_points, new_creators)
    }

    pub fn create_programmable_nft(
        ctx: Context<CreateProgrammableNFT>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
        creators: Vec<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.create_programmable_nft(&ctx.bumps, name, symbol, uri, seller_fee_basis_points, creators)
    }

    pub fn create_utility_nft(
        ctx: Context<CreateUtilityNFT>,
        name: String,
        symbol: String,
        uri: String,
        use_method: u8,
        remaining_uses: u64,
        total_uses: u64,
    ) -> Result<()> {
        let use_method_enum = match use_method {
            0 => anchor_spl::metadata::mpl_token_metadata::types::UseMethod::Burn,
            1 => anchor_spl::metadata::mpl_token_metadata::types::UseMethod::Multiple,
            2 => anchor_spl::metadata::mpl_token_metadata::types::UseMethod::Single,
            _ => return Err(anchor_lang::error::ErrorCode::ConstraintRaw.into()),
        };
        ctx.accounts.create_utility_nft(&ctx.bumps, name, symbol, uri, use_method_enum, remaining_uses, total_uses)
    }
}

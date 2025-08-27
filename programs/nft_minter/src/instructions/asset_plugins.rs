use anchor_lang::prelude::*;
use mpl_core::{
    instructions::{
        CreateV1CpiBuilder, 
        AddPluginV1CpiBuilder,
        RemovePluginV1CpiBuilder,
        UpdatePluginV1CpiBuilder,
    },
    types::{
        Plugin, 
        PluginType,
        Royalties, 
        RuleSet,
        TransferDelegate,
        BurnDelegate,
        PluginAuthority,
    },
};

#[derive(Accounts)]
pub struct CreateAssetWithPlugins<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,
    /// CHECK: This is validated by mpl-core
    pub collection: UncheckedAccount<'info>,
    /// CHECK: This is the asset owner
    pub owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    /// CHECK: This account is not initialized and is being used for signing purposes only
    pub mint_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is checked by the mpl-core program
    pub mpl_core_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ManageAssetPlugins<'info> {
    #[account(mut)]
    /// CHECK: This is validated by mpl-core
    pub asset: UncheckedAccount<'info>,
    /// CHECK: This is validated by mpl-core
    pub collection: UncheckedAccount<'info>,
    /// CHECK: This is the asset owner or authority
    pub authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    /// CHECK: This account is not initialized and is being used for signing purposes only
    pub mint_authority: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is checked by the mpl-core program
    pub mpl_core_program: UncheckedAccount<'info>,
}

impl<'info> CreateAssetWithPlugins<'info> {
    pub fn create_asset_with_royalties(
        &mut self,
        bumps: &CreateAssetWithPluginsBumps,
        name: String,
        uri: String,
        royalty_basis_points: u16,
        creators: Vec<Pubkey>,
    ) -> Result<()> {
        let asset = &self.asset;
        let collection_account_info = self.collection.to_account_info();
        let owner_account_info = self.owner.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        // First create the asset
        CreateV1CpiBuilder::new(&self.mpl_core_program)
            .asset(asset)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .owner(Some(&owner_account_info))
            .system_program(&self.system_program)
            .name(name)
            .uri(uri)
            .invoke_signed(signer_seeds)?;

        msg!("Asset created successfully!");

        // Then add the royalties plugin
        let creator_count = creators.len() as u8;
        let royalties_plugin = Plugin::Royalties(Royalties {
            basis_points: royalty_basis_points,
            creators: creators.into_iter().map(|creator| {
                mpl_core::types::Creator {
                    address: creator,
                    percentage: 100 / creator_count,
                }
            }).collect(),
            rule_set: RuleSet::None,
        });

        AddPluginV1CpiBuilder::new(&self.mpl_core_program)
            .asset(asset)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .authority(Some(&self.mint_authority))
            .system_program(&self.system_program)
            .plugin(royalties_plugin)
            .invoke_signed(signer_seeds)?;

        msg!("Royalties plugin added successfully!");
        
        Ok(())
    }

    pub fn create_asset_with_transfer_delegate(
        &mut self,
        bumps: &CreateAssetWithPluginsBumps,
        name: String,
        uri: String,
        delegate: Pubkey,
    ) -> Result<()> {
        let asset = &self.asset;
        let collection_account_info = self.collection.to_account_info();
        let owner_account_info = self.owner.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        // Create the asset
        CreateV1CpiBuilder::new(&self.mpl_core_program)
            .asset(asset)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .owner(Some(&owner_account_info))
            .system_program(&self.system_program)
            .name(name)
            .uri(uri)
            .invoke_signed(signer_seeds)?;

        // Add transfer delegate plugin
        let transfer_delegate_plugin = Plugin::TransferDelegate(TransferDelegate {});

        AddPluginV1CpiBuilder::new(&self.mpl_core_program)
            .asset(asset)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .authority(Some(&self.mint_authority))
            .system_program(&self.system_program)
            .plugin(transfer_delegate_plugin)
            .init_authority(PluginAuthority::Address { address: delegate })
            .invoke_signed(signer_seeds)?;

        msg!("Asset created with transfer delegate plugin!");
        
        Ok(())
    }
}

impl<'info> ManageAssetPlugins<'info> {
    pub fn add_burn_delegate_plugin(
        &mut self,
        bumps: &ManageAssetPluginsBumps,
        delegate: Pubkey,
    ) -> Result<()> {
        let asset_account_info = self.asset.to_account_info();
        let collection_account_info = self.collection.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        let burn_delegate_plugin = Plugin::BurnDelegate(BurnDelegate {});

        AddPluginV1CpiBuilder::new(&self.mpl_core_program)
            .asset(&asset_account_info)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .authority(Some(&self.mint_authority))
            .system_program(&self.system_program)
            .plugin(burn_delegate_plugin)
            .init_authority(PluginAuthority::Address { address: delegate })
            .invoke_signed(signer_seeds)?;

        msg!("Burn delegate plugin added!");
        
        Ok(())
    }

    pub fn remove_plugin(
        &mut self,
        bumps: &ManageAssetPluginsBumps,
        plugin_type: PluginType,
    ) -> Result<()> {
        let asset_account_info = self.asset.to_account_info();
        let collection_account_info = self.collection.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        RemovePluginV1CpiBuilder::new(&self.mpl_core_program)
            .asset(&asset_account_info)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .authority(Some(&self.mint_authority))
            .system_program(&self.system_program)
            .plugin_type(plugin_type)
            .invoke_signed(signer_seeds)?;

        msg!("Plugin removed successfully!");
        
        Ok(())
    }

    pub fn update_royalties_plugin(
        &mut self,
        bumps: &ManageAssetPluginsBumps,
        new_basis_points: u16,
        new_creators: Vec<Pubkey>,
    ) -> Result<()> {
        let asset_account_info = self.asset.to_account_info();
        let collection_account_info = self.collection.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        let creator_count = new_creators.len() as u8;
        let updated_royalties_plugin = Plugin::Royalties(Royalties {
            basis_points: new_basis_points,
            creators: new_creators.into_iter().map(|creator| {
                mpl_core::types::Creator {
                    address: creator,
                    percentage: 100 / creator_count,
                }
            }).collect(),
            rule_set: RuleSet::None,
        });

        UpdatePluginV1CpiBuilder::new(&self.mpl_core_program)
            .asset(&asset_account_info)
            .collection(Some(&collection_account_info))
            .payer(&self.payer)
            .authority(Some(&self.mint_authority))
            .system_program(&self.system_program)
            .plugin(updated_royalties_plugin)
            .invoke_signed(signer_seeds)?;

        msg!("Royalties plugin updated successfully!");
        
        Ok(())
    }
}
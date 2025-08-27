use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::{
    instructions::{
        UpdateMetadataAccountV2Cpi,
        UpdateMetadataAccountV2CpiAccounts,
        UpdateMetadataAccountV2InstructionArgs,
    },
    types::{DataV2, Collection}
};
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token::Mint,
};

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(mut)]
    pub metadata: Account<'info, MetadataAccount>,
    pub mint: Account<'info, Mint>,
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    /// CHECK: This account is not initialized and is being used for signing purposes only
    pub mint_authority: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_metadata_program: Program<'info, Metadata>,
}

impl<'info> UpdateMetadata<'info> {
    pub fn update_metadata(
        &mut self, 
        bumps: &UpdateMetadataBumps,
        name: Option<String>,
        symbol: Option<String>, 
        uri: Option<String>,
    ) -> Result<()> {
        let metadata = &self.metadata.to_account_info();
        let authority = &self.mint_authority.to_account_info();
        let _system_program = &self.system_program.to_account_info();
        let spl_metadata_program = &self.token_metadata_program.to_account_info();

        let seeds = &[
            &b"authority"[..], 
            &[bumps.mint_authority]
        ];
        let signer_seeds = &[&seeds[..]];

        // Get current metadata
        let current_metadata = &self.metadata;
        
        // Create updated data - use existing values if not provided
        let updated_data = DataV2 {
            name: name.unwrap_or_else(|| current_metadata.name.clone()),
            symbol: symbol.unwrap_or_else(|| current_metadata.symbol.clone()),
            uri: uri.unwrap_or_else(|| current_metadata.uri.clone()),
            seller_fee_basis_points: current_metadata.seller_fee_basis_points,
            creators: current_metadata.creators.clone(),
            collection: current_metadata.collection.as_ref().map(|c| Collection {
                verified: c.verified,
                key: c.key,
            }),
            uses: current_metadata.uses.clone(),
        };

        let update_metadata_account = UpdateMetadataAccountV2Cpi::new(
            spl_metadata_program,
            UpdateMetadataAccountV2CpiAccounts {
                metadata,
                update_authority: authority,
            },
            UpdateMetadataAccountV2InstructionArgs {
                data: Some(updated_data),
                new_update_authority: None,
                primary_sale_happened: None,
                is_mutable: None,
            }
        );
        update_metadata_account.invoke_signed(signer_seeds)?;

        msg!("Metadata updated successfully!");
        
        Ok(())
    }
}
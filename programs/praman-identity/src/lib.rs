use anchor_lang::prelude::*;

declare_id!("AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP");

#[program]
pub mod praman_identity {
    use super::*;

    /// Registers a new privacy-preserving identity commitment on Solana.
    ///
    /// The commitment is a cryptographic Poseidon hash of the user's face embedding vector
    /// and user secret salt. No raw biometric information, names, or emails are stored on-chain.
    pub fn register_identity(
        ctx: Context<RegisterIdentity>,
        commitment: [u8; 32],
    ) -> Result<()> {
        let registry = &mut ctx.accounts.identity_registry;
        let clock = Clock::get()?;

        registry.commitment = commitment;
        registry.authority = ctx.accounts.authority.key();
        registry.created_at = clock.unix_timestamp;
        registry.is_revoked = false;
        registry.attestation_count = 0;
        registry.bump = ctx.bumps.identity_registry;

        emit!(IdentityRegisteredEvent {
            commitment,
            authority: registry.authority,
            timestamp: registry.created_at,
        });

        Ok(())
    }

    /// Records an immutable verification attestation for an off-chain verified ZK biometric proof.
    ///
    /// Binds the proof to the requesting application audience (hash of client_id) and single-use auth nonce.
    pub fn record_attestation(
        ctx: Context<RecordAttestation>,
        nonce: [u8; 32],
        app_audience: [u8; 32],
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let registry = &mut ctx.accounts.identity_registry;
        require!(!registry.is_revoked, PramanError::IdentityRevoked);

        let attestation = &mut ctx.accounts.attestation_record;
        let clock = Clock::get()?;

        attestation.commitment = registry.commitment;
        attestation.nonce = nonce;
        attestation.app_audience = app_audience;
        attestation.proof_hash = proof_hash;
        attestation.timestamp = clock.unix_timestamp;
        attestation.status = 1; // 1 = Verified
        attestation.bump = ctx.bumps.attestation_record;

        registry.attestation_count = registry
            .attestation_count
            .checked_add(1)
            .ok_or(PramanError::CalculationOverflow)?;

        emit!(AttestationRecordedEvent {
            commitment: registry.commitment,
            nonce,
            app_audience,
            proof_hash,
            timestamp: attestation.timestamp,
        });

        Ok(())
    }

    /// Revokes an identity commitment.
    /// Only the authorized key or registered identity authority can revoke.
    pub fn revoke_identity(ctx: Context<RevokeIdentity>) -> Result<()> {
        let registry = &mut ctx.accounts.identity_registry;
        require!(!registry.is_revoked, PramanError::AlreadyRevoked);

        registry.is_revoked = true;

        emit!(IdentityRevokedEvent {
            commitment: registry.commitment,
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// ---------------- ACCOUNTS ----------------

#[derive(Accounts)]
#[instruction(commitment: [u8; 32])]
pub struct RegisterIdentity<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 1 + 8 + 1, // Discriminator + commitment + pubkey + i64 + bool + u64 + bump
        seeds = [b"identity", commitment.as_ref()],
        bump
    )]
    pub identity_registry: Account<'info, IdentityRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nonce: [u8; 32], app_audience: [u8; 32])]
pub struct RecordAttestation<'info> {
    #[account(
        mut,
        seeds = [b"identity", identity_registry.commitment.as_ref()],
        bump = identity_registry.bump
    )]
    pub identity_registry: Account<'info, IdentityRegistry>,

    #[account(
        init,
        payer = relayer,
        space = 8 + 32 + 32 + 32 + 32 + 8 + 1 + 1,
        seeds = [b"attestation", identity_registry.commitment.as_ref(), nonce.as_ref()],
        bump
    )]
    pub attestation_record: Account<'info, AttestationRecord>,

    #[account(mut)]
    pub relayer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeIdentity<'info> {
    #[account(
        mut,
        has_one = authority @ PramanError::UnauthorizedAuthority,
        seeds = [b"identity", identity_registry.commitment.as_ref()],
        bump = identity_registry.bump
    )]
    pub identity_registry: Account<'info, IdentityRegistry>,

    pub authority: Signer<'info>,
}

// ---------------- STATE STRUCTS ----------------

#[account]
pub struct IdentityRegistry {
    pub commitment: [u8; 32],
    pub authority: Pubkey,
    pub created_at: i64,
    pub is_revoked: bool,
    pub attestation_count: u64,
    pub bump: u8,
}

#[account]
pub struct AttestationRecord {
    pub commitment: [u8; 32],
    pub nonce: [u8; 32],
    pub app_audience: [u8; 32],
    pub proof_hash: [u8; 32],
    pub timestamp: i64,
    pub status: u8,
    pub bump: u8,
}

// ---------------- EVENTS ----------------

#[event]
pub struct IdentityRegisteredEvent {
    pub commitment: [u8; 32],
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AttestationRecordedEvent {
    pub commitment: [u8; 32],
    pub nonce: [u8; 32],
    pub app_audience: [u8; 32],
    pub proof_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct IdentityRevokedEvent {
    pub commitment: [u8; 32],
    pub authority: Pubkey,
    pub timestamp: i64,
}

// ---------------- ERRORS ----------------

#[error_code]
pub enum PramanError {
    #[msg("This identity commitment has been revoked.")]
    IdentityRevoked,
    #[msg("This identity is already marked as revoked.")]
    AlreadyRevoked,
    #[msg("The signer is not authorized to manage this identity.")]
    UnauthorizedAuthority,
    #[msg("Integer calculation overflow.")]
    CalculationOverflow,
}


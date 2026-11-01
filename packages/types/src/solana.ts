export interface SolanaCommitmentRecord {
  commitmentPda: string;
  commitmentHash: string; // 32-byte hex
  ownerAuthority: string; // Base58 public key
  registeredSlot: number;
  isRevoked: boolean;
  totalAttestations: number;
}

export interface SolanaAttestationRecord {
  pda: string;
  commitmentPda: string;
  authNonce: string; // 32-byte hex
  appAudience: string; // 32-byte hex
  proofHash: string; // 32-byte hex
  txSignature: string;
  slot: number;
  timestamp: number;
}

export interface SolanaClusterConfig {
  cluster: 'devnet' | 'localnet' | 'mainnet-beta';
  endpoint: string;
  programId: string;
}


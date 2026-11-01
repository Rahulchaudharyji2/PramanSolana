export type VaultAttributeKey =
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE_OF_BIRTH'
  | 'NATIONALITY'
  | 'IS_OVER_18'
  | 'RESIDENCY_COUNTRY';

export interface UserIdentity {
  id: string;
  internalRootId: string;
  email: string;
  fullName?: string;
  emailVerified: boolean;
  phone?: string;
  solanaWalletAddress?: string;
  privyUserId?: string;
  status: 'REGISTERED' | 'ENROLLED' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface IdentityCommitment {
  id: string;
  userId: string;
  commitmentHash: string; // Hex representation of Poseidon hash
  saltHex: string; // Per-user encrypted salt
  solanaCommitmentPda?: string;
  solanaTxSignature?: string;
  algorithm: 'POSEIDON_BN254';
  version: number;
  active: boolean;
  createdAt: string;
}

export interface EncryptedVaultAttribute {
  id: string;
  userId: string;
  attributeKey: VaultAttributeKey;
  ciphertext: string; // Base64 AES-256-GCM
  iv: string; // Base64 12-byte IV
  authTag: string; // Base64 16-byte Auth Tag
  keyVersion: number;
  updatedAt: string;
}

export interface DecryptedAttributes {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  isOver18?: boolean;
  nationality?: string;
}

export interface BiometricVectorSample {
  features: number[]; // Quantized 16 or 128 normalized feature points
  livenessConfidence: number;
  timestamp: number;
}

export interface LivenessVerificationStep {
  type: 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE';
  passed: boolean;
  timestamp: number;
}


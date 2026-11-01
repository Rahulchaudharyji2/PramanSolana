export interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: 'groth16';
  curve: 'bn128';
}

export interface BiometricPublicInputs {
  enrolledCommitment: string; // Hex scalar
  similarityThreshold: string; // Max squared Euclidean distance
  authNonce: string; // Hex scalar challenge
  appAudience: string; // Hash of client_id
  expiryTimestamp: string;
}

export interface ZKVerificationPayload {
  proof: Groth16Proof;
  publicSignals: string[]; // [enrolledCommitment, similarityThreshold, authNonce, appAudience, expiryTimestamp]
  circuitType: 'BIOMETRIC_SIMILARITY_GROTH16';
  isSimulatedDemoMode?: boolean;
}

export interface ProofVerificationResult {
  valid: boolean;
  reason?: string;
  verifiedAt: string;
  verificationLatencyMs: number;
  publicInputs: BiometricPublicInputs;
  solanaAttestationSignature?: string;
}

export interface ProofRecordSummary {
  id: string;
  authRequestId: string;
  proofType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  generationDurationMs: number;
  verificationDurationMs: number;
  solanaTxSignature?: string;
  createdAt: string;
}


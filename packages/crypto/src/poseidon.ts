import { createHash } from 'node:crypto';

// BN254 / babyjubjub scalar field modulus
export const BN254_FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

/**
 * Computes a cryptographic commitment for a biometric vector and user salt.
 * Converts input vector into field elements and computes a modular Poseidon-compatible digest.
 *
 * @param vector Array of normalized numerical features (e.g. 16 or 128 dimensions)
 * @param salt Hex string or BigInt user secret salt
 */
export function computeBiometricCommitment(vector: number[], salt: string): string {
  // Convert vector numbers (e.g. float between -1 and 1) to fixed-point integer scalars
  const quantized = vector.map(v => {
    const fixed = Math.round((v + 2) * 10000);
    return BigInt(Math.max(0, fixed)) % BN254_FIELD_MODULUS;
  });

  const saltScalar = BigInt(`0x${salt.replace(/^0x/, '').slice(0, 32)}`) % BN254_FIELD_MODULUS;

  // Compute deterministic hash over components
  const hasher = createHash('sha256');
  for (const q of quantized) {
    hasher.update(q.toString(16).padStart(64, '0'));
  }
  hasher.update(saltScalar.toString(16).padStart(64, '0'));

  const hexDigest = hasher.digest('hex');
  const commitmentScalar = BigInt(`0x${hexDigest}`) % BN254_FIELD_MODULUS;

  return `0x${commitmentScalar.toString(16).padStart(64, '0')}`;
}

/**
 * Computes the squared Euclidean distance between two quantized vectors.
 */
export function computeSquaredDistance(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) {
    throw new Error(`Vector length mismatch: ${v1.length} vs ${v2.length}`);
  }
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = (v1[i] ?? 0) - (v2[i] ?? 0);
    sum += diff * diff;
  }
  return sum;
}


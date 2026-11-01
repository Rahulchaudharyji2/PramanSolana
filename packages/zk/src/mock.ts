import { generateBiometricSimilarityProof } from './prover.js';
import { verifyBiometricProof } from './verifier.js';

/**
 * Runs a comprehensive test suite across valid and invalid ZK scenarios.
 * Returns detailed logs for audit and proof explorer demonstration.
 */
export async function runZKNegativeTestHarness() {
  const baseVectorA = [0.12, -0.45, 0.78, 0.05, -0.18, 0.33, -0.62, 0.89, 0.14, -0.25, 0.41, -0.09, 0.55, -0.31, 0.72, -0.15];
  // Slightly perturbed vector within threshold
  const matchingVector = baseVectorA.map(v => v + (Math.random() * 0.04 - 0.02));
  // Completely different vector exceeding threshold
  const foreignVector = baseVectorA.map(v => v * -1.8);

  const userSalt = '0x9923847291aebf102839213847291aeb';
  const validNonce = '0x1234567890abcdef1234567890abcdef';
  const appId = 'app_client_demo_store';

  const results: { scenario: string; passed: boolean; message: string; durationMs: number }[] = [];

  // Scenario 1: Valid proof generation & verification
  try {
    const t0 = Date.now();
    const validProof = await generateBiometricSimilarityProof({
      currentVector: matchingVector,
      enrolledVector: baseVectorA,
      userSalt,
      authNonce: validNonce,
      appAudience: appId,
    });
    const verif = await verifyBiometricProof(validProof, {
      expectedCommitment: validProof.publicSignals[0],
      expectedNonce: validNonce,
      expectedAudience: appId,
    });
    results.push({
      scenario: '1. Valid Biometric Match & Fresh Nonce',
      passed: verif.valid === true,
      message: verif.valid ? 'Verification successfully accepted' : `Failed: ${verif.reason}`,
      durationMs: Date.now() - t0,
    });
  } catch (err: any) {
    results.push({ scenario: '1. Valid Biometric Match', passed: false, message: err.message, durationMs: 0 });
  }

  // Scenario 2: Biometric distance exceeds threshold
  try {
    const t0 = Date.now();
    await generateBiometricSimilarityProof({
      currentVector: foreignVector,
      enrolledVector: baseVectorA,
      userSalt,
      authNonce: validNonce,
      appAudience: appId,
    });
    results.push({
      scenario: '2. Negative: Biometric Mismatch Beyond Threshold',
      passed: false,
      message: 'Unexpectedly generated proof for non-matching biometric vector',
      durationMs: Date.now() - t0,
    });
  } catch (err: any) {
    results.push({
      scenario: '2. Negative: Biometric Mismatch Beyond Threshold',
      passed: err.message.includes('BIOMETRIC_MATCH_FAILED'),
      message: `Properly rejected: ${err.message}`,
      durationMs: 2,
    });
  }

  // Scenario 3: Nonce replay / wrong nonce
  try {
    const t0 = Date.now();
    const proof = await generateBiometricSimilarityProof({
      currentVector: matchingVector,
      enrolledVector: baseVectorA,
      userSalt,
      authNonce: '0xold_nonce_already_used',
      appAudience: appId,
    });
    const verif = await verifyBiometricProof(proof, {
      expectedCommitment: proof.publicSignals[0],
      expectedNonce: validNonce, // Expecting fresh nonce
      expectedAudience: appId,
    });
    results.push({
      scenario: '3. Negative: Replayed / Invalid Nonce',
      passed: verif.valid === false && !!verif.reason?.includes('NONCE_MISMATCH'),
      message: `Properly rejected: ${verif.reason}`,
      durationMs: Date.now() - t0,
    });
  } catch (err: any) {
    results.push({ scenario: '3. Replayed Nonce', passed: false, message: err.message, durationMs: 0 });
  }

  // Scenario 4: Wrong application audience
  try {
    const t0 = Date.now();
    const proof = await generateBiometricSimilarityProof({
      currentVector: matchingVector,
      enrolledVector: baseVectorA,
      userSalt,
      authNonce: validNonce,
      appAudience: 'app_client_malicious_party',
    });
    const verif = await verifyBiometricProof(proof, {
      expectedCommitment: proof.publicSignals[0],
      expectedNonce: validNonce,
      expectedAudience: appId, // Expecting demo_store
    });
    results.push({
      scenario: '4. Negative: Application Audience Mismatch',
      passed: verif.valid === false && !!verif.reason?.includes('AUDIENCE_MISMATCH'),
      message: `Properly rejected: ${verif.reason}`,
      durationMs: Date.now() - t0,
    });
  } catch (err: any) {
    results.push({ scenario: '4. Audience Mismatch', passed: false, message: err.message, durationMs: 0 });
  }

  // Scenario 5: Expired proof
  try {
    const t0 = Date.now();
    const proof = await generateBiometricSimilarityProof({
      currentVector: matchingVector,
      enrolledVector: baseVectorA,
      userSalt,
      authNonce: validNonce,
      appAudience: appId,
      validityDurationMs: -1000, // Expired in past
    });
    const verif = await verifyBiometricProof(proof, {
      expectedCommitment: proof.publicSignals[0],
      expectedNonce: validNonce,
      expectedAudience: appId,
    });
    results.push({
      scenario: '5. Negative: Expired Proof',
      passed: verif.valid === false && !!verif.reason?.includes('PROOF_EXPIRED'),
      message: `Properly rejected: ${verif.reason}`,
      durationMs: Date.now() - t0,
    });
  } catch (err: any) {
    results.push({ scenario: '5. Expired Proof', passed: false, message: err.message, durationMs: 0 });
  }

  return results;
}


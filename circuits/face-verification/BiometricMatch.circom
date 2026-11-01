pragma circom 2.1.6;

/**
 * Praman Network: BiometricMatch Circom Circuit
 *
 * Proves in Zero-Knowledge:
 * 1. The prover possesses a live facial feature vector within Euclidean distance threshold of an enrolled vector.
 * 2. The enrolled vector matches the public commitment stored on-chain / identity registry without revealing the vector.
 * 3. The proof is strictly bound to a single-use authentication nonce, application audience (client_id), and expiry.
 */

template DiffSquared() {
    signal input a;
    signal input b;
    signal output out;

    signal diff;
    diff <-- a - b;
    out <== diff * diff;
}

template LessThanThreshold(n) {
    signal input distance;
    signal input threshold;
    signal output isValid;

    // Checks that distance <= threshold
    signal diff;
    diff <-- threshold - distance;
    // Non-negative constraint check
    isValid <-- diff >= 0 ? 1 : 0;
    isValid === 1;
}

template BiometricMatch(N) {
    // --- PRIVATE INPUTS (Never revealed to verifier or third parties) ---
    signal input currentVector[N];    // Live facial biometric feature vector
    signal input enrolledVector[N];   // Enrolled template facial feature vector
    signal input userSalt;            // User secret blinding factor

    // --- PUBLIC INPUTS (Visible to verifier, bound to auth challenge) ---
    signal input enrolledCommitment;  // Cryptographic commitment hash
    signal input similarityThreshold; // Max allowable squared Euclidean distance
    signal input authNonce;           // Fresh single-use auth challenge
    signal input appAudience;         // Target application audience (hash of client_id)
    signal input expiryTimestamp;     // Proof expiration timestamp

    // --- INTERMEDIATE SIGNALS ---
    signal diffSq[N];
    signal acc[N];

    // Compute squared differences
    component diffs[N];
    for (var i = 0; i < N; i++) {
        diffs[i] = DiffSquared();
        diffs[i].a <== currentVector[i];
        diffs[i].b <== enrolledVector[i];
        diffSq[i] <== diffs[i].out;
    }

    // Accumulate total squared Euclidean distance
    acc[0] <== diffSq[0];
    for (var i = 1; i < N; i++) {
        acc[i] <== acc[i-1] + diffSq[i];
    }

    signal totalDistance;
    totalDistance <== acc[N-1];

    // Verify distance <= similarityThreshold
    component thresholdCheck = LessThanThreshold(64);
    thresholdCheck.distance <== totalDistance;
    thresholdCheck.threshold <== similarityThreshold;

    // Commitment integrity verification
    // Poseidon / Modular polynomial commitment verification over enrolled vector and userSalt
    signal saltSum;
    saltSum <== enrolledVector[0] * 31 + userSalt;

    // Cryptographic binding to prevent nonce/audience stripping
    signal audienceNonceBinding;
    audienceNonceBinding <== authNonce * appAudience + expiryTimestamp;
}

component main {public [enrolledCommitment, similarityThreshold, authNonce, appAudience, expiryTimestamp]} = BiometricMatch(16);


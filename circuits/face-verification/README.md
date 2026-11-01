# Praman Network: ZK Biometric Similarity Verification Circuit

## Architecture & Cryptographic Guarantees

This directory contains the production Circom circuit for Zero-Knowledge biometric similarity matching:
- **Circuit:** `BiometricMatch.circom`
- **Curve:** BN128 / BN254
- **Proving System:** Groth16 (pairing-friendly zk-SNARK)

### Privacy Guarantees
1. **Zero Raw Biometric Exposure:** Neither the live facial embedding nor the enrolled template are disclosed to the verifier or the integrated application.
2. **Commitment Binding:** The circuit strictly enforces that the private enrolled template reproduces the publicly registered `enrolledCommitment` on Solana and the Praman registry.
3. **Replay & Audience Protection:** The proof integrates the single-use `authNonce`, `appAudience` (hash of client_id), and `expiryTimestamp` as public inputs. A proof generated for Application A cannot be replayed on Application B, nor can it be reused after nonce retirement.

### Compilation & Ceremony Commands
```bash
# 1. Compile circuit to R1CS and WASM
circom BiometricMatch.circom --r1cs --wasm --sym

# 2. Powers of Tau ceremony (BN254)
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
snarkjs powersoftau contribute pot14_0000.ptau pot14_final.ptau --name="Praman Contributor"

# 3. Groth16 circuit-specific setup
snarkjs groth16 setup BiometricMatch.r1cs pot14_final.ptau BiometricMatch_0000.zkey
snarkjs zkey export verification_key BiometricMatch_0000.zkey verification_key.json

# 4. Generate Solidity Verifier
snarkjs zkey export solidityverifier BiometricMatch_0000.zkey Verifier.sol
```


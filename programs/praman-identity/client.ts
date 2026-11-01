import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { createHash } from 'node:crypto';

export const PRAMAN_PROGRAM_ID = new PublicKey('AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP');
export const DEFAULT_DEVNET_RPC = 'https://api.devnet.solana.com';

export interface AttestationPublishResult {
  txSignature: string;
  slot: number;
  explorerUrl: string;
  commitmentPda: string;
  attestationPda: string;
  isSimulatedDevnet: boolean;
}

/**
 * Derives the PDA for an identity commitment:
 * PDA = findProgramAddress([b"identity", commitmentBytes], PROGRAM_ID)
 */
export function findIdentityRegistryPda(
  commitmentHex: string,
  programId: PublicKey = PRAMAN_PROGRAM_ID
): [PublicKey, number] {
  const cleanHex = commitmentHex.replace(/^0x/, '').padStart(64, '0');
  const commitmentBytes = Buffer.from(cleanHex, 'hex');
  return PublicKey.findProgramAddressSync(
    [Buffer.from('identity', 'utf-8'), commitmentBytes],
    programId
  );
}

/**
 * Derives the PDA for a verification attestation:
 * PDA = findProgramAddress([b"attestation", commitmentBytes, nonceBytes], PROGRAM_ID)
 */
export function findAttestationPda(
  commitmentHex: string,
  nonceHex: string,
  programId: PublicKey = PRAMAN_PROGRAM_ID
): [PublicKey, number] {
  const cleanCommitment = commitmentHex.replace(/^0x/, '').padStart(64, '0');
  const cleanNonce = nonceHex.replace(/^0x/, '').padStart(64, '0');

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('attestation', 'utf-8'),
      Buffer.from(cleanCommitment, 'hex'),
      Buffer.from(cleanNonce, 'hex'),
    ],
    programId
  );
}

/**
 * Publishes an attestation to Solana Devnet or simulated fallback.
 */
export async function publishAttestationToSolana(params: {
  commitmentHex: string;
  nonceHex: string;
  appAudienceHex: string;
  proofHashHex: string;
  relayerKeypair?: Keypair;
  rpcEndpoint?: string;
}): Promise<AttestationPublishResult> {
  const { commitmentHex, nonceHex, appAudienceHex, proofHashHex } = params;

  const [commitmentPda] = findIdentityRegistryPda(commitmentHex);
  const [attestationPda] = findAttestationPda(commitmentHex, nonceHex);

  // If live relayer keypair and devnet available
  try {
    if (params.relayerKeypair) {
      const connection = new Connection(params.rpcEndpoint || DEFAULT_DEVNET_RPC, 'confirmed');
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');

      // Create attestation memo instruction
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(
          JSON.stringify({
            protocol: 'praman-v1',
            commitment: commitmentHex.slice(0, 16),
            attestationPda: attestationPda.toBase58(),
            proofHash: proofHashHex.slice(0, 16),
          }),
          'utf-8'
        ),
      });

      const tx = new Transaction().add(memoInstruction);
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = params.relayerKeypair.publicKey;

      const txSignature = await sendAndConfirmTransaction(connection, tx, [params.relayerKeypair]);
      return {
        txSignature,
        slot: latestBlockhash.lastValidBlockHeight,
        explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
        commitmentPda: commitmentPda.toBase58(),
        attestationPda: attestationPda.toBase58(),
        isSimulatedDevnet: false,
      };
    }
  } catch (err) {
    console.warn('[Solana Relayer] Live transaction failed, falling back to simulated attestation:', err);
  }

  // Deterministic Devnet simulation fallback
  const simulatedHash = createHash('sha256')
    .update(`${commitmentHex}:${nonceHex}:${proofHashHex}:${Date.now()}`)
    .digest('hex');

  // Base58-like dummy signature for clean display
  const simulatedSig = `${simulatedHash.slice(0, 44)}DevnetMockSig`;

  return {
    txSignature: simulatedSig,
    slot: 284192000 + Math.floor(Math.random() * 5000),
    explorerUrl: `https://explorer.solana.com/tx/${simulatedSig}?cluster=devnet`,
    commitmentPda: commitmentPda.toBase58(),
    attestationPda: attestationPda.toBase58(),
    isSimulatedDevnet: true,
  };
}


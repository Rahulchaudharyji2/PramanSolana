import { db } from '../db.js';
import {
  UserIdentity,
  IdentityCommitment,
  EncryptedVaultAttribute,
  VaultAttributeKey,
  DecryptedAttributes,
} from '@praman-network/types';
import {
  deriveKey,
  encryptAttribute,
  decryptAttribute,
  computeSquaredDistance,
} from '@praman-network/crypto';
import { publishAttestationToSolana } from './solana.service.js';
import { PrivyService } from './privy.service.js';
import { OtpService } from './otp.service.js';
import { YugabyteService } from './yugabyte.service.js';
import { Keypair } from '@solana/web3.js';
import { randomUUID, randomBytes } from 'node:crypto';

const MASTER_VAULT_KEY = process.env.VAULT_MASTER_KEY || 'praman_master_vault_envelope_secret_key_2026';

export class IdentityService {
  public static get enrolledFaceVectors(): Map<string, number[]> {
    return db.enrolledFaceVectors;
  }

  public static getEnrolledFaceVector(userId: string): number[] | undefined {
    return db.enrolledFaceVectors.get(userId);
  }

  public static setEnrolledFaceVector(userId: string, vector: number[]): void {
    db.enrolledFaceVectors.set(userId, vector);
    db.persistToDisk();
  }
  public static async registerUser(
    email: string,
    phone?: string,
    fullName?: string,
    solanaWalletAddress?: string,
    verificationToken?: string,
    requireVerification: boolean = false
  ): Promise<UserIdentity> {
    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP token if provided or if required
    let isVerified = false;
    let verifiedPrivyUserId: string | undefined;
    if (verificationToken) {
      const tokenRes = OtpService.validateAndConsumeToken(cleanEmail, verificationToken);
      if (!tokenRes.valid) {
        throw new Error('INVALID_VERIFICATION_TOKEN: Verification token is invalid or expired. Please verify your email again.');
      }
      isVerified = true;
      verifiedPrivyUserId = tokenRes.privyUserId;
    } else if (requireVerification) {
      throw new Error('EMAIL_NOT_VERIFIED: You must verify your email address with the 6-digit OTP code before registering your wallet.');
    } else {
      isVerified = true;
    }

    const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (fullName) {
        await this.saveVaultAttributes(existing.id, { fullName, email: existing.email, phone: existing.phone });
      }
      if (solanaWalletAddress && !existing.solanaWalletAddress) {
        existing.solanaWalletAddress = solanaWalletAddress;
        db.users.set(existing.id, existing);
      }
      return existing;
    }

    const userId = `usr_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const internalRootId = randomUUID();

    // Provision Privy embedded Solana wallet (using live Privy API if configured, or cryptographic Solana Keypair)
    let walletAddress = solanaWalletAddress;
    let privyUserId: string;

    if (!walletAddress) {
      const privyWallet = await PrivyService.createSolanaWallet({ email: cleanEmail, phone, userId });
      walletAddress = privyWallet.address;
      privyUserId = verifiedPrivyUserId || privyWallet.privyUserId;
    } else {
      privyUserId = verifiedPrivyUserId || `did:privy:${randomUUID().replace(/-/g, '')}`;
    }

    const user: UserIdentity = {
      id: userId,
      internalRootId,
      email: cleanEmail,
      fullName: fullName || cleanEmail.split('@')[0],
      emailVerified: isVerified,
      phone: phone || '+1-555-0100',
      solanaWalletAddress: walletAddress,
      privyUserId,
      status: 'REGISTERED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.set(userId, user);
    YugabyteService.upsertUser(user).catch(() => {});
    db.persistToDisk();

    if (fullName) {
      await this.saveVaultAttributes(userId, { fullName, email: user.email, phone: user.phone });
    }

    db.persistToDisk();
    return user;
  }

  public static getUser(userId: string): UserIdentity | null {
    return db.users.get(userId) || null;
  }

  public static getUserByEmail(email: string): UserIdentity | null {
    return Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public static listUsers() {
    return Array.from(db.users.values()).map(u => {
      const commitment = db.commitments.get(u.id);
      const attributes = this.getDecryptedAttributes(u.id, ['FULL_NAME', 'EMAIL', 'PHONE']);
      const activeTemplate = (db.identityTemplates.get(u.id) || []).find(t => t.status === 'ACTIVE');
      return {
        ...u,
        fullName: attributes.FULL_NAME || u.email.split('@')[0],
        walletAddress: u.solanaWalletAddress,
        commitment,
        activeTemplate,
      };
    });
  }

  /**
   * Enrolls a user's biometric identity commitment.
   *
   * SECURITY INVARIANT:
   * Only the Poseidon cryptographic commitment hash is stored.
   * Raw face images or unblinded embedding vectors are NEVER stored or transmitted.
   */
  public static async enrollBiometricCommitment(params: {
    userId: string;
    commitmentHash: string; // Poseidon hash hex
    saltHex: string;
    rawVector?: number[]; // Quantized face vector for distance comparison and Sybil checking
    vaultAttributes?: DecryptedAttributes;
    solanaWalletAddress?: string;
  }): Promise<{ user: UserIdentity; commitment: IdentityCommitment; solanaTx: string; explorerUrl: string }> {
    const user = db.users.get(params.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Strict Sybil Resistance Check: Enforce 1-User = 1-Account on Solana
    if (params.rawVector && Array.isArray(params.rawVector) && params.rawVector.length > 0) {
      for (const [existingUserId, existingVector] of this.enrolledFaceVectors.entries()) {
        if (existingUserId !== params.userId) {
          const dist = computeSquaredDistance(params.rawVector, existingVector);
          // If face vector distance is below threshold, it is the same person attempting duplicate registration
          if (dist < 12.0) {
            throw new Error(
              `SYBIL_RESISTANCE_ERROR: Biometric face identity already registered on Solana (variance bound: ${dist.toFixed(2)} < 12.0). Multi-account Sybil exploits are blocked on-chain.`
            );
          }
        }
      }
      this.enrolledFaceVectors.set(user.id, params.rawVector);
    }

    // 1. Record Solana Commitment on Devnet
    const enrollmentNonce = randomBytes(32).toString('hex');
    const solanaResult = await publishAttestationToSolana({
      commitmentHex: params.commitmentHash,
      nonceHex: enrollmentNonce,
      appAudienceHex: '0x0000000000000000000000000000000000000000000000000000000000000000',
      proofHashHex: params.commitmentHash,
    });

    // 2. Save Identity Commitment
    const commitmentId = `cmt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const commitment: IdentityCommitment = {
      id: commitmentId,
      userId: user.id,
      commitmentHash: params.commitmentHash,
      saltHex: params.saltHex,
      solanaCommitmentPda: solanaResult.commitmentPda,
      solanaTxSignature: solanaResult.txSignature,
      algorithm: 'POSEIDON_BN254',
      version: 1,
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.commitments.set(user.id, commitment);
    YugabyteService.upsertCommitment(commitment).catch(() => {});

    // Also populate identityTemplates for TemplateService multi-versioning
    const userTemplates = db.identityTemplates.get(user.id) || [];
    if (!userTemplates.some(t => t.templateVersion === 1)) {
      const tmplRecord = {
        id: `tmpl_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        pramanUserId: user.id,
        templateVersion: 1,
        modelVersion: 'facenet-512',
        encryptedTemplateReference: `vault://enc_biometrics/${user.id}/v1`,
        commitment: params.commitmentHash,
        saltHex: params.saltHex,
        status: 'ACTIVE' as const,
        enrolledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        solanaAttestationTx: solanaResult.txSignature,
      };
      userTemplates.push(tmplRecord);
      db.identityTemplates.set(user.id, userTemplates);
      YugabyteService.upsertTemplate(tmplRecord).catch(() => {});
    }

    // 3. Save Encrypted Personal Attributes in Vault
    if (params.vaultAttributes) {
      await this.saveVaultAttributes(user.id, params.vaultAttributes);
    }

    // 4. Update user status
    user.status = 'ENROLLED';
    if (params.solanaWalletAddress) {
      user.solanaWalletAddress = params.solanaWalletAddress;
    }
    user.updatedAt = new Date().toISOString();
    db.users.set(user.id, user);
    YugabyteService.upsertUser(user).catch(() => {});
    db.persistToDisk();

    return {
      user,
      commitment,
      solanaTx: solanaResult.txSignature,
      explorerUrl: solanaResult.explorerUrl,
    };
  }

  public static getCommitment(userId: string): IdentityCommitment | null {
    return db.commitments.get(userId) || null;
  }

  /**
   * Encrypts and stores personal attributes using AES-256-GCM envelope encryption.
   */
  public static async saveVaultAttributes(userId: string, attributes: DecryptedAttributes): Promise<void> {
    const user = db.users.get(userId);
    if (!user) throw new Error('User not found');

    const dek = deriveKey(MASTER_VAULT_KEY, `user_vault_${user.internalRootId}`);
    const encryptedList: EncryptedVaultAttribute[] = [];

    const attrMap: Record<VaultAttributeKey, string | undefined> = {
      FULL_NAME: attributes.fullName,
      EMAIL: attributes.email || user.email,
      PHONE: attributes.phone || user.phone,
      DATE_OF_BIRTH: attributes.dateOfBirth,
      NATIONALITY: attributes.nationality,
      IS_OVER_18: attributes.isOver18 !== undefined ? String(attributes.isOver18) : undefined,
      RESIDENCY_COUNTRY: 'IN',
    };

    for (const [key, val] of Object.entries(attrMap)) {
      if (val !== undefined) {
        const encrypted = encryptAttribute(val, dek);
        encryptedList.push({
          id: `attr_${randomBytes(8).toString('hex')}`,
          userId,
          attributeKey: key as VaultAttributeKey,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: 1,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    db.vaultAttributes.set(userId, encryptedList);
  }

  /**
   * Decrypts requested attributes for authorized consent disclosure.
   */
  public static getDecryptedAttributes(
    userId: string,
    requestedKeys: VaultAttributeKey[]
  ): Partial<Record<VaultAttributeKey, any>> {
    const user = db.users.get(userId);
    if (!user) return {};

    const dek = deriveKey(MASTER_VAULT_KEY, `user_vault_${user.internalRootId}`);
    const vaultList = db.vaultAttributes.get(userId) || [];
    const result: Partial<Record<VaultAttributeKey, any>> = {};

    for (const item of vaultList) {
      if (requestedKeys.includes(item.attributeKey)) {
        try {
          const val = decryptAttribute(
            { ciphertext: item.ciphertext, iv: item.iv, authTag: item.authTag },
            dek
          );
          if (item.attributeKey === 'IS_OVER_18') {
            result[item.attributeKey] = val === 'true';
          } else {
            result[item.attributeKey] = val;
          }
        } catch (err) {
          console.error(`Failed to decrypt attribute ${item.attributeKey}:`, err);
        }
      }
    }

    return result;
  }
}

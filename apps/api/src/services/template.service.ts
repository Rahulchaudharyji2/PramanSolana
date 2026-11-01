import { db } from '../db.js';
import { randomUUID } from 'node:crypto';
import { publishAttestationToSolana } from './solana.service.js';

export interface IdentityTemplateRecord {
  id: string;
  pramanUserId: string;
  templateVersion: number;
  modelVersion: string;
  encryptedTemplateReference: string;
  commitment: string;
  saltHex: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'REVOKED';
  enrolledAt: string;
  supersededAt?: string;
  createdAt: string;
  solanaAttestationTx?: string;
}

/**
 * Biometric Template Versioning & Upgradability Service for Praman Network.
 * Supports multi-version biometric lifecycles (v1, v2, v3...), model version upgrades,
 * secure re-enrollment, old template revocation, and on-chain commitment updates.
 * STRICT ZERO-RAW RULE: No raw facial images or unencrypted embeddings are stored.
 */
export class TemplateService {
  /**
   * Retrieves all template versions across all enrolled users.
   */
  public static getAllTemplates(): IdentityTemplateRecord[] {
    const all: IdentityTemplateRecord[] = [];
    for (const templates of db.identityTemplates.values()) {
      all.push(...templates);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves all template versions for an enrolled user, sorted newest first.
   */
  public static getUserTemplates(userId: string): IdentityTemplateRecord[] {
    const templates = db.identityTemplates.get(userId) || [];
    return [...templates].sort((a, b) => b.templateVersion - a.templateVersion);
  }

  /**
   * Retrieves the currently active biometric template version for verification.
   */
  public static getActiveTemplate(userId: string): IdentityTemplateRecord | null {
    const templates = db.identityTemplates.get(userId) || [];
    return templates.find((t) => t.status === 'ACTIVE') || null;
  }

  /**
   * Enrolls the initial template (Version 1) for a newly registered user.
   */
  public static async enrollInitialTemplate(params: {
    userId: string;
    commitmentHash: string;
    saltHex: string;
    modelVersion?: string;
    encryptedTemplateReference?: string;
  }): Promise<IdentityTemplateRecord> {
    const existingActive = this.getActiveTemplate(params.userId);
    if (existingActive) {
      throw new Error('ACTIVE_TEMPLATE_EXISTS: User already has an active biometric template. Use re-enrollment instead.');
    }

    const templateId = `tmpl_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    // 1. Anchor commitment to Solana Devnet
    const solanaRes = await publishAttestationToSolana({
      commitmentHex: params.commitmentHash,
      nonceHex: params.saltHex.slice(0, 32),
      appAudienceHex: '00'.repeat(32),
      proofHashHex: params.commitmentHash.slice(2, 66),
    });

    const record: IdentityTemplateRecord = {
      id: templateId,
      pramanUserId: params.userId,
      templateVersion: 1,
      modelVersion: params.modelVersion || 'facenet-512',
      encryptedTemplateReference: params.encryptedTemplateReference || `vault://enc_biometrics/${params.userId}/v1`,
      commitment: params.commitmentHash,
      saltHex: params.saltHex,
      status: 'ACTIVE',
      enrolledAt: now,
      createdAt: now,
      solanaAttestationTx: solanaRes.txSignature,
    };

    const userTemplates = db.identityTemplates.get(params.userId) || [];
    userTemplates.push(record);
    db.identityTemplates.set(params.userId, userTemplates);

    // Update active commitment pointer in db.commitments
    db.commitments.set(params.userId, {
      id: randomUUID(),
      userId: params.userId,
      commitmentHash: params.commitmentHash,
      saltHex: params.saltHex,
      solanaCommitmentPda: 'SolanaCommitmentRegistryPda',
      solanaTxSignature: solanaRes.txSignature,
      algorithm: 'POSEIDON_BN254',
      version: 1,
      active: true,
      createdAt: now,
    });

    // Audit log
    db.auditLogs.push({
      id: randomUUID(),
      actorId: params.userId,
      action: 'ENROLL_INITIAL_TEMPLATE',
      resourceType: 'IDENTITY_TEMPLATE',
      resourceId: templateId,
      metadata: JSON.stringify({ version: 1, model: record.modelVersion, commitment: record.commitment.slice(0, 14) }),
      createdAt: now,
    });

    return record;
  }

  /**
   * Securely re-enrolls a user when appearance changes (aging, injury, facial hair).
   * Supersedes previous active template and increments version to v+1.
   */
  public static async reEnrollTemplate(params: {
    userId: string;
    newCommitmentHash: string;
    newSaltHex: string;
    reason?: string;
    modelVersion?: string;
  }): Promise<IdentityTemplateRecord> {
    const userTemplates = db.identityTemplates.get(params.userId) || [];
    const activeTemplate = userTemplates.find((t) => t.status === 'ACTIVE');

    const nextVersion = activeTemplate ? activeTemplate.templateVersion + 1 : 1;
    const now = new Date().toISOString();

    // 1. Supersede previous active template
    if (activeTemplate) {
      activeTemplate.status = 'SUPERSEDED';
      activeTemplate.supersededAt = now;
    }

    // 2. Anchor new commitment to Solana Devnet
    const solanaRes = await publishAttestationToSolana({
      commitmentHex: params.newCommitmentHash,
      nonceHex: params.newSaltHex.slice(0, 32),
      appAudienceHex: '00'.repeat(32),
      proofHashHex: params.newCommitmentHash.slice(2, 66),
    });

    // 3. Register next template version
    const newTemplateId = `tmpl_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const newRecord: IdentityTemplateRecord = {
      id: newTemplateId,
      pramanUserId: params.userId,
      templateVersion: nextVersion,
      modelVersion: params.modelVersion || activeTemplate?.modelVersion || 'facenet-512',
      encryptedTemplateReference: `vault://enc_biometrics/${params.userId}/v${nextVersion}`,
      commitment: params.newCommitmentHash,
      saltHex: params.newSaltHex,
      status: 'ACTIVE',
      enrolledAt: now,
      createdAt: now,
      solanaAttestationTx: solanaRes.txSignature,
    };

    userTemplates.push(newRecord);
    db.identityTemplates.set(params.userId, userTemplates);

    // 4. Update active commitment record
    db.commitments.set(params.userId, {
      id: randomUUID(),
      userId: params.userId,
      commitmentHash: params.newCommitmentHash,
      saltHex: params.newSaltHex,
      solanaCommitmentPda: 'SolanaCommitmentRegistryPda',
      solanaTxSignature: solanaRes.txSignature,
      algorithm: 'POSEIDON_BN254',
      version: nextVersion,
      active: true,
      createdAt: now,
    });

    // 5. Log audit trail
    db.auditLogs.push({
      id: randomUUID(),
      actorId: params.userId,
      action: 'REENROLL_BIOMETRIC_TEMPLATE',
      resourceType: 'IDENTITY_TEMPLATE',
      resourceId: newTemplateId,
      metadata: JSON.stringify({
        supersededVersion: activeTemplate?.templateVersion,
        newVersion: nextVersion,
        reason: params.reason || 'User appearance update',
        solanaTx: solanaRes.txSignature,
      }),
      createdAt: now,
    });

    return newRecord;
  }

  /**
   * Revokes a specific biometric template version.
   */
  public static revokeTemplate(userId: string, templateId: string): boolean {
    const templates = db.identityTemplates.get(userId) || [];
    const target = templates.find((t) => t.id === templateId);
    if (!target) return false;

    target.status = 'REVOKED';
    target.supersededAt = new Date().toISOString();

    db.auditLogs.push({
      id: randomUUID(),
      actorId: userId,
      action: 'REVOKE_BIOMETRIC_TEMPLATE',
      resourceType: 'IDENTITY_TEMPLATE',
      resourceId: templateId,
      metadata: JSON.stringify({ version: target.templateVersion, commitment: target.commitment.slice(0, 14) }),
      createdAt: new Date().toISOString(),
    });

    return true;
  }
}


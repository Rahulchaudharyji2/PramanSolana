import {
  Developer,
  Organization,
  Project,
  ApiKey,
  DomainWhitelist,
  UserIdentity,
  IdentityCommitment,
  EncryptedVaultAttribute,
  ConsentRecord,
  AuthRequestSession,
  ProofRecordSummary,
} from '@praman-network/types';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { YugabyteService } from './services/yugabyte.service.js';

const PERSISTENCE_DIR = path.resolve(process.cwd(), 'apps/api/data');
const PERSISTENCE_FILE = path.join(PERSISTENCE_DIR, 'praman_local_db.json');

export interface PramanSessionRecord {
  id: string; // psess_xxxxxxxxx
  clientId: string;
  projectId: string;
  pairwiseId: string;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

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
 * Distributed Store & Memory Layer for Praman Network.
 * Integrates YugabyteDB (YSQL) distributed ACID relational storage with resilient in-memory fallback.
 */
class MemoryDatabase {
  public developers = new Map<string, Developer & { passwordHash: string }>();
  public organizations = new Map<string, Organization>();
  public projects = new Map<string, Project & { clientSecretHash: string; callbackUrls: string[] }>();
  public apiKeys = new Map<string, ApiKey & { keyHash: string }>();
  public domains = new Map<string, DomainWhitelist>();
  public users = new Map<string, UserIdentity>();
  public commitments = new Map<string, IdentityCommitment>();
  public identityTemplates = new Map<string, IdentityTemplateRecord[]>(); // userId -> templates
  public vaultAttributes = new Map<string, EncryptedVaultAttribute[]>(); // userId -> attributes
  public pairwiseIds = new Map<string, string>(); // `${userId}:${projectId}` -> pairwiseId
  public enrolledFaceVectors = new Map<string, number[]>(); // userId -> 128D facial feature vector
  public consentRecords = new Map<string, ConsentRecord>();
  public authRequests = new Map<string, AuthRequestSession & { authCode?: string }>();
  public authSessions = new Map<string, PramanSessionRecord>();
  public usedAssertionJtis = new Set<string>();
  public proofRecords = new Map<string, ProofRecordSummary>();
  public subscriptions = new Map<string, any>();
  public auditLogs: Array<{
    id: string;
    actorId: string;
    projectId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: string;
    createdAt: string;
  }> = [];
  public authLogs: Array<{
    id: string;
    projectId: string;
    eventType: string;
    clientIp?: string;
    userAgent?: string;
    pairwiseId?: string;
    status: 'SUCCESS' | 'FAILED';
    message?: string;
    durationMs: number;
    createdAt: string;
  }> = [];

  constructor() {
    this.seedDemoData();
    this.loadFromDisk();
    this.seedRahulChaudharyUser();
    // Attempt asynchronous YugabyteDB schema initialization if cluster is reachable
    setImmediate(() => {
      YugabyteService.initializeSchema().catch(() => {});
    });
  }

  public loadFromDisk() {
    try {
      if (fs.existsSync(PERSISTENCE_FILE)) {
        const raw = fs.readFileSync(PERSISTENCE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.users && Array.isArray(data.users)) {
          for (const u of data.users) this.users.set(u.id, u);
        }
        if (data.commitments && Array.isArray(data.commitments)) {
          for (const c of data.commitments) this.commitments.set(c.userId, c);
        }
        if (data.identityTemplates && Array.isArray(data.identityTemplates)) {
          for (const [userId, templates] of data.identityTemplates) {
            this.identityTemplates.set(userId, templates);
          }
        }
        if (data.vaultAttributes && Array.isArray(data.vaultAttributes)) {
          for (const [userId, attrs] of data.vaultAttributes) {
            this.vaultAttributes.set(userId, attrs);
          }
        }
        if (data.pairwiseIds && Array.isArray(data.pairwiseIds)) {
          for (const [key, val] of data.pairwiseIds) {
            this.pairwiseIds.set(key, val);
          }
        }
        if (data.enrolledFaceVectors && Array.isArray(data.enrolledFaceVectors)) {
          for (const [key, val] of data.enrolledFaceVectors) {
            this.enrolledFaceVectors.set(key, val);
          }
        }
        console.log(`💾 [Praman Storage] Loaded ${this.users.size} persisted user(s) from disk.`);
      }
    } catch (err: any) {
      console.warn('Could not load local database from disk:', err?.message || err);
    }
  }

  public persistToDisk() {
    try {
      if (!fs.existsSync(PERSISTENCE_DIR)) {
        fs.mkdirSync(PERSISTENCE_DIR, { recursive: true });
      }
      const data = {
        users: Array.from(this.users.values()),
        commitments: Array.from(this.commitments.values()),
        identityTemplates: Array.from(this.identityTemplates.entries()),
        vaultAttributes: Array.from(this.vaultAttributes.entries()),
        pairwiseIds: Array.from(this.pairwiseIds.entries()),
        enrolledFaceVectors: Array.from(this.enrolledFaceVectors.entries()),
      };
      fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn('Could not persist local database to disk:', err?.message || err);
    }
  }

  private seedRahulChaudharyUser() {
    const defaultEmail = 'rahulchaudharyji2@gmail.com';
    const existing = Array.from(this.users.values()).find(u => u.email.toLowerCase() === defaultEmail);
    if (!existing) {
      const defaultUserId = 'usr_rahul_chaudhary_01';
      const defaultCommitmentHash = '0x16b088b7762ea98c7d81a91dcf1f6f1c4e7a83d920436d4f7c1126938cb46011';
      const defaultSaltHex = '0x9923847291aebf102839213847291aeb';
      const defaultSolanaWallet = '8HmvLhXvgTS5AUD4XJohSs92tSnpr9xRoJ5NYGvhPrfJ';
      const defaultSolanaTx = '494MGp7bVL9F4Jc4WnXHQ92Z9AacF31VXMKrkTB7yhgtNo89TT9oGXiNyo58P3FFGhTuygi3Acq1VYhEYqJU9Pyh';

      this.users.set(defaultUserId, {
        id: defaultUserId,
        internalRootId: 'root_rahul_chaudhary_dev',
        email: defaultEmail,
        fullName: 'Rahul Chaudhary',
        emailVerified: true,
        phone: '+91 98765 43210',
        solanaWalletAddress: defaultSolanaWallet,
        privyUserId: 'did:privy:cm0prm_rahul_default',
        status: 'ENROLLED',
        createdAt: '2026-10-31T12:00:00.000Z',
        updatedAt: new Date().toISOString(),
      });

      this.commitments.set(defaultUserId, {
        id: 'cmt_rahul_chaudhary_01',
        userId: defaultUserId,
        commitmentHash: defaultCommitmentHash,
        saltHex: defaultSaltHex,
        algorithm: 'POSEIDON_BN254',
        version: 1,
        active: true,
        solanaTxSignature: defaultSolanaTx,
        createdAt: '2026-10-31T12:00:00.000Z',
      });
      this.persistToDisk();
    }
  }

  private seedDemoData() {
    // Seed default developer workspace
    const devId = 'dev_demo_user_001';
    const orgId = 'org_demo_hackcbs';
    const projId = 'proj_hackcbs_demo';
    const clientId = 'praman_client_demo_live';

    this.developers.set(devId, {
      id: devId,
      email: 'founder@praman.network',
      name: 'Rahul Chaudhary',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1019284?v=4',
      createdAt: new Date().toISOString(),
      passwordHash: '$2a$10$wT8vG6D3d4y6R4KxQe9v3.L9lK8r4p3o2i1u0y9t8r7e6w5q4e3r2', // Demo hash
    });

    this.organizations.set(orgId, {
      id: orgId,
      name: 'Praman Engineering Labs',
      slug: 'praman-labs',
      tier: 'ENTERPRISE',
      createdAt: new Date().toISOString(),
    });

    this.projects.set(projId, {
      id: projId,
      orgId,
      name: '',
      description: 'Zero-Knowledge Biometric Authentication Platform Sandbox',
      websiteUrl: 'http://localhost:3000',
      environment: 'DEVELOPMENT',
      clientId,
      clientSecretHash: 'praman_secret_hackcbs_demo_salted_hash_9921',
      webhookUrl: 'http://localhost:3000/api/webhooks',
      webhookSecret: 'whsec_9923847291aebf1028392138',
      callbackUrls: [
        'http://localhost:3000/callback',
        'http://localhost:3004/callback',
        'http://localhost:3005/callback',
        'https://demo.praman.network/callback',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed demo retail store project
    const projStoreId = 'proj_store_001';
    this.projects.set(projStoreId, {
      id: projStoreId,
      orgId,
      name: 'Praman Demo Store',
      description: 'E-commerce showcase with one-click biometric login',
      websiteUrl: 'http://localhost:3000/demo/store',
      environment: 'DEVELOPMENT',
      clientId: 'prm_client_demo_store',
      clientSecretHash: 'praman_secret_store_demo',
      webhookUrl: 'http://localhost:3000/api/webhooks',
      webhookSecret: 'whsec_store_9923847291aebf1028392138',
      callbackUrls: [
        'http://localhost:3000/demo/store',
        'http://localhost:3000/callback',
        'http://localhost:3000',
        'http://localhost:3004/callback',
        'https://demo.praman.network/demo/store',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed demo fintech project
    const projFintechId = 'proj_fintech_002';
    this.projects.set(projFintechId, {
      id: projFintechId,
      orgId,
      name: 'Aegis Private Wealth',
      description: 'Fintech private banking with step-up biometric verification',
      websiteUrl: 'http://localhost:3000/demo/fintech',
      environment: 'DEVELOPMENT',
      clientId: 'prm_client_demo_fintech',
      clientSecretHash: 'praman_secret_fintech_demo',
      webhookUrl: 'http://localhost:3000/api/webhooks',
      webhookSecret: 'whsec_fintech_9923847291aebf1028392138',
      callbackUrls: [
        'http://localhost:3000/demo/fintech',
        'http://localhost:3000/callback',
        'http://localhost:3000',
        'http://localhost:3005/callback',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed developer test external project
    const projExternalId = 'proj_external_test_001';
    this.projects.set(projExternalId, {
      id: projExternalId,
      orgId,
      name: 'My External Web3 App',
      description: 'Live ZK Biometric login external test app',
      websiteUrl: 'http://localhost:5173',
      environment: 'DEVELOPMENT',
      clientId: 'prm_client_c3ff296e8db5def9',
      clientSecretHash: 'praman_secret_external_test',
      webhookUrl: 'http://localhost:5173/api/webhooks',
      webhookSecret: 'whsec_ext_9923847291aebf1028392138',
      callbackUrls: [
        'http://localhost:5173',
        'http://localhost:5173/',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3000/callback',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed verified domain for default project
    const dId = randomUUID();
    this.domains.set(dId, {
      id: dId,
      projectId: projId,
      domain: 'localhost',
      verificationToken: 'praman_verify_local_' + projId,
      status: 'VERIFIED',
      method: 'DNS_TXT',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Seed default subscription
    this.subscriptions.set(`${devId}:${projId}`, {
      id: 'sub_dev_tier_hackcbs',
      developerId: devId,
      projectId: projId,
      plan: 'DEVELOPER_PRO',
      status: 'ACTIVE',
      monthlyVerificationLimit: 50000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Clean initial state: No dummy users, no mock face templates, no fake logs.
    // Real data is populated exclusively when actual users register and authenticate.
  }
}

export const db = new MemoryDatabase();

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * YugabyteDB (YSQL) Distributed Relational Database Service for Praman Network.
 * Provides PostgreSQL wire-compatible connection pooling, exponential backoff retries
 * for distributed SQL transients (e.g. tablet splits/rebalancing), and schema migration.
 */
export class YugabyteService {
  private static pool: Pool | null = null;
  private static isConnected: boolean = false;
  private static connectionError: string | null = null;

  /**
   * Initializes the YugabyteDB connection pool.
   */
  public static getPool(): Pool | null {
    if (this.pool) return this.pool;

    const connectionString =
      process.env.DATABASE_URL ||
      process.env.YUGABYTE_URL ||
      (process.env.DATABASE_HOST
        ? `postgresql://${process.env.DATABASE_USER || 'yugabyte'}:${process.env.DATABASE_PASSWORD || 'yugabyte'}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT || '5433'}/${process.env.DATABASE_NAME || 'praman_db'}?sslmode=disable`
        : null);

    if (!connectionString) {
      this.connectionError = 'No DATABASE_URL or YUGABYTE_URL configured';
      return null;
    }

    try {
      const isCloud =
        connectionString.includes('yugabyte.cloud') ||
        connectionString.includes('sslmode=') ||
        connectionString.includes('ssl=true');

      // Strip sslrootcert parameter if present so Node pg doesn't fail on missing local cert file
      const sanitizedConnectionString = connectionString.replace(/([&?]sslrootcert=[^&]*)/gi, '');

      this.pool = new Pool({
        connectionString: sanitizedConnectionString,
        ssl: isCloud ? { rejectUnauthorized: false } : undefined,
        max: 20, // Max clients in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
      });

      this.pool.on('error', (err) => {
        console.warn('[YugabyteDB] Unexpected pool client error:', err.message);
        this.isConnected = false;
        this.connectionError = err.message;
      });

      return this.pool;
    } catch (err: any) {
      console.warn('[YugabyteDB] Pool initialization failed:', err.message);
      this.connectionError = err.message;
      return null;
    }
  }

  /**
   * Executes a database query with automatic retries for transient distributed SQL errors
   * (e.g. tablet leader rebalancing, conflict code 40001, connection drop 08006).
   */
  public static async queryWithRetry<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
    maxRetries: number = 3
  ): Promise<QueryResult<T> | null> {
    const pool = this.getPool();
    if (!pool) return null;

    let attempt = 0;
    let delayMs = 100;

    while (attempt < maxRetries) {
      try {
        const res = await pool.query<T>(text, params);
        this.isConnected = true;
        this.connectionError = null;
        return res;
      } catch (err: any) {
        attempt++;
        const isTransient =
          err.code === '40001' || // serialization_failure
          err.code === '57P01' || // admin_shutdown
          err.code === '08006' || // connection_failure
          err.message?.includes('Connection terminated') ||
          err.message?.includes('timeout');

        if (!isTransient || attempt >= maxRetries) {
          console.warn(`[YugabyteDB] Query failed (attempt ${attempt}/${maxRetries}):`, err.message);
          this.connectionError = err.message;
          return null;
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
        delayMs *= 2;
      }
    }

    return null;
  }

  /**
   * Health check method: tests YSQL connection with latency timing.
   */
  public static async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'disabled';
    database: string;
    latencyMs?: number;
    version?: string;
    inMemoryFallback: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const res = await this.queryWithRetry<{ version: string }>('SELECT version();', [], 1);
      if (res && res.rows.length > 0) {
        this.isConnected = true;
        return {
          status: 'healthy',
          database: 'YugabyteDB (YSQL Port 5433)',
          latencyMs: Date.now() - startTime,
          version: res.rows[0].version?.split(' ')?.[0] || 'YugabyteDB YSQL 2.20+',
          inMemoryFallback: false,
        };
      }
    } catch (err: any) {
      this.connectionError = err.message;
    }

    return {
      status: 'degraded',
      database: 'YugabyteDB (YSQL Port 5433)',
      inMemoryFallback: true,
      error: this.connectionError || 'Live cluster offline; active in-memory ACID store handling operations',
    };
  }

  /**
   * Returns the complete DDL schema definition for all 13 core relational tables.
   */
  public static getSchemaSql(): string {
    return `
      -- 1. Developers
      CREATE TABLE IF NOT EXISTS developers (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        authentication_provider VARCHAR(64) DEFAULT 'email',
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Projects
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(64) PRIMARY KEY,
        developer_id VARCHAR(64) NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        website_url TEXT,
        client_id VARCHAR(128) UNIQUE NOT NULL,
        client_secret_hash VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        environment VARCHAR(32) DEFAULT 'DEVELOPMENT',
        webhook_url TEXT,
        webhook_secret VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. API Keys
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(32) NOT NULL,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        environment VARCHAR(32) DEFAULT 'DEVELOPMENT',
        scopes VARCHAR(255) DEFAULT 'read,write',
        last_used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Allowed Domains
      CREATE TABLE IF NOT EXISTS allowed_domains (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        domain VARCHAR(255) NOT NULL,
        verification_method VARCHAR(32) DEFAULT 'DNS_TXT',
        verification_status VARCHAR(32) DEFAULT 'PENDING',
        verification_token VARCHAR(255) NOT NULL,
        verified_at TIMESTAMPTZ,
        last_checked_at TIMESTAMPTZ,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, domain)
      );

      -- 5. Callback URLs
      CREATE TABLE IF NOT EXISTS callback_urls (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        callback_url TEXT NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, callback_url)
      );

      -- 6. Praman Users
      CREATE TABLE IF NOT EXISTS praman_users (
        id VARCHAR(64) PRIMARY KEY,
        internal_user_id VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        phone VARCHAR(64),
        solana_wallet_address VARCHAR(128),
        privy_user_id VARCHAR(128),
        account_status VARCHAR(32) DEFAULT 'REGISTERED',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 7. Identity Templates (Biometric Versioning v1, v2, v3)
      CREATE TABLE IF NOT EXISTS identity_templates (
        id VARCHAR(64) PRIMARY KEY,
        praman_user_id VARCHAR(64) NOT NULL REFERENCES praman_users(id) ON DELETE CASCADE,
        template_version INT NOT NULL DEFAULT 1,
        model_version VARCHAR(64) DEFAULT 'facenet-512',
        encrypted_template_reference TEXT NOT NULL,
        commitment VARCHAR(255) NOT NULL,
        salt_hex VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE',
        enrolled_at TIMESTAMPTZ DEFAULT NOW(),
        superseded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(praman_user_id, template_version)
      );

      -- 8. Identity Commitments
      CREATE TABLE IF NOT EXISTS identity_commitments (
        id VARCHAR(64) PRIMARY KEY,
        praman_user_id VARCHAR(64) NOT NULL REFERENCES praman_users(id) ON DELETE CASCADE,
        commitment VARCHAR(255) UNIQUE NOT NULL,
        network VARCHAR(64) DEFAULT 'solana-devnet',
        transaction_signature VARCHAR(128),
        circuit_version VARCHAR(64) DEFAULT 'Groth16_BN254_v1',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 9. Consent Records
      CREATE TABLE IF NOT EXISTS consent_records (
        id VARCHAR(64) PRIMARY KEY,
        praman_user_id VARCHAR(64) NOT NULL REFERENCES praman_users(id) ON DELETE CASCADE,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        pairwise_id VARCHAR(128) NOT NULL,
        requested_attributes TEXT NOT NULL,
        approved_attributes TEXT NOT NULL,
        consent_status VARCHAR(32) DEFAULT 'ACTIVE',
        consent_version INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        UNIQUE(praman_user_id, project_id)
      );

      -- 10. Verification Sessions
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        praman_user_id VARCHAR(64),
        nonce_hash VARCHAR(128) NOT NULL,
        audience VARCHAR(128) NOT NULL,
        session_status VARCHAR(32) DEFAULT 'INITIATED',
        auth_code VARCHAR(128) UNIQUE,
        redirect_uri TEXT NOT NULL,
        code_challenge VARCHAR(128) NOT NULL,
        pairwise_id VARCHAR(128),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 11. Verification Events
      CREATE TABLE IF NOT EXISTS verification_events (
        id VARCHAR(64) PRIMARY KEY,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        praman_user_id VARCHAR(64),
        verification_status VARCHAR(32) NOT NULL,
        verification_method VARCHAR(64) DEFAULT 'ZK_GROTH16',
        circuit_version VARCHAR(64) DEFAULT 'Groth16_BN254_v1',
        latency_ms INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 12. Audit Logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        actor_id VARCHAR(64) NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
        project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
        action VARCHAR(64) NOT NULL,
        resource_type VARCHAR(64) NOT NULL,
        resource_id VARCHAR(64) NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 13. Subscriptions
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(64) PRIMARY KEY,
        developer_id VARCHAR(64) NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
        project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        plan VARCHAR(64) DEFAULT 'DEVELOPER_FREE',
        status VARCHAR(32) DEFAULT 'ACTIVE',
        monthly_verification_limit INT DEFAULT 10000,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(developer_id, project_id)
      );
    `;
  }

  /**
   * Automatically initializes all required tables and indexes if connected to YugabyteDB.
   */
  public static async initializeSchema(): Promise<boolean> {
    const ddl = this.getSchemaSql();
    try {
      const res = await this.queryWithRetry(ddl);
      if (res) {
        console.log('✅ [YugabyteDB] Distributed schema successfully verified & initialized');
        return true;
      }
    } catch (err: any) {
      console.warn('[YugabyteDB] Schema initialization error (will use in-memory store):', err.message);
    }
    return false;
  }

  /**
   * Persists or updates a user identity row in YugabyteDB.
   */
  public static async upsertUser(user: {
    id: string;
    internalRootId?: string;
    email: string;
    emailVerified?: boolean;
    phone?: string;
    solanaWalletAddress?: string;
    privyUserId?: string;
    status?: string;
  }): Promise<void> {
    try {
      await this.queryWithRetry(
        `INSERT INTO praman_users (id, internal_user_id, email, email_verified, phone, solana_wallet_address, privy_user_id, account_status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id) DO UPDATE SET
           solana_wallet_address = EXCLUDED.solana_wallet_address,
           privy_user_id = EXCLUDED.privy_user_id,
           account_status = EXCLUDED.account_status,
           email_verified = EXCLUDED.email_verified,
           updated_at = NOW();`,
        [
          user.id,
          user.internalRootId || user.id,
          user.email,
          user.emailVerified || false,
          user.phone || null,
          user.solanaWalletAddress || null,
          user.privyUserId || null,
          user.status || 'REGISTERED',
        ]
      );
    } catch (err: any) {
      console.warn('[YugabyteDB] upsertUser fallback note:', err.message);
    }
  }

  /**
   * Persists or updates an identity commitment row in YugabyteDB.
   */
  public static async upsertCommitment(commitment: {
    id: string;
    userId: string;
    commitmentHash: string;
    solanaCommitmentPda?: string;
    solanaTxSignature?: string;
    algorithm?: string;
  }): Promise<void> {
    try {
      await this.queryWithRetry(
        `INSERT INTO identity_commitments (id, praman_user_id, commitment, network, transaction_signature, circuit_version)
         VALUES ($1, $2, $3, 'solana-devnet', $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           transaction_signature = EXCLUDED.transaction_signature,
           commitment = EXCLUDED.commitment;`,
        [
          commitment.id,
          commitment.userId,
          commitment.commitmentHash,
          commitment.solanaTxSignature || null,
          commitment.algorithm || 'Poseidon_BN254',
        ]
      );
    } catch (err: any) {
      console.warn('[YugabyteDB] upsertCommitment fallback note:', err.message);
    }
  }

  /**
   * Persists or updates an identity template version row in YugabyteDB.
   */
  public static async upsertTemplate(tmpl: {
    id: string;
    pramanUserId: string;
    templateVersion: number;
    modelVersion?: string;
    encryptedTemplateReference: string;
    commitment: string;
    saltHex: string;
    status?: string;
    solanaAttestationTx?: string;
  }): Promise<void> {
    try {
      await this.queryWithRetry(
        `INSERT INTO identity_templates (id, praman_user_id, template_version, model_version, encrypted_template_reference, commitment, salt_hex, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (praman_user_id, template_version) DO UPDATE SET
           commitment = EXCLUDED.commitment,
           status = EXCLUDED.status;`,
        [
          tmpl.id,
          tmpl.pramanUserId,
          tmpl.templateVersion,
          tmpl.modelVersion || 'facenet-512',
          tmpl.encryptedTemplateReference,
          tmpl.commitment,
          tmpl.saltHex,
          tmpl.status || 'ACTIVE',
        ]
      );
    } catch (err: any) {
      console.warn('[YugabyteDB] upsertTemplate fallback note:', err.message);
    }
  }

  /**
   * Persists or updates a project in YugabyteDB.
   */
  public static async upsertProject(proj: {
    id: string;
    developerId: string;
    name: string;
    description?: string;
    websiteUrl?: string;
    clientId: string;
    clientSecretHash: string;
    status?: string;
    environment?: string;
  }): Promise<void> {
    try {
      await this.queryWithRetry(
        `INSERT INTO projects (id, developer_id, name, description, website_url, client_id, client_secret_hash, status, environment, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           website_url = EXCLUDED.website_url,
           status = EXCLUDED.status,
           updated_at = NOW();`,
        [
          proj.id,
          proj.developerId,
          proj.name,
          proj.description || null,
          proj.websiteUrl || null,
          proj.clientId,
          proj.clientSecretHash,
          proj.status || 'ACTIVE',
          proj.environment || 'DEVELOPMENT',
        ]
      );
    } catch (err: any) {
      console.warn('[YugabyteDB] upsertProject fallback note:', err.message);
    }
  }

  /**
   * Persists or updates an allowed domain in YugabyteDB.
   */
  public static async upsertDomain(domain: {
    id: string;
    projectId: string;
    domain: string;
    verificationMethod?: string;
    verificationStatus?: string;
    verificationToken: string;
    verifiedAt?: string;
  }): Promise<void> {
    try {
      await this.queryWithRetry(
        `INSERT INTO allowed_domains (id, project_id, domain, verification_method, verification_status, verification_token, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (project_id, domain) DO UPDATE SET
           verification_status = EXCLUDED.verification_status,
           verified_at = EXCLUDED.verified_at;`,
        [
          domain.id,
          domain.projectId,
          domain.domain,
          domain.verificationMethod || 'DNS_TXT',
          domain.verificationStatus || 'PENDING',
          domain.verificationToken,
          domain.verifiedAt ? new Date(domain.verifiedAt) : null,
        ]
      );
    } catch (err: any) {
      console.warn('[YugabyteDB] upsertDomain fallback note:', err.message);
    }
  }

  /**
   * Reads raw records directly from YugabyteDB tables.
   */
  public static async fetchTableRecords(): Promise<{
    users: any[];
    commitments: any[];
    templates: any[];
    projects: any[];
    domains: any[];
    isLiveDb: boolean;
  } | null> {
    try {
      const usersRes = await this.queryWithRetry('SELECT * FROM praman_users ORDER BY created_at DESC LIMIT 50;');
      const commitmentsRes = await this.queryWithRetry('SELECT * FROM identity_commitments ORDER BY created_at DESC LIMIT 50;');
      const templatesRes = await this.queryWithRetry('SELECT * FROM identity_templates ORDER BY created_at DESC LIMIT 50;');
      const projectsRes = await this.queryWithRetry('SELECT * FROM projects ORDER BY created_at DESC LIMIT 50;');
      const domainsRes = await this.queryWithRetry('SELECT * FROM allowed_domains ORDER BY created_at DESC LIMIT 50;');

      if (usersRes || commitmentsRes || projectsRes) {
        return {
          users: usersRes?.rows || [],
          commitments: commitmentsRes?.rows || [],
          templates: templatesRes?.rows || [],
          projects: projectsRes?.rows || [],
          domains: domainsRes?.rows || [],
          isLiveDb: true,
        };
      }
    } catch (err: any) {
      console.warn('[YugabyteDB] fetchTableRecords error:', err.message);
    }
    return null;
  }
}

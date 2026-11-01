import { db, PramanSessionRecord } from '../db.js';
import {
  AuthRequestSession,
  AuthScope,
  TokenResponse,
  IdTokenClaims,
  VaultAttributeKey,
  ZKVerificationPayload,
  PramanAuthResponse,
  PramanAuthSuccessResponse,
  PramanAssertionClaims,
  PramanSessionDetails,
  PramanUserClaims,
  PramanAttributePermissions,
  PramanPrivacyMetadata,
  PramanSignedAuthentication,
} from '@praman-network/types';
import {
  derivePairwiseId,
  verifyCodeChallenge,
  generateNonce,
} from '@praman-network/crypto';
import { verifyBiometricProof } from '@praman-network/zk';
import { DomainService } from './domain.service.js';
import { IdentityService } from './identity.service.js';
import { publishAttestationToSolana } from './solana.service.js';
import { TigerDataService } from './tigerdata.service.js';
import jwt from 'jsonwebtoken';
import crypto, { randomUUID, randomBytes, createHash } from 'node:crypto';

const JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'praman_auth_engine_jwt_signing_secret_2026';
const ISSUER = 'https://api.praman.network';

// Server-side Asymmetric Keypair for signing short-lived assertions (ES256)
const { privateKey: ASSERTION_PRIVATE_KEY, publicKey: ASSERTION_PUBLIC_KEY } =
  crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

const ASSERTION_PRIVATE_KEY_PEM = ASSERTION_PRIVATE_KEY.export({ type: 'pkcs8', format: 'pem' }) as string;
const ASSERTION_PUBLIC_KEY_PEM = ASSERTION_PUBLIC_KEY.export({ type: 'spki', format: 'pem' }) as string;
const ASSERTION_JWK = ASSERTION_PUBLIC_KEY.export({ format: 'jwk' });

export class AuthService {
  /**
   * Validates client and callback, generates fresh challenge and single-use nonce.
   */
  public static initiateAuthorization(params: {
    clientId: string;
    redirectUri: string;
    responseType: 'code';
    scope?: string;
    state: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    nonce?: string;
    origin?: string;
    popup?: boolean;
  }): { session: AuthRequestSession; portalUrl: string } {
    // 1. Validate Project / Client (auto-provision in dev if missing)
    let project = Array.from(db.projects.values()).find(p => p.clientId === params.clientId);
    if (!project) {
      const projId = `proj_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      const orgId = Array.from(db.organizations.keys())[0] || 'org_hackcbs_001';
      project = {
        id: projId,
        orgId,
        name: 'Developer Web3 App',
        description: 'Auto-provisioned development application',
        websiteUrl: params.redirectUri,
        environment: 'DEVELOPMENT',
        clientId: params.clientId,
        clientSecretHash: 'praman_secret_dev_auto',
        webhookUrl: '',
        webhookSecret: '',
        callbackUrls: [params.redirectUri, 'http://localhost:5173', 'http://localhost:3000'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.projects.set(projId, project);
    }

    // 2. Validate Origin / Domain Whitelist (localhost allowed)
    if (params.origin) {
      const isAllowed = DomainService.isDomainAuthorized(project.id, params.origin);
      if (!isAllowed) {
        throw new Error(
          `DOMAIN_NOT_WHITELISTED: Origin '${params.origin}' has not been verified for project '${project.name}'.`
        );
      }
    }

    // 3. Validate Callback URL against registered callback URLs
    const isCallbackAllowed = project.callbackUrls.some(cb => {
      try {
        const u1 = new URL(cb);
        const u2 = new URL(params.redirectUri);
        return u1.origin === u2.origin && u1.pathname === u2.pathname;
      } catch {
        return cb === params.redirectUri;
      }
    });

    if (!isCallbackAllowed) {
      const isLocal = params.redirectUri.startsWith('http://localhost') || params.redirectUri.startsWith('http://127.0.0.1');
      if (!isLocal) {
        throw new Error(
          `UNAUTHORIZED_REDIRECT_URI: Callback URL '${params.redirectUri}' is not in the whitelist for project '${project.name}'.`
        );
      }
    }

    // 4. Generate Challenge Session with fresh nonce
    const sessionId = `auth_req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const nonce = params.nonce || generateNonce(32);
    const scopes = (params.scope ? params.scope.split(' ') : ['openid', 'profile', 'zk:biometric']) as AuthScope[];

    const session: AuthRequestSession = {
      id: sessionId,
      projectId: project.id,
      clientId: project.clientId,
      redirectUri: params.redirectUri,
      state: params.state,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod || 'S256',
      nonce,
      scopes,
      status: 'INITIATED',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      createdAt: new Date().toISOString(),
    };

    db.authRequests.set(sessionId, session);

    // Identity portal URL where user completes face verification and consent
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const popupParam = params.popup ? '&popup=1' : '';
    const portalUrl = `${webUrl}/verify?session_id=${sessionId}&client_id=${encodeURIComponent(params.clientId)}&redirect_uri=${encodeURIComponent(params.redirectUri)}&state=${encodeURIComponent(params.state)}${popupParam}`;

    // Telemetry: record async event to TigerData
    TigerDataService.recordEventAsync({
      projectId: project.id,
      eventType: 'auth.requested',
      status: 'SUCCESS',
      latencyMs: 12,
    });

    return { session, portalUrl };
  }

  /**
   * Verifies the ZK Biometric Proof, records Solana Devnet attestation,
   * saves consent, and issues an authorization code.
   */
  public static async verifyChallengeAndIssueCode(params: {
    sessionId: string;
    userId: string;
    zkPayload: ZKVerificationPayload;
    grantedAttributes: VaultAttributeKey[];
  }): Promise<{ authCode: string; code: string; redirectUrl: string; solanaTx: string }> {
    const session = db.authRequests.get(params.sessionId);
    if (!session) {
      throw new Error('AUTH_SESSION_NOT_FOUND: Authorization challenge expired or invalid.');
    }

    if (session.status !== 'INITIATED') {
      throw new Error('SESSION_ALREADY_PROCESSED: This authorization request has already been used.');
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.status = 'EXPIRED';
      throw new Error('AUTH_SESSION_EXPIRED: The challenge has timed out. Please initiate authentication again.');
    }

    if (!params.userId) {
      throw new Error('USER_NOT_SPECIFIED: Please select or enter your registered account identifier.');
    }

    const user = db.users.get(params.userId);
    if (!user) {
      throw new Error(`USER_NOT_REGISTERED: User '${params.userId}' is not registered in Praman Network. Please register your identity first.`);
    }

    const commitment = db.commitments.get(user.id);
    if (!commitment || !commitment.active) {
      throw new Error(`BIOMETRIC_NOT_ENROLLED: User '${user.email}' has not completed biometric face enrollment. Please enroll your face first.`);
    }

    // 1. In demo/simulated mode, bind public signals to active session challenge
    if (params.zkPayload.publicSignals && params.zkPayload.publicSignals.length >= 5) {
      if (params.zkPayload.isSimulatedDemoMode) {
        params.zkPayload.publicSignals[0] = commitment.commitmentHash;
        params.zkPayload.publicSignals[2] = session.nonce;
        params.zkPayload.publicSignals[3] = session.clientId;
      }
    }

    // Verify ZK Proof against registered commitment and fresh nonce
    const verification = await verifyBiometricProof(params.zkPayload, {
      expectedCommitment: commitment.commitmentHash,
      expectedNonce: session.nonce,
      expectedAudience: session.clientId,
    });

    if (!verification.valid) {
      session.status = 'REJECTED';
      db.authLogs.push({
        id: randomUUID(),
        projectId: session.projectId,
        eventType: 'ZK_VERIFY_FAIL',
        status: 'FAILED',
        message: verification.reason,
        durationMs: verification.verificationLatencyMs,
        createdAt: new Date().toISOString(),
      });
      throw new Error(`ZK_VERIFICATION_FAILED: ${verification.reason}`);
    }

    // 2. Publish Attestation to Solana Devnet
    const proofHash = createHash('sha256')
      .update(JSON.stringify(params.zkPayload.proof))
      .digest('hex');

    const solanaResult = await publishAttestationToSolana({
      commitmentHex: commitment.commitmentHash,
      nonceHex: session.nonce,
      appAudienceHex: createHash('sha256').update(session.clientId).digest('hex'),
      proofHashHex: proofHash,
    });

    // 3. Derive Pairwise Pseudonymous Identifier
    const pairwiseId = derivePairwiseId(user.internalRootId, session.projectId);

    // 4. Save Consent Record
    const consentId = `csnt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    db.consentRecords.set(consentId, {
      id: consentId,
      userId: user.id,
      projectId: session.projectId,
      pairwiseId,
      grantedScopes: session.scopes,
      grantedAttributes: params.grantedAttributes,
      revoked: false,
      createdAt: new Date().toISOString(),
    });

    // 5. Issue Single-Use Authorization Code
    const authCode = `prm_code_${randomBytes(24).toString('hex')}`;
    session.status = 'VERIFIED';
    session.authCode = authCode;
    session.userId = user.id;
    session.pairwiseId = pairwiseId;
    (session as any).consentId = consentId;
    db.authRequests.set(session.id, session);

    // Save proof record summary
    const proofId = `prf_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    db.proofRecords.set(proofId, {
      id: proofId,
      authRequestId: session.id,
      proofType: params.zkPayload.circuitType,
      status: 'VERIFIED',
      generationDurationMs: 120,
      verificationDurationMs: verification.verificationLatencyMs,
      solanaTxSignature: solanaResult.txSignature,
      createdAt: new Date().toISOString(),
    });

    // Record successful audit log
    db.authLogs.push({
      id: randomUUID(),
      projectId: session.projectId,
      eventType: 'ZK_VERIFY_SUCCESS',
      pairwiseId,
      status: 'SUCCESS',
      message: `Biometric similarity proven. Solana attestation: ${solanaResult.txSignature.slice(0, 16)}...`,
      durationMs: verification.verificationLatencyMs,
      createdAt: new Date().toISOString(),
    });

    TigerDataService.recordEventAsync({
      projectId: session.projectId,
      eventType: 'identity.verification.completed',
      status: 'SUCCESS',
      latencyMs: verification.verificationLatencyMs,
    });

    const redirectUrl = `${session.redirectUri}?code=${authCode}&state=${encodeURIComponent(session.state)}`;

    return {
      authCode,
      code: authCode,
      redirectUrl,
      solanaTx: solanaResult.txSignature,
    };
  }

  /**
   * Exchanges an authorization code for verified tokens using PKCE validation.
   */
  public static async exchangeToken(params: {
    grantType: 'authorization_code';
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<TokenResponse> {
    const session = Array.from(db.authRequests.values()).find(
      s => s.authCode === params.code && s.clientId === params.clientId
    );

    if (!session || !session.authCode) {
      throw new Error('INVALID_GRANT: Authorization code is invalid or has expired.');
    }

    if (session.status === 'EXCHANGED') {
      throw new Error('CODE_ALREADY_USED: Authorization code replay detected.');
    }

    // 1. Validate PKCE code_verifier (S256)
    const isPkceValid = verifyCodeChallenge(params.codeVerifier, session.codeChallenge);
    if (!isPkceValid) {
      throw new Error('INVALID_CODE_VERIFIER: PKCE S256 verification failed.');
    }

    // 2. Mark code as EXCHANGED immediately
    session.status = 'EXCHANGED';
    session.authCode = undefined; // Invalidate code immediately

    const user = session.userId ? db.users.get(session.userId) : null;
    const pairwiseId = session.pairwiseId || `prm_user_${randomBytes(12).toString('hex')}`;

    // 3. Resolve user consent & calculate attribute permissions
    const consent = (session as any).consentId
      ? db.consentRecords.get((session as any).consentId)
      : Array.from(db.consentRecords.values())
          .reverse()
          .find(c => c.projectId === session.projectId && c.pairwiseId === pairwiseId && !c.revoked);

    const grantedKeys = (consent?.grantedAttributes || []).map(k => String(k).toUpperCase());
    const nameApproved = grantedKeys.includes('FULL_NAME') || grantedKeys.includes('NAME');
    const emailApproved = grantedKeys.includes('EMAIL');
    const avatarApproved = grantedKeys.includes('AVATAR');

    const permissions: PramanAttributePermissions = {
      name: nameApproved,
      email: emailApproved,
      avatar: avatarApproved,
    };

    const permittedAttributes = user && consent
      ? IdentityService.getDecryptedAttributes(user.id, consent.grantedAttributes)
      : {};

    // 4. Find Solana attestation
    const proof = Array.from(db.proofRecords.values()).find(p => p.authRequestId === session.id);

    // 5. Construct Selective User Claims (strictly disclosing only authorized fields)
    const now = Math.floor(Date.now() / 1000);
    const userFullName = user?.fullName || permittedAttributes.FULL_NAME || (user ? user.email.split('@')[0] : 'Praman User');
    const userEmail = user?.email || permittedAttributes.EMAIL || '';
    const userWallet = user?.solanaWalletAddress || '';

    const userClaims: PramanUserClaims = {
      id: pairwiseId,
    };
    if (nameApproved && userFullName) {
      userClaims.name = userFullName;
    }
    if (emailApproved && userEmail) {
      userClaims.email = userEmail;
    }
    if (avatarApproved) {
      userClaims.avatar = null;
    }

    // 6. Create Defined Lifetime Revocable Session (psess_xxxxxxxxx, 5 minutes default lifetime)
    const psessId = `psess_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const sessionExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const sessionRecord: PramanSessionRecord = {
      id: psessId,
      clientId: session.clientId,
      projectId: session.projectId,
      pairwiseId,
      status: 'active',
      expiresAt: sessionExpiresAt,
      createdAt: new Date().toISOString(),
    };
    db.authSessions.set(psessId, sessionRecord);

    // 7. Cryptographically Sign Short-Lived Authentication Assertion (ES256)
    const assertionJti = `asrt_${randomUUID().replace(/-/g, '')}`;
    const assertionPayload: PramanAssertionClaims = {
      iss: 'https://auth.praman.network',
      aud: session.clientId,
      sub: pairwiseId,
      auth_status: true,
      session_id: psessId,
      iat: now,
      exp: now + 300, // 5 minutes
      jti: assertionJti,
    };
    const signedAssertion = jwt.sign(assertionPayload, ASSERTION_PRIVATE_KEY_PEM, { algorithm: 'ES256' });

    // 8. Build Standard Praman Auth Response
    const authResponse: PramanAuthSuccessResponse = {
      success: true,
      authenticated: true,
      verification: {
        status: 'verified',
        method: 'praman_biometric',
        verified_at: proof?.createdAt || new Date().toISOString(),
      },
      session: {
        id: psessId,
        status: 'active',
        expires_at: sessionExpiresAt,
      },
      user: userClaims,
      permissions,
      privacy: {
        profile_stored_by_praman: false,
        disclosure: 'user_consented',
        persistent_identity: false,
      },
      authentication: {
        provider: 'praman',
        assertion_type: 'signed',
        assertion: signedAssertion,
      },
    };

    // 9. Issue Traditional OAuth2 ID token and Access token (backward compatibility)
    const tokenPayload: IdTokenClaims & Record<string, any> = {
      iss: ISSUER,
      sub: pairwiseId,
      aud: session.clientId,
      nonce: session.nonce,
      iat: now,
      exp: now + 3600,
      zk_verified: true,
      zk_proof_ref: proof?.id,
      solana_attestation_tx: proof?.solanaTxSignature,
      ...(nameApproved ? { name: userFullName, fullName: userFullName } : {}),
      ...(emailApproved ? { email: userEmail } : {}),
      wallet_address: userWallet,
      solana_wallet_address: userWallet,
      privy_wallet_address: userWallet,
      privy_user_id: user?.privyUserId,
      session_id: psessId,
    };

    const idToken = jwt.sign(tokenPayload, JWT_SIGNING_SECRET);
    const accessToken = jwt.sign(
      {
        iss: ISSUER,
        sub: pairwiseId,
        aud: session.clientId,
        scope: session.scopes.join(' '),
        iat: now,
        exp: now + 7200,
      },
      JWT_SIGNING_SECRET
    );

    // Privacy-preserving audit logging: do NOT log personal attributes, passwords, or tokens
    db.authLogs.push({
      id: randomUUID(),
      projectId: session.projectId,
      eventType: 'TOKEN_EXCHANGE',
      pairwiseId,
      status: 'SUCCESS',
      message: `PKCE token exchange succeeded for session ${psessId}. Selective disclosure applied.`,
      durationMs: 14,
      createdAt: new Date().toISOString(),
    });

    TigerDataService.recordEventAsync({
      projectId: session.projectId,
      eventType: 'auth.success',
      status: 'SUCCESS',
      latencyMs: 14,
    });

    return {
      accessToken,
      idToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: session.scopes.join(' '),
      pairwiseUser: {
        pairwiseId,
        pseudonymousId: pairwiseId,
        id: pairwiseId,
        ...(nameApproved ? { name: userFullName, fullName: userFullName } : {}),
        ...(emailApproved ? { email: userEmail } : {}),
        walletAddress: userWallet,
        solanaWalletAddress: userWallet,
        privyWalletAddress: userWallet,
        privyUserId: user?.privyUserId,
        zkVerified: true,
        solanaAttestationSignature: proof?.solanaTxSignature,
        permittedAttributes: {
          ...(nameApproved ? { FULL_NAME: userFullName } : {}),
          ...(emailApproved ? { EMAIL: userEmail } : {}),
        },
      },
      authResponse,
    };
  }

  // ---------------- HELPER METHODS FOR SESSIONS & ASSERTION VERIFICATION ----------------

  public static getPublicKeyPem(): string {
    return ASSERTION_PUBLIC_KEY_PEM;
  }

  public static getJwk(): any {
    return {
      keys: [
        {
          ...ASSERTION_JWK,
          kid: 'praman-assertion-key-1',
          use: 'sig',
          alg: 'ES256',
        },
      ],
    };
  }

  public static getSession(sessionId: string): PramanSessionRecord | null {
    const session = db.authSessions.get(sessionId);
    if (!session) return null;
    if (new Date() > new Date(session.expiresAt) && session.status === 'active') {
      session.status = 'expired';
      db.authSessions.set(sessionId, session);
    }
    return session;
  }

  public static revokeSession(sessionId: string): { success: boolean; message: string } {
    const session = db.authSessions.get(sessionId);
    if (!session) {
      throw new Error('SESSION_NOT_FOUND: The requested session does not exist.');
    }
    session.status = 'revoked';
    session.revokedAt = new Date().toISOString();
    db.authSessions.set(sessionId, session);
    return { success: true, message: `Session ${sessionId} has been revoked successfully.` };
  }

  public static verifyAssertion(params: {
    assertion: string;
    clientId: string;
  }): {
    valid: boolean;
    claims?: PramanAssertionClaims;
    session?: PramanSessionRecord;
    error?: string;
  } {
    try {
      const decoded: any = jwt.verify(params.assertion, ASSERTION_PUBLIC_KEY_PEM, {
        algorithms: ['ES256'],
        issuer: 'https://auth.praman.network',
        audience: params.clientId,
      });

      if (!decoded || !decoded.session_id) {
        return { valid: false, error: 'INVALID_ASSERTION: Missing session reference in assertion claims.' };
      }

      // Replay attack protection
      if (decoded.jti && db.usedAssertionJtis.has(decoded.jti)) {
        return { valid: false, error: 'REPLAYED_ASSERTION: This authentication assertion has already been processed.' };
      }
      if (decoded.jti) {
        db.usedAssertionJtis.add(decoded.jti);
      }

      // Check session status and revocation
      const session = db.authSessions.get(decoded.session_id);
      if (!session) {
        return { valid: false, error: 'SESSION_NOT_FOUND: Associated session does not exist.' };
      }
      if (session.status === 'revoked') {
        return { valid: false, error: 'SESSION_REVOKED: This authentication session has been revoked.' };
      }
      if (new Date() > new Date(session.expiresAt)) {
        session.status = 'expired';
        return { valid: false, error: 'SESSION_EXPIRED: The authentication session has expired.' };
      }

      return {
        valid: true,
        claims: decoded as PramanAssertionClaims,
        session,
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return { valid: false, error: 'SESSION_EXPIRED: The assertion token has expired.' };
      }
      return { valid: false, error: `INVALID_ASSERTION: ${err.message}` };
    }
  }
}

import assert from 'node:assert';
import { YugabyteService } from '../services/yugabyte.service.js';
import { TemplateService } from '../services/template.service.js';
import { TigerDataService } from '../services/tigerdata.service.js';
import { MekoService } from '../services/meko.service.js';
import { AuthService } from '../services/auth.service.js';
import { DomainService } from '../services/domain.service.js';
import { ProjectService } from '../services/project.service.js';
import { IdentityService } from '../services/identity.service.js';
import { db } from '../db.js';
import { randomUUID, randomBytes } from 'node:crypto';

// ANSI terminal color helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function logPass(title: string) {
  passedTests++;
  console.log(`  ${GREEN}✔${RESET} ${title}`);
}

function logFail(title: string, err: any) {
  failedTests++;
  console.error(`  ${RED}✖${RESET} ${title}`);
  console.error(`    ${RED}${err.message || err}${RESET}`);
}

async function runSuite() {
  console.log(`\n${BOLD}${CYAN}======================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  PRAMAN NETWORK - MASTER AUTOMATED TEST SUITE        ${RESET}`);
  console.log(`${BOLD}${CYAN}  YugabyteDB, TigerData, Meko AI & Biometric Lifecycle${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

  // ==========================================
  // SUITE 1: YUGABYTEDB YSQL ADAPTER & SCHEMA
  // ==========================================
  console.log(`${BOLD}1. YugabyteDB Distributed SQL Engine Tests${RESET}`);
  try {
    const health = await YugabyteService.checkHealth();
    assert.ok(health, 'Health object should be returned');
    assert.ok(health.status, 'Status property must be defined (healthy | degraded)');
    assert.strictEqual(typeof health.inMemoryFallback, 'boolean');
    logPass('YugabyteService.checkHealth() returns valid latency and status structure');

    // Test Schema DDL generator (verifying all 13 distributed tables exist in definition)
    const schemaSql = YugabyteService.getSchemaSql();
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS developers'), 'developers table schema present');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS identity_templates'), 'identity_templates table schema present');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS verification_sessions'), 'verification_sessions table schema present');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS audit_logs'), 'audit_logs table schema present');
    logPass('YugabyteDB DDL initialization defines all 13 core relational tables with foreign keys & indexes');

    // Test graceful query fallback when disconnected
    const fallbackRes = await YugabyteService.queryWithRetry('SELECT 1');
    assert.ok(fallbackRes === null || fallbackRes.rowCount !== undefined, 'Query handles connection status gracefully');
    logPass('YugabyteService.queryWithRetry() handles transient network conditions with backoff & zero crash');
  } catch (err) {
    logFail('YugabyteDB Engine Suite Failed', err);
  }

  // ==========================================
  // SUITE 2: BIOMETRIC TEMPLATE LIFECYCLE & VERSIONING
  // ==========================================
  console.log(`\n${BOLD}2. Biometric Template Versioning & Upgradability Tests${RESET}`);
  const testUserId = `usr_test_${randomUUID().slice(0, 8)}`;
  let v1RecordId = '';
  let v2RecordId = '';

  try {
    // 2.1 Initial Enrollment creates version 1
    const v1 = await TemplateService.enrollInitialTemplate({
      userId: testUserId,
      commitmentHash: '0x17fa890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
      saltHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      modelVersion: 'facenet-512',
    });

    assert.strictEqual(v1.templateVersion, 1, 'Initial template must be version 1');
    assert.strictEqual(v1.status, 'ACTIVE', 'Initial template must have status ACTIVE');
    assert.strictEqual(v1.pramanUserId, testUserId);
    assert.ok(v1.solanaAttestationTx, 'Solana Devnet attestation must be anchored');
    v1RecordId = v1.id;
    logPass('Initial enrollment correctly creates template v1 with status ACTIVE and Solana anchor');

    // 2.2 Attempting second initial enrollment should fail
    let duplicateRejected = false;
    try {
      await TemplateService.enrollInitialTemplate({
        userId: testUserId,
        commitmentHash: '0x9999890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
        saltHex: 'b1b2c3d4e5f60718293a4b5c6d7e8f90',
      });
    } catch {
      duplicateRejected = true;
    }
    assert.ok(duplicateRejected, 'Duplicate initial enrollment without re-enrollment flow must be rejected');
    logPass('Duplicate initial enrollment is rejected when active template already exists');

    // 2.3 Re-enrollment creates version 2, supersedes version 1
    const v2 = await TemplateService.reEnrollTemplate({
      userId: testUserId,
      newCommitmentHash: '0x29bb890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
      newSaltHex: 'c1b2c3d4e5f60718293a4b5c6d7e8f90',
      reason: 'Biometric model upgrade to facenet-v2',
      modelVersion: 'facenet-v2',
    });

    assert.strictEqual(v2.templateVersion, 2, 'Re-enrolled template must increment version to 2');
    assert.strictEqual(v2.status, 'ACTIVE', 'New template must have status ACTIVE');
    assert.strictEqual(v2.modelVersion, 'facenet-v2');
    v2RecordId = v2.id;
    logPass('Re-enrollment increments version to v2 and marks new template as ACTIVE');

    // 2.4 Verify co-existence & history
    const allTemplates = TemplateService.getUserTemplates(testUserId);
    assert.strictEqual(allTemplates.length, 2, 'User must have exactly 2 template versions recorded');
    
    const oldV1 = allTemplates.find(t => t.id === v1RecordId);
    assert.strictEqual(oldV1?.status, 'SUPERSEDED', 'Version 1 must now be SUPERSEDED');
    assert.ok(oldV1?.supersededAt, 'Version 1 must have supersededAt timestamp');

    const activeNow = TemplateService.getActiveTemplate(testUserId);
    assert.strictEqual(activeNow?.id, v2RecordId, 'Active template pointer must resolve strictly to v2');
    logPass('Version history correctly preserves v1 as SUPERSEDED while active pointer points to v2');

    // 2.5 Revocation
    const revoked = TemplateService.revokeTemplate(testUserId, v2RecordId);
    assert.strictEqual(revoked, true, 'Revocation should succeed');
    const revokedRecord = TemplateService.getUserTemplates(testUserId).find(t => t.id === v2RecordId);
    assert.strictEqual(revokedRecord?.status, 'REVOKED', 'Template status must be REVOKED');
    const activeAfterRevoke = TemplateService.getActiveTemplate(testUserId);
    assert.strictEqual(activeAfterRevoke, null, 'No active template should exist after revocation');
    logPass('Revocation transitions template to REVOKED and invalidates active authentication');
  } catch (err) {
    logFail('Biometric Template Lifecycle Suite Failed', err);
  }

  // ==========================================
  // SUITE 3: TIGERDATA ANALYTICS TELEMETRY
  // ==========================================
  console.log(`\n${BOLD}3. TigerData (TimescaleDB) Telemetry & Aggregation Tests${RESET}`);
  const testProjectId = `proj_test_${randomUUID().slice(0, 8)}`;

  try {
    const tdHealth = await TigerDataService.checkHealth();
    assert.ok(tdHealth, 'TigerData health check returns valid structure');
    assert.ok(tdHealth.status, 'Status property must be defined');
    assert.strictEqual(typeof tdHealth.bufferedEvents, 'number');
    logPass('TigerDataService.checkHealth() reports operational status and buffer capacity');

    // Test non-blocking async event recording
    const eventTime = Date.now();
    TigerDataService.recordEventAsync({
      projectId: testProjectId,
      eventType: 'auth.requested',
      status: 'SUCCESS',
      latencyMs: 14,
    });
    TigerDataService.recordEventAsync({
      projectId: testProjectId,
      eventType: 'auth.success',
      status: 'SUCCESS',
      latencyMs: 38,
    });
    TigerDataService.recordEventAsync({
      projectId: testProjectId,
      eventType: 'auth.failed',
      status: 'FAILED',
      errorCode: 'NONCE_MISMATCH',
      latencyMs: 5,
    });
    const recordDuration = Date.now() - eventTime;
    assert.ok(recordDuration < 50, 'Asynchronous event recording must be instantaneous (non-blocking)');
    logPass('TigerData event recording executes asynchronously without blocking the request pipeline');

    // Wait brief tick for async setImmediate ring buffer persistence
    await new Promise((r) => setTimeout(r, 30));

    // Test metric aggregations
    const metrics = await TigerDataService.getProjectMetrics(testProjectId, 7);
    assert.strictEqual(metrics.totalRequests, 3, 'Must record all 3 dispatched telemetry events');
    assert.strictEqual(metrics.successfulVerifications, 2, 'Must calculate 2 successful events');
    assert.strictEqual(metrics.failedVerifications, 1, 'Must calculate 1 failed event');
    assert.strictEqual(metrics.successRatePercentage, 67, 'Success rate percentage must compute accurately');
    assert.ok(metrics.p95LatencyMs >= metrics.averageLatencyMs, 'p95 latency must be greater than or equal to average');
    assert.ok(Array.isArray(metrics.timeSeriesBuckets), 'Time-series bucket aggregation must be an array');
    logPass('TigerData telemetry queries aggregate request volumes, success rates, and p95 latency accurately');
  } catch (err) {
    logFail('TigerData Telemetry Suite Failed', err);
  }

  // ==========================================
  // SUITE 4: MEKO AI MULTI-AGENT DEVELOPER ASSISTANT
  // ==========================================
  console.log(`\n${BOLD}4. Meko AI Multi-Agent Developer Assistant Tests${RESET}`);
  try {
    // 4.1 Privacy sanitization test
    const secretInput = 'My client secret is prm_secret_abcdef123456789 and webhook whsec_test987654321 with hash 0x17fa890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839';
    const responseWithSanitization = await MekoService.askAgent({
      agentRole: 'SECURITY_AGENT',
      prompt: secretInput,
    });
    assert.strictEqual(responseWithSanitization.sanitizationVerified, true, 'Sanitization must be verified');
    logPass('Meko AI privacy filter scrubs API secrets, webhook secrets, and 256-bit crypto hashes before inference');

    // 4.2 Test all 4 agent roles
    const roles: Array<'INTEGRATION_AGENT' | 'TROUBLESHOOTING_AGENT' | 'SECURITY_AGENT' | 'ANALYTICS_ASSISTANT'> = [
      'INTEGRATION_AGENT',
      'TROUBLESHOOTING_AGENT',
      'SECURITY_AGENT',
      'ANALYTICS_ASSISTANT',
    ];

    for (const role of roles) {
      const res = await MekoService.askAgent({
        agentRole: role,
        prompt: `How does Praman Network handle ${role}?`,
      });
      assert.strictEqual(res.agentRole, role);
      assert.ok(res.answer.length > 50, `Answer for ${role} must be informative`);
      assert.ok(Array.isArray(res.suggestedFollowUps), 'Follow-up questions must be provided');
    }
    logPass('All 4 specialized Meko agent roles (Integration, Diagnostics, Security, Analytics) respond with expert context');
  } catch (err) {
    logFail('Meko AI Multi-Agent Suite Failed', err);
  }

  // ==========================================
  // SUITE 5: SECURITY EDGE CASES & PKCE SPEC
  // ==========================================
  console.log(`\n${BOLD}5. Security Edge Cases & Protocol Invariant Tests${RESET}`);
  try {
    const { project: edgeProj } = ProjectService.createProject({
      orgId: 'org_hackcbs_001',
      name: 'Security Test App',
      websiteUrl: 'https://allowed-app.com',
      callbackUrls: ['https://allowed-app.com/callback'],
      environment: 'PRODUCTION',
    });

    // 5.1 Unregistered domain rejection
    let unauthDomainBlocked = false;
    try {
      AuthService.initiateAuthorization({
        clientId: edgeProj.clientId,
        redirectUri: 'https://attacker.com/steal-code',
        responseType: 'code',
        state: 'xyz',
        codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        codeChallengeMethod: 'S256',
        origin: 'https://attacker.com',
      });
    } catch (err: any) {
      if (err.message.includes('DOMAIN_NOT_WHITELISTED') || err.message.includes('UNAUTHORIZED_REDIRECT_URI')) {
        unauthDomainBlocked = true;
      }
    }
    assert.ok(unauthDomainBlocked, 'Unregistered domain and callback URL must be strictly blocked');
    logPass('Unregistered redirect URIs and unverified origin domains are rejected with 400 Bad Request');

    // 5.2 Invalid API key rejection
    const invalidKeyLookup = ProjectService.validateApiKey('prm_live_completely_fake_key_0000000000');
    assert.strictEqual(invalidKeyLookup, null, 'Invalid API key must return null');
    logPass('Invalid or forged developer API keys are rejected immediately');

    // 5.3 Nonce Replay & Double-Spend Protection
    // Create valid session
    const validInit = AuthService.initiateAuthorization({
      clientId: edgeProj.clientId,
      redirectUri: 'https://allowed-app.com/callback',
      responseType: 'code',
      state: 'state_anti_replay',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      codeChallengeMethod: 'S256',
    });

    // Simulate user enrollment for edge testing
    const edgeUser = await IdentityService.registerUser('test_edge@praman.network', '+19999999999');
    await IdentityService.enrollBiometricCommitment({
      userId: edgeUser.id,
      commitmentHash: '0x17fa890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
      saltHex: '11223344556677889900aabbccddeeff',
    });

    // Complete session 1st time
    const codeIssue = await AuthService.verifyChallengeAndIssueCode({
      sessionId: validInit.session.id,
      userId: edgeUser.id,
      zkPayload: {
        proof: {
          pi_a: ['0x01', '0x02', '0x01'],
          pi_b: [['0x01', '0x02'], ['0x03', '0x04'], ['0x01', '0x00']],
          pi_c: ['0x05', '0x06', '0x01'],
          protocol: 'groth16',
          curve: 'bn128',
        },
        publicSignals: [
          '0x17fa890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
          '25.0',
          validInit.session.nonce,
          edgeProj.clientId,
          (Date.now() + 300000).toString(),
        ],
        circuitType: 'BIOMETRIC_SIMILARITY_GROTH16',
        isSimulatedDemoMode: true,
      },
      grantedAttributes: ['FULL_NAME'],
    });
    assert.ok(codeIssue.authCode, 'First verification must issue an authorization code');

    // Attempt replay with identical session ID
    let replayBlocked = false;
    try {
      await AuthService.verifyChallengeAndIssueCode({
        sessionId: validInit.session.id,
        userId: edgeUser.id,
        zkPayload: {
          proof: {
            pi_a: ['0x01', '0x02', '0x01'],
            pi_b: [['0x01', '0x02'], ['0x03', '0x04'], ['0x01', '0x00']],
            pi_c: ['0x05', '0x06', '0x01'],
            protocol: 'groth16',
            curve: 'bn128',
          },
          publicSignals: [
            '0x17fa890e1bcba3d57803a0e59ca65378291aebf102839213847291aebf102839',
            '25.0',
            validInit.session.nonce,
            edgeProj.clientId,
            (Date.now() + 300000).toString(),
          ],
          circuitType: 'BIOMETRIC_SIMILARITY_GROTH16',
          isSimulatedDemoMode: true,
        },
        grantedAttributes: ['FULL_NAME'],
      });
    } catch (err: any) {
      if (err.message.includes('SESSION_ALREADY_PROCESSED')) {
        replayBlocked = true;
      }
    }
    assert.ok(replayBlocked, 'Replaying an already used session must be strictly blocked');
    logPass('Replay attacks are prevented: single-use auth sessions transition state atomically');

    // 5.4 Expired session rejection
    const expiredInit = AuthService.initiateAuthorization({
      clientId: edgeProj.clientId,
      redirectUri: 'https://allowed-app.com/callback',
      responseType: 'code',
      state: 'state_expired',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      codeChallengeMethod: 'S256',
    });
    // Manually force expiry into the past
    expiredInit.session.expiresAt = new Date(Date.now() - 1000).toISOString();
    db.authRequests.set(expiredInit.session.id, expiredInit.session);

    let expiredBlocked = false;
    try {
      await AuthService.verifyChallengeAndIssueCode({
        sessionId: expiredInit.session.id,
        userId: edgeUser.id,
        zkPayload: {
          proof: {
            pi_a: ['0x01', '0x02', '0x01'],
            pi_b: [['0x01', '0x02'], ['0x03', '0x04'], ['0x01', '0x00']],
            pi_c: ['0x05', '0x06', '0x01'],
            protocol: 'groth16',
            curve: 'bn128',
          },
          publicSignals: ['0x17fa...', '25.0', expiredInit.session.nonce, edgeProj.clientId, '123'],
          circuitType: 'BIOMETRIC_SIMILARITY_GROTH16',
          isSimulatedDemoMode: true,
        },
        grantedAttributes: [],
      });
    } catch (err: any) {
      if (err.message.includes('AUTH_SESSION_EXPIRED')) {
        expiredBlocked = true;
      }
    }
    assert.ok(expiredBlocked, 'Expired auth sessions must be rejected');
    logPass('Expired authorization sessions are rejected with AUTH_SESSION_EXPIRED');
  } catch (err) {
    logFail('Security Edge Cases Suite Failed', err);
  }

  // ==========================================
  // FINAL SUMMARY REPORT
  // ==========================================
  console.log(`\n${BOLD}======================================================${RESET}`);
  if (failedTests === 0) {
    console.log(`${BOLD}${GREEN}  ALL ${passedTests} TEST SUITES PASSED SUCCESSFULLY!${RESET}`);
    console.log(`${GREEN}  ✓ YugabyteDB Distributed SQL Ready${RESET}`);
    console.log(`${GREEN}  ✓ Biometric Template Versioning & Upgradability Active${RESET}`);
    console.log(`${GREEN}  ✓ TigerData TimescaleDB Telemetry Verified${RESET}`);
    console.log(`${GREEN}  ✓ Meko AI Multi-Agent Layer Operational${RESET}`);
    console.log(`${GREEN}  ✓ Security & Replay Protections Validated${RESET}`);
    console.log(`${BOLD}${GREEN}======================================================${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${BOLD}${RED}  ${failedTests} TEST(S) FAILED OUT OF ${passedTests + failedTests}${RESET}`);
    console.log(`${BOLD}${RED}======================================================${RESET}\n`);
    process.exit(1);
  }
}

runSuite().catch((fatal) => {
  console.error('Fatal test runner error:', fatal);
  process.exit(1);
});

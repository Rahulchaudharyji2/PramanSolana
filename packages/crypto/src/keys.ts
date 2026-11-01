import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface GeneratedApiKey {
  rawKey: string; // "prm_live_abc123..." shown only once
  keyPrefix: string; // "prm_live_abc1" for dashboard identification
  keyHash: string; // Salted SHA-256 stored in DB
}

/**
 * Generates a high-entropy API key.
 * Format: prm_{env}_{random32Hex}
 */
export function generateApiKey(environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' = 'PRODUCTION'): GeneratedApiKey {
  const envPrefix = environment === 'PRODUCTION' ? 'live' : 'test';
  const randomEntropy = randomBytes(24).toString('hex');
  const rawKey = `prm_${envPrefix}_${randomEntropy}`;
  const keyPrefix = rawKey.slice(0, 14); // e.g. prm_live_e3f9a

  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Computes a deterministic hash of an API key for safe database storage.
 */
export function hashApiKey(rawKey: string): string {
  const salt = 'praman_api_key_salt_v1';
  return createHash('sha256')
    .update(`${salt}:${rawKey}`)
    .digest('hex');
}

/**
 * Constant-time comparison for API key verification.
 */
export function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const calculatedHash = hashApiKey(rawKey);
  const a = Buffer.from(calculatedHash, 'utf-8');
  const b = Buffer.from(storedHash, 'utf-8');

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Signs a webhook payload with the project webhook secret.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verifies a webhook signature using constant-time comparison.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSig = signWebhookPayload(payload, secret);
  const a = Buffer.from(signature, 'utf-8');
  const b = Buffer.from(expectedSig, 'utf-8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}


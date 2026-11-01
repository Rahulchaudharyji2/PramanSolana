import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a high-entropy cryptographically secure nonce.
 */
export function generateNonce(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generates a PKCE code_verifier (43-128 chars base64url).
 */
export function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9\-._~]/g, '')
    .slice(0, 64);
}

/**
 * Computes the S256 code_challenge from a code_verifier according to RFC 7636.
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256')
    .update(codeVerifier, 'ascii')
    .digest('base64url');
}

/**
 * Verifies that code_challenge == BASE64URL-ENCODE(SHA256(code_verifier)).
 */
export function verifyCodeChallenge(codeVerifier: string, expectedChallenge: string): boolean {
  const computed = generateCodeChallenge(codeVerifier);
  return computed === expectedChallenge;
}


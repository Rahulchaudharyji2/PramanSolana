import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'node:crypto';

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64 (12 bytes)
  authTag: string; // Base64 (16 bytes)
}

/**
 * Derives a dedicated 32-byte Data Encryption Key (DEK) from a Master Key using HKDF-SHA256
 */
export function deriveKey(masterSecret: string, info: string, salt: string = 'praman_vault_salt_v1'): Buffer {
  const masterKeyBuf = Buffer.from(masterSecret, 'utf-8');
  const saltBuf = Buffer.from(salt, 'utf-8');
  const infoBuf = Buffer.from(info, 'utf-8');

  return Buffer.from(hkdfSync('sha256', masterKeyBuf, saltBuf, infoBuf, 32));
}

/**
 * Encrypts a plaintext string using AES-256-GCM authenticated envelope encryption.
 */
export function encryptAttribute(plaintext: string, dek: Buffer): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dek, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies the authentication tag.
 * Throws if authentication tag fails or decryption is tampered with.
 */
export function decryptAttribute(payload: EncryptedPayload, dek: Buffer): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', dek, iv);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}


import { createHmac } from 'node:crypto';

/**
 * Derives a pairwise pseudonymous identifier for a specific client application / project.
 *
 * This ensures Application A receives `prm_user_abc...` and Application B receives `prm_user_xyz...`.
 * Even if both databases were leaked, the user identities cannot be correlated across applications.
 *
 * @param userRootSecret Secret persistent user identifier or root key
 * @param projectId Unique identifier of the relying party / project
 */
export function derivePairwiseId(userRootSecret: string, projectId: string): string {
  if (!userRootSecret || !projectId) {
    throw new Error('userRootSecret and projectId are required for pairwise derivation');
  }

  const hmac = createHmac('sha256', Buffer.from(userRootSecret, 'utf-8'));
  hmac.update(`praman_pairwise_v1:${projectId}`);
  const digest = hmac.digest('hex');

  // Prefix with prm_user_ followed by the first 24 characters of HMAC
  return `prm_user_${digest.slice(0, 24)}`;
}


import { VaultAttributeKey } from './identity.js';

export interface ConsentRequestView {
  authRequestId: string;
  applicationName: string;
  applicationLogoUrl?: string;
  applicationCategory?: string;
  verifiedDomain: string;
  requestedAttributes: {
    key: VaultAttributeKey;
    label: string;
    description: string;
    required: boolean;
    zkPreserved?: boolean; // e.g. age check via ZK instead of raw birthdate
  }[];
  requestedScopes: string[];
}

export interface ConsentDecision {
  authRequestId: string;
  approved: boolean;
  grantedAttributeKeys: VaultAttributeKey[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  projectId: string;
  pairwiseId: string;
  grantedScopes: string[];
  grantedAttributes: VaultAttributeKey[];
  revoked: boolean;
  revokedAt?: string;
  createdAt: string;
}


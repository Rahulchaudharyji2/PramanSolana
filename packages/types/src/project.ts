export type Environment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export type DomainStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REVOKED';

export type DomainVerificationMethod = 'DNS_TXT' | 'HTTP_WELL_KNOWN';

export interface Developer {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  createdAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  environment: Environment;
  clientId: string;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface DomainWhitelist {
  id: string;
  projectId: string;
  domain: string;
  verificationToken: string;
  status: DomainStatus;
  method: DomainVerificationMethod;
  verifiedAt?: string;
  lastCheckedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface ProjectCredentials {
  projectId: string;
  clientId: string;
  clientSecret: string; // Shown only once upon generation
  webhookSecret: string;
}


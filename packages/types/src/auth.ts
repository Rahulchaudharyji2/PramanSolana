import { VaultAttributeKey } from './identity.js';

export type AuthScope =
  | 'openid'
  | 'profile'
  | 'email'
  | 'phone'
  | 'zk:biometric'
  | 'attribute:is_over_18';

export interface AuthSessionInitParams {
  clientId: string;
  redirectUri: string;
  responseType: 'code';
  scope: string; // Space separated AuthScope
  state: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  nonce?: string;
}

export interface AuthRequestSession {
  id: string;
  projectId: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  nonce: string;
  scopes: AuthScope[];
  status: 'INITIATED' | 'CHALLENGE_ISSUED' | 'VERIFIED' | 'EXCHANGED' | 'EXPIRED' | 'REJECTED';
  authCode?: string;
  userId?: string;
  pairwiseId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface TokenExchangeParams {
  grantType: 'authorization_code';
  code: string;
  clientId: string;
  clientSecret?: string; // If confidential client
  redirectUri: string;
  codeVerifier: string;
}

export interface TokenResponse {
  accessToken: string;
  idToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
  pairwiseUser: {
    pairwiseId: string; // e.g. prm_user_9fa4b2...
    pseudonymousId?: string; // alias for pairwiseId
    id?: string; // alias for pairwiseId
    name?: string;
    fullName?: string;
    email?: string;
    walletAddress?: string;
    solanaWalletAddress?: string;
    privyWalletAddress?: string;
    privyUserId?: string;
    zkVerified: boolean;
    solanaAttestationSignature?: string;
    permittedAttributes: Partial<Record<VaultAttributeKey, any>>;
  };
  authResponse?: PramanAuthResponse;
}

export type PramanAuthErrorCode =
  | 'BIOMETRIC_VERIFICATION_FAILED'
  | 'USER_CANCELLED'
  | 'CONSENT_DENIED'
  | 'SESSION_EXPIRED'
  | 'INVALID_ASSERTION'
  | 'CLIENT_NOT_AUTHORIZED'
  | 'VERIFICATION_TIMEOUT'
  | 'INTERNAL_ERROR';

export interface PramanVerificationDetails {
  status: 'verified' | 'pending' | 'failed';
  method: 'praman_biometric' | string;
  verified_at: string;
}

export interface PramanSessionDetails {
  id: string; // e.g. psess_xxxxxxxxx
  status: 'active' | 'expired' | 'revoked';
  expires_at: string;
}

export interface PramanUserClaims {
  id: string; // pairwise pseudonymous user reference
  name?: string;
  email?: string;
  avatar?: string | null;
}

export interface PramanAttributePermissions {
  name: boolean;
  email: boolean;
  avatar: boolean;
  [key: string]: boolean;
}

export interface PramanPrivacyMetadata {
  profile_stored_by_praman: false;
  disclosure: 'user_consented';
  persistent_identity: false;
}

export interface PramanSignedAuthentication {
  provider: 'praman';
  assertion_type: 'signed';
  assertion: string; // Signed short-lived JWT assertion
}

export interface PramanAuthSuccessResponse {
  success: true;
  authenticated: true;
  verification: PramanVerificationDetails;
  session: PramanSessionDetails;
  user: PramanUserClaims;
  permissions: PramanAttributePermissions;
  privacy: PramanPrivacyMetadata;
  authentication: PramanSignedAuthentication;
}

export interface PramanAuthFailureResponse {
  success: false;
  authenticated: false;
  error: {
    code: PramanAuthErrorCode;
    message: string;
  };
}

export type PramanAuthResponse = PramanAuthSuccessResponse | PramanAuthFailureResponse;

export interface PramanAssertionClaims {
  iss: string; // e.g. https://auth.praman.network
  aud: string; // registered_client_id
  sub: string; // pairwise_user_reference
  auth_status: boolean;
  session_id: string; // psess_xxxxxxxxx
  iat: number;
  exp: number;
  jti: string; // unique_assertion_id
}

export interface IdTokenClaims {
  iss: string; // https://api.praman.network
  sub: string; // Pairwise pseudonymous ID: prm_user_xxxx
  aud: string; // Client ID
  nonce: string;
  exp: number;
  iat: number;
  zk_verified: boolean;
  zk_proof_ref?: string;
  solana_attestation_tx?: string;
  [key: string]: any;
}


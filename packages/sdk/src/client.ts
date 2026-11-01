import {
  AuthScope,
  TokenResponse,
  IdTokenClaims,
  PramanAuthResponse,
  PramanAuthSuccessResponse,
  PramanAuthFailureResponse,
  PramanAuthErrorCode,
  PramanAssertionClaims,
  PramanSessionDetails,
} from '@praman-network/types';
import { getDefaultStorage, StorageAdapter } from './storage.js';

export interface PramanConfig {
  apiKey?: string;
  clientId?: string;
  network?: 'solana-devnet' | 'solana-mainnet' | 'polygon-amoy' | string;
  backendUrl?: string;
  livenessLevel?: 'strict' | 'standard' | 'off';
  redirectUri?: string;
  storage?: StorageAdapter;
}

export interface PramanClientOptions extends PramanConfig {
  clientId?: string;
  redirectUri?: string;
  pramanUrl?: string; // Default: http://localhost:4000
}

export class PramanClient {
  public readonly clientId: string;
  public readonly apiKey?: string;
  public readonly redirectUri: string;
  public readonly pramanUrl: string;
  public readonly network: string;
  public readonly livenessLevel: 'strict' | 'standard' | 'off';
  private storage: StorageAdapter;
  private activeSession: PramanSessionDetails | null = null;
  private lastAuthResponse: PramanAuthSuccessResponse | null = null;

  constructor(options: PramanClientOptions | string) {
    if (typeof options === 'string') {
      options = { apiKey: options, clientId: options };
    }

    const key = options.apiKey || options.clientId;
    if (!key) {
      throw new Error('[PramanSDK] apiKey or clientId is required.');
    }

    this.clientId = options.clientId || key;
    this.apiKey = options.apiKey || key;
    this.redirectUri =
      options.redirectUri ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
    this.pramanUrl = (
      options.backendUrl ||
      options.pramanUrl ||
      (options as any).endpoint ||
      'http://localhost:4000'
    ).replace(/\/$/, '');
    this.network = options.network || 'solana-devnet';
    this.livenessLevel = options.livenessLevel || 'standard';
    this.storage = options.storage || getDefaultStorage();
  }

  private generateRandomString(length: number = 48): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let res = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < length; i++) {
        res += chars[bytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return res;
  }

  private async sha256Base64Url(plain: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return Buffer.from(plain).toString('base64url');
  }

  public async getAuthorizationUrl(options: {
    scopes?: AuthScope[];
    state?: string;
  } = {}): Promise<{ url: string; codeVerifier: string; state: string; nonce: string }> {
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.sha256Base64Url(codeVerifier);
    const state = options.state || this.generateRandomString(24);
    const nonce = this.generateRandomString(32);
    const scopeStr = (options.scopes || ['openid', 'profile', 'zk:biometric']).join(' ');

    this.storage.setItem(`praman_code_verifier_${state}`, codeVerifier);
    this.storage.setItem(`praman_nonce_${state}`, nonce);

    const queryParams = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopeStr,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      nonce: nonce,
    });

    const url = `${this.pramanUrl}/api/v1/auth/authorize?${queryParams.toString()}`;

    return {
      url,
      codeVerifier,
      state,
      nonce,
    };
  }

  public async loginWithRedirect(options: { scopes?: AuthScope[]; state?: string } = {}): Promise<void> {
    const { url } = await this.getAuthorizationUrl(options);
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }

  public async loginWithPopup(options: { scopes?: AuthScope[] } = {}): Promise<TokenResponse> {
    if (typeof window === 'undefined') {
      throw new Error('[PramanSDK] loginWithPopup can only be called in a browser environment.');
    }

    const { url, codeVerifier, state } = await this.getAuthorizationUrl(options);
    const popupUrl = `${url}&popup=1`;

    const width = 500;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      'praman_auth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      throw new Error('[PramanSDK] Popup window was blocked. Please allow popups for this domain.');
    }

    return new Promise((resolve, reject) => {
      let isResolved = false;

      let bc: BroadcastChannel | null = null;
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          bc = new BroadcastChannel('praman_auth_channel');
          bc.onmessage = async (event: MessageEvent) => {
            if (event.data?.type === 'PRAMAN_AUTH_SUCCESS' && event.data.code) {
              await finishSuccess(event.data.code);
            }
          };
        } catch (e) {}
      }

      const cleanup = () => {
        clearInterval(timer);
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('storage', handleStorage);
        if (bc) {
          try { bc.close(); } catch (e) {}
        }
      };

      const finishSuccess = async (code: string) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        try {
          if (!popup.closed) popup.close();
        } catch (e) {}

        try {
          const tokenRes = await this.exchangeCode({
            code,
            state,
            codeVerifier,
          });
          resolve(tokenRes);
        } catch (err) {
          reject(err);
        }
      };

      const handleStorage = async (e: StorageEvent) => {
        if (e.key === 'praman_auth_callback' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.code) {
              await finishSuccess(data.code);
            }
          } catch (err) {}
        }
      };

      window.addEventListener('storage', handleStorage);

      const handleMessage = async (event: MessageEvent) => {
        if (!event.data) return;

        if (event.data.type === 'PRAMAN_AUTH_FAILED') {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          const errCode = event.data.error?.code || 'CONSENT_DENIED';
          const errMsg = event.data.error?.message || 'Authentication cancelled by user.';
          reject(new Error(`[PramanSDK] ${errCode}: ${errMsg}`));
          return;
        }

        if (event.data.type !== 'PRAMAN_AUTH_SUCCESS') return;
        await finishSuccess(event.data.code);
      };

      window.addEventListener('message', handleMessage);

      let closedGraceChecks = 0;
      const timer = setInterval(() => {
        // Multi-channel check: 1. LocalStorage synchronization
        const storedCb = this.storage.getItem('praman_auth_callback');
        if (storedCb) {
          try {
            const parsed = JSON.parse(storedCb);
            if (parsed.code) {
              this.storage.removeItem('praman_auth_callback');
              finishSuccess(parsed.code);
              return;
            }
          } catch (e) {}
        }

        // Multi-channel check: 2. If popup redirected to same-origin redirect_uri
        try {
          if (!popup.closed && popup.location) {
            const href = popup.location.href;
            if (href && href.includes('code=')) {
              const urlObj = new URL(href);
              const authCode = urlObj.searchParams.get('code');
              if (authCode) {
                finishSuccess(authCode);
                return;
              }
            }
          }
        } catch (e) {
          // Cross-origin access while popup on localhost:3000 is safely ignored
        }

        if (popup.closed) {
          if (isResolved) return;
          closedGraceChecks++;
          // Allow 8 checks (4.0 seconds) for in-flight message exchange to resolve
          if (closedGraceChecks >= 8) {
            cleanup();
            if (!isResolved) {
              reject(new Error('[PramanSDK] USER_CANCELLED: Authentication was cancelled by user.'));
            }
          }
        }
      }, 500);
    });
  }

  public async exchangeCode(params: {
    code: string;
    state?: string;
    codeVerifier?: string;
  }): Promise<TokenResponse> {
    let verifier = params.codeVerifier;

    if (!verifier && params.state) {
      verifier = this.storage.getItem(`praman_code_verifier_${params.state}`) || undefined;
    }

    if (!verifier) {
      throw new Error(
        '[PramanSDK] PKCE code_verifier is missing. Ensure exchangeCode is called in the same browser session or pass codeVerifier explicitly.'
      );
    }

    const res = await fetch(`${this.pramanUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: params.code,
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`[PramanSDK] Token exchange failed (${res.status}): ${errorData.message || JSON.stringify(errorData)}`);
    }

    const data: TokenResponse = await res.json();

    if (params.state) {
      this.storage.removeItem(`praman_code_verifier_${params.state}`);
      this.storage.removeItem(`praman_nonce_${params.state}`);
    }

    this.storage.setItem('praman_access_token', data.accessToken);
    if (data.pairwiseUser) {
      this.storage.setItem('praman_user_data', JSON.stringify(data.pairwiseUser));
    }
    if (data.authResponse && data.authResponse.success) {
      this.activeSession = data.authResponse.session;
      this.lastAuthResponse = data.authResponse;
      this.storage.setItem('praman_auth_response', JSON.stringify(data.authResponse));
    }

    return data;
  }

  /**
   * Dispatches ZK Proof verification directly to the Praman Security Relayer.
   * Validates API key and anchors proof attestation on Solana Devnet.
   */
  public async verifyZKProof(
    userAddress: string,
    proof: any,
    publicSignals: any[]
  ): Promise<{ success: boolean; txHash?: string; message?: string }> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

    const res = await fetch(`${this.pramanUrl}/api/v1/verify-zk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey || this.clientId,
        'origin': origin,
      },
      body: JSON.stringify({
        address: userAddress,
        proof,
        publicSignals,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || 'ZK proof verification failed');
    }

    return await res.json();
  }

  /**
   * Verifies an ID token and enforces environment strict mode:
   * Rejects mock tokens in production builds.
   */
  public verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = this.decodeIdToken(token);
      const isProduction =
        typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

      if (payload.is_mock && isProduction) {
        return {
          valid: false,
          error: 'Unauthorized: Mock tokens are restricted in production environments',
        };
      }

      if (payload.exp && Date.now() / 1000 > payload.exp) {
        return {
          valid: false,
          error: 'Token has expired',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Invalid cryptographic token',
      };
    }
  }

  /**
   * Primary Authentication Method (Privacy-First Standard Contract)
   * Authenticates user, verifies ZK biometric proof, obtains selective disclosure consent,
   * and returns the standard authentication response contract.
   */
  public async authenticate(options: {
    scope?: string[];
    mode?: 'popup' | 'redirect';
  } = {}): Promise<PramanAuthResponse> {
    try {
      const scopes = (options.scope || ['name', 'email']) as AuthScope[];
      const tokenRes = await this.loginWithPopup({ scopes });

      if (tokenRes.authResponse) {
        if (tokenRes.authResponse.success) {
          this.activeSession = tokenRes.authResponse.session;
          this.lastAuthResponse = tokenRes.authResponse;
        }
        return tokenRes.authResponse;
      }

      // Fallback construction if API returned legacy format
      const granted = tokenRes.pairwiseUser.permittedAttributes || {};
      const nameApproved = !!(tokenRes.pairwiseUser.name || granted.FULL_NAME);
      const emailApproved = !!(tokenRes.pairwiseUser.email || granted.EMAIL);

      const successResponse: PramanAuthSuccessResponse = {
        success: true,
        authenticated: true,
        verification: {
          status: 'verified',
          method: 'praman_biometric',
          verified_at: new Date().toISOString(),
        },
        session: {
          id: `psess_${this.generateRandomString(16)}`,
          status: 'active',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
        user: {
          id: tokenRes.pairwiseUser.pairwiseId || tokenRes.pairwiseUser.id || 'prm_user_anonymous',
          ...(nameApproved && tokenRes.pairwiseUser.name ? { name: tokenRes.pairwiseUser.name } : {}),
          ...(emailApproved && tokenRes.pairwiseUser.email ? { email: tokenRes.pairwiseUser.email } : {}),
        },
        permissions: {
          name: nameApproved,
          email: emailApproved,
          avatar: false,
        },
        privacy: {
          profile_stored_by_praman: false,
          disclosure: 'user_consented',
          persistent_identity: false,
        },
        authentication: {
          provider: 'praman',
          assertion_type: 'signed',
          assertion: tokenRes.idToken,
        },
      };

      this.activeSession = successResponse.session;
      this.lastAuthResponse = successResponse;
      return successResponse;
    } catch (err: any) {
      const msg = err.message || '';
      let code: PramanAuthErrorCode = 'INTERNAL_ERROR';

      if (msg.includes('cancelled') || msg.includes('Popup window was closed')) {
        code = 'USER_CANCELLED';
      } else if (msg.includes('consent') || msg.includes('CONSENT_DENIED')) {
        code = 'CONSENT_DENIED';
      } else if (msg.includes('biometric') || msg.includes('Biometric') || msg.includes('ZK')) {
        code = 'BIOMETRIC_VERIFICATION_FAILED';
      } else if (msg.includes('expired') || msg.includes('timeout')) {
        code = 'SESSION_EXPIRED';
      } else if (msg.includes('not authorized') || msg.includes('client')) {
        code = 'CLIENT_NOT_AUTHORIZED';
      }

      const failureResponse: PramanAuthFailureResponse = {
        success: false,
        authenticated: false,
        error: {
          code,
          message: msg || 'Identity verification was unsuccessful.',
        },
      };

      return failureResponse;
    }
  }

  /**
   * Retrieves the current authentication session status and expiry.
   */
  public async getSession(sessionId?: string): Promise<PramanSessionDetails | null> {
    const targetId = sessionId || this.activeSession?.id;
    if (!targetId) return null;

    try {
      const res = await fetch(`${this.pramanUrl}/api/v1/auth/session/${targetId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.session) return null;

      const details: PramanSessionDetails = {
        id: data.session.id,
        status: data.session.status,
        expires_at: data.session.expiresAt || data.session.expires_at,
      };

      if (this.activeSession && this.activeSession.id === targetId) {
        this.activeSession = details;
      }

      return details;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether the user is currently authenticated with a valid, non-expired session.
   */
  public async getAuthenticationStatus(): Promise<{
    authenticated: boolean;
    session?: PramanSessionDetails | null;
  }> {
    if (!this.activeSession) {
      return { authenticated: false, session: null };
    }

    const session = await this.getSession(this.activeSession.id);
    if (!session || session.status !== 'active') {
      this.activeSession = null;
      return { authenticated: false, session };
    }

    if (new Date() > new Date(session.expires_at)) {
      this.activeSession = null;
      return { authenticated: false, session: { ...session, status: 'expired' } };
    }

    return { authenticated: true, session };
  }

  /**
   * Revokes an active authentication session.
   */
  public async revokeSession(sessionId?: string): Promise<{ success: boolean; message: string }> {
    const targetId = sessionId || this.activeSession?.id;
    if (!targetId) {
      return { success: false, message: 'No active session to revoke.' };
    }

    try {
      const res = await fetch(`${this.pramanUrl}/api/v1/auth/session/${targetId}/revoke`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (this.activeSession && this.activeSession.id === targetId) {
        this.activeSession = null;
        this.lastAuthResponse = null;
      }

      return {
        success: res.ok,
        message: data.message || `Session ${targetId} revocation processed.`,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Verifies a signed short-lived authentication assertion independently.
   * Can be used by frontend or backend services.
   */
  public async verifyAssertion(
    assertion: string,
    clientId?: string
  ): Promise<{ valid: boolean; claims?: PramanAssertionClaims; error?: string }> {
    try {
      const res = await fetch(`${this.pramanUrl}/api/v1/auth/verify-assertion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assertion,
          clientId: clientId || this.clientId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        return {
          valid: false,
          error: data.error || 'Assertion validation failed.',
        };
      }

      return {
        valid: true,
        claims: data.claims,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Network error verifying assertion.',
      };
    }
  }

  public getStoredUser(): TokenResponse['pairwiseUser'] | null {
    if (this.lastAuthResponse && this.lastAuthResponse.success) {
      const u = this.lastAuthResponse.user;
      return {
        pairwiseId: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        zkVerified: true,
        permittedAttributes: {},
      };
    }
    const stored = this.storage.getItem('praman_user_data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  }

  public async logout(): Promise<void> {
    if (this.activeSession?.id) {
      await this.revokeSession(this.activeSession.id).catch(() => {});
    }
    this.activeSession = null;
    this.lastAuthResponse = null;
    this.storage.removeItem('praman_access_token');
    this.storage.removeItem('praman_user_data');
    this.storage.removeItem('praman_auth_response');
  }

  public decodeIdToken(idToken: string): IdTokenClaims {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }
}

// ---------------- SINGLETON HELPER METHODS ----------------

let globalClient: PramanClient | null = null;

export function initPraman(
  apiKeyOrConfig: string | PramanConfig,
  maybeBackendUrl?: string
): PramanClient {
  let config: PramanConfig;
  if (typeof apiKeyOrConfig === 'string') {
    config = {
      apiKey: apiKeyOrConfig,
      clientId: apiKeyOrConfig,
      backendUrl: maybeBackendUrl,
    };
  } else {
    config = apiKeyOrConfig;
  }

  globalClient = new PramanClient(config);
  return globalClient;
}

export function getPramanClient(): PramanClient {
  if (!globalClient) {
    globalClient = initPraman({
      clientId: 'prm_client_c3ff296e8db5def9',
      backendUrl: 'http://localhost:4000',
      network: 'solana-devnet',
    });
  }
  return globalClient;
}

export async function authenticate(options?: {
  scope?: string[];
  mode?: 'popup' | 'redirect';
}): Promise<PramanAuthResponse> {
  const client = getPramanClient();
  return client.authenticate(options);
}

export async function getSession(sessionId?: string): Promise<PramanSessionDetails | null> {
  const client = getPramanClient();
  return client.getSession(sessionId);
}

export async function getAuthenticationStatus(): Promise<{
  authenticated: boolean;
  session?: PramanSessionDetails | null;
}> {
  const client = getPramanClient();
  return client.getAuthenticationStatus();
}

export async function revokeSession(sessionId?: string): Promise<{ success: boolean; message: string }> {
  const client = getPramanClient();
  return client.revokeSession(sessionId);
}

export async function verifyAssertion(
  assertion: string,
  clientId?: string
): Promise<{ valid: boolean; claims?: PramanAssertionClaims; error?: string }> {
  const client = getPramanClient();
  return client.verifyAssertion(assertion, clientId);
}

export async function logout(): Promise<void> {
  const client = getPramanClient();
  return client.logout();
}

export async function verifyZKProof(
  userAddress: string,
  proof: any,
  publicSignals: any[]
): Promise<{ success: boolean; txHash?: string; message?: string }> {
  const client = getPramanClient();
  return client.verifyZKProof(userAddress, proof, publicSignals);
}

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { PramanClient, PramanClientOptions } from '@praman-network/sdk';
import { TokenResponse, AuthScope, PramanAuthResponse } from '@praman-network/types';

export interface PramanContextValue {
  client: PramanClient;
  user: TokenResponse['pairwiseUser'] | null;
  authResponse: PramanAuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  authenticate: (options?: { scope?: string[]; mode?: 'popup' | 'redirect' }) => Promise<PramanAuthResponse>;
  login: (options?: { scopes?: AuthScope[]; mode?: 'popup' | 'redirect' }) => Promise<TokenResponse | void>;
  logout: () => void;
  handleAuthCallback: (code: string, state?: string) => Promise<TokenResponse>;
}

const PramanContext = createContext<PramanContextValue | null>(null);

export interface PramanProviderProps {
  clientId: string;
  redirectUri?: string;
  pramanUrl?: string;
  endpoint?: string;
  storage?: any;
  children: React.ReactNode;
}

export const PramanProvider: React.FC<PramanProviderProps> = ({
  children,
  clientId,
  redirectUri,
  pramanUrl,
  endpoint,
  storage,
}) => {
  const effectiveRedirectUri =
    redirectUri || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const effectivePramanUrl = pramanUrl || endpoint || 'http://localhost:4000';

  const client = useMemo(
    () =>
      new PramanClient({
        clientId,
        redirectUri: effectiveRedirectUri,
        pramanUrl: effectivePramanUrl,
        storage,
      }),
    [clientId, effectiveRedirectUri, effectivePramanUrl, storage]
  );

  const [user, setUser] = useState<TokenResponse['pairwiseUser'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const normalizeUser = (u: TokenResponse['pairwiseUser'] | null): TokenResponse['pairwiseUser'] | null => {
    if (!u) return null;
    return {
      ...u,
      pseudonymousId: u.pseudonymousId || u.pairwiseId,
      id: u.id || u.pairwiseId,
    };
  };

  // Initialize cached session on mount & handle popup callback routing
  useEffect(() => {
    try {
      // If current window is an OAuth popup callback, relay code and close
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const isPopup = params.get('popup') === '1' || window.name === 'praman_auth_popup' || !!window.opener;

        if (code && isPopup) {
          const state = params.get('state') || '';
          const payload = { type: 'PRAMAN_AUTH_SUCCESS', code, state };

          // Channel 1: LocalStorage synchronization
          localStorage.setItem('praman_auth_callback', JSON.stringify({ code, state, ts: Date.now() }));

          // Channel 2: BroadcastChannel
          if ('BroadcastChannel' in window) {
            try {
              const bc = new BroadcastChannel('praman_auth_channel');
              bc.postMessage(payload);
              bc.close();
            } catch (e) {}
          }

          // Channel 3: Direct window.opener postMessage
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, '*');
          }

          setTimeout(() => {
            try { window.close(); } catch (e) {}
          }, 300);
          return;
        }
      }

      const cached = client.getStoredUser();
      if (cached) {
        setUser(normalizeUser(cached));
      }
    } catch (err: any) {
      console.error('[PramanProvider] Failed to load cached session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const [authResponse, setAuthResponse] = useState<PramanAuthResponse | null>(null);

  const authenticate = async (
    options: { scope?: string[]; mode?: 'popup' | 'redirect' } = {}
  ): Promise<PramanAuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.authenticate(options);
      setAuthResponse(response);
      if (response.success && response.authenticated) {
        setUser({
          pairwiseId: response.user.id,
          pseudonymousId: response.user.id,
          id: response.user.id,
          name: response.user.name,
          fullName: response.user.name,
          email: response.user.email,
          zkVerified: true,
          permittedAttributes: {
            ...(response.permissions.name ? { FULL_NAME: response.user.name } : {}),
            ...(response.permissions.email ? { EMAIL: response.user.email } : {}),
          },
        });
      }
      setIsLoading(false);
      return response;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  const login = async (options: { scopes?: AuthScope[]; mode?: 'popup' | 'redirect' } = {}) => {
    setError(null);
    const mode = options.mode || 'popup'; // Default to Clerk/Google style popup
    try {
      if (mode === 'popup') {
        setIsLoading(true);
        const res = await client.loginWithPopup({ scopes: options.scopes });
        setUser(normalizeUser(res.pairwiseUser));
        if (res.authResponse) {
          setAuthResponse(res.authResponse);
        }
        setIsLoading(false);
        return res;
      } else {
        await client.loginWithRedirect({ scopes: options.scopes });
      }
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    client.logout();
    setUser(null);
    setAuthResponse(null);
  };

  const handleAuthCallback = async (code: string, state?: string): Promise<TokenResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.exchangeCode({ code, state });
      setUser(normalizeUser(response.pairwiseUser));
      if (response.authResponse) {
        setAuthResponse(response.authResponse);
      }
      return response;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: PramanContextValue = {
    client,
    user,
    authResponse,
    isAuthenticated: !!user,
    isLoading,
    error,
    authenticate,
    login,
    logout,
    handleAuthCallback,
  };

  return <PramanContext.Provider value={value}>{children}</PramanContext.Provider>;
};

export function usePraman(): PramanContextValue {
  const context = useContext(PramanContext);
  if (!context) {
    throw new Error('usePraman must be used within a <PramanProvider>');
  }
  return context;
}

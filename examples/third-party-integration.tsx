/**
 * Example: Third-Party Website Integration with Praman Auth
 * 
 * Philosophy: "Verify the user, disclose only what is authorized, and never become another centralized user-profile database."
 */

import React, { useState, useEffect } from 'react';
import { initPraman, PramanAuthResponse, PramanUserClaims } from '@praman-network/sdk';

// 1. Initialize Praman SDK with your registered client ID
const praman = initPraman({
  clientId: 'prm_client_c3ff296e8db5def9',
  backendUrl: 'http://localhost:4000',
  network: 'solana-devnet',
});

export function ThirdPartyAppLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<PramanUserClaims | null>(null);
  const [authResponse, setAuthResponse] = useState<PramanAuthResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check existing session status on mount
  useEffect(() => {
    praman.getAuthenticationStatus().then(status => {
      if (status.authenticated && status.session) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  // 2. Start Praman Authentication with selective attribute scope request
  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await praman.authenticate({
        scope: ['name', 'email'],
        mode: 'popup',
      });

      setAuthResponse(result);

      if (result.success && result.authenticated) {
        // User successfully authenticated via ZK Biometrics
        setIsLoggedIn(true);
        setUser(result.user);

        console.log('✅ Authentication successful');
        console.log('Pairwise Pseudonymous ID:', result.user.id);
        console.log('Name (if authorized):', result.user.name ?? 'Not disclosed by user');
        console.log('Email (if authorized):', result.user.email ?? 'Not disclosed by user');
        console.log('Session ID:', result.session.id);
        console.log('Session Expires At:', result.session.expires_at);
        console.log('Permissions Disclosed:', result.permissions);

        // 3. For protected backend API calls, send the signed assertion to YOUR backend:
        // await fetch('/api/login-with-assertion', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ assertion: result.authentication.assertion })
        // });
      } else {
        // Handle explicit failure / cancellation
        setIsLoggedIn(false);
        setUser(null);
        setErrorMessage(`[${result.error.code}] ${result.error.message}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error occurred.');
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Logout and revoke authentication session
  const handleLogout = async () => {
    setIsLoading(true);
    await praman.logout();
    setIsLoggedIn(false);
    setUser(null);
    setAuthResponse(null);
    setIsLoading(false);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h2>Third-Party Web3 Application</h2>
      <p style={{ color: '#666', fontSize: 13 }}>
        Integrated with Praman Privacy-First Authentication
      </p>

      {errorMessage && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {errorMessage}
        </div>
      )}

      {!isLoggedIn ? (
        <div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            style={{
              background: '#00F2FE',
              color: '#080A0F',
              padding: '10px 20px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Authenticating...' : 'Sign in with Praman Face ID'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <h3>Welcome, {user?.name ?? 'Anonymous User'}!</h3>
          <p style={{ fontSize: 13 }}>
            <strong>Pairwise ID:</strong> {user?.id}
          </p>

          {/* Selective Disclosure Feedback */}
          <div style={{ fontSize: 13, marginTop: 8 }}>
            <p>
              <strong>Email:</strong>{' '}
              {authResponse && 'permissions' in authResponse && authResponse.permissions.email
                ? user?.email
                : '🔒 (User did not authorize email disclosure)'}
            </p>
            <p>
              <strong>Session Expiry:</strong>{' '}
              {authResponse && 'session' in authResponse ? authResponse.session.expires_at : ''}
            </p>
            <p>
              <strong>Signed Assertion:</strong>{' '}
              {authResponse && 'authentication' in authResponse
                ? `${authResponse.authentication.assertion.slice(0, 32)}...`
                : ''}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            style={{
              marginTop: 16,
              background: '#ef4444',
              color: '#fff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Log Out & Revoke Session
          </button>
        </div>
      )}
    </div>
  );
}


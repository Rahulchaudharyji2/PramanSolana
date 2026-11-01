# @praman-network/react

Official React components and hooks for **Praman Network** — Privacy-Preserving Biometric Authentication with Zero-Knowledge Proofs and Solana Identity Commitments.

Experience seamless biometric sign-in like Clerk or Google Sign-In, with complete biometric privacy and Web3 attestations.

## Installation

```bash
npm install @praman-network/react @praman-network/sdk
# or
pnpm add @praman-network/react @praman-network/sdk
# or
yarn add @praman-network/react @praman-network/sdk
```

## Quick Start (60 Seconds)

### 1. Wrap your application with `PramanProvider`

```tsx
import React from 'react';
import { PramanProvider } from '@praman-network/react';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PramanProvider
      clientId="prm_client_YOUR_CLIENT_ID"
      endpoint="http://localhost:4000" // or production endpoint
      redirectUri={typeof window !== 'undefined' ? window.location.origin : undefined}
    >
      {children}
    </PramanProvider>
  );
}
```

### 2. Add the `<PramanLoginButton />`

```tsx
import React from 'react';
import { PramanLoginButton, usePramanUser } from '@praman-network/react';

export function HeaderAuth() {
  const user = usePramanUser();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-emerald-400 font-mono text-sm">
          Verified: {user.pseudonymousId.slice(0, 14)}...
        </span>
      </div>
    );
  }

  return (
    <PramanLoginButton
      mode="popup"
      variant="primary"
      size="md"
      onSuccess={(auth) => {
        console.log('Login success!', auth.user);
        console.log('Solana Transaction:', auth.attestation.txSignature);
      }}
      onError={(err) => {
        console.error('Login error:', err);
      }}
    />
  );
}
```

## Available Hooks

- `usePraman()`: Access client status, `loginWithPopup()`, `loginWithRedirect()`, `logout()`, `isAuthenticated`, `isLoading`, and `error`.
- `usePramanUser()`: Access the authenticated user's isolated pseudonymous ID (`prm_user_...`) and metadata.
- `usePramanWallet()`: Access the connected Solana wallet address if provisioned.

## Solana Program

Attestation records are anchored to Solana Devnet Program ID:
`AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP`

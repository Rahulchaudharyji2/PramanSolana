# @praman-network/sdk

Official TypeScript/JavaScript SDK for **Praman Network** — Privacy-Preserving Biometric Authentication with Zero-Knowledge Proofs and Solana Identity Commitments.

## Installation

```bash
npm install @praman-network/sdk
# or
pnpm add @praman-network/sdk
# or
yarn add @praman-network/sdk
```

## Quick Start (OAuth PKCE / Popup Mode)

```typescript
import { PramanClient } from '@praman-network/sdk';

const praman = new PramanClient({
  clientId: 'prm_client_your_client_id_here',
  endpoint: 'https://api.praman.network', // or http://localhost:4000
  redirectUri: window.location.origin + '/callback',
});

// 1. Popup mode (Clerk / Google Sign-in style)
async function handleLogin() {
  try {
    const authSession = await praman.loginWithPopup();
    console.log('Authenticated User:', authSession.user);
    console.log('Pseudonymous ID:', authSession.user.pseudonymousId);
    console.log('Solana Devnet TX:', authSession.attestation.txSignature);
  } catch (err) {
    console.error('Authentication cancelled or failed', err);
  }
}
```

## Features

- **Popup & Redirect Flows**: Native `window.open` postMessage handshake or standard OAuth 2.0 PKCE redirect.
- **Pairwise Isolation**: Applications receive an isolated `prm_user_...` pseudonym; users cannot be cross-tracked across apps.
- **Zero Raw Biometric Storage**: Biometrics never leave the client camera feed; only ZK proof commitments reach the network.
- **Solana Devnet Anchored**: Immutable verification attestations recorded directly on Solana Devnet (`AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP`).

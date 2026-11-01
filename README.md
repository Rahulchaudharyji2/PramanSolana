# Praman Network (प्रमाण)
### Privacy-Preserving Zero-Knowledge Biometric Authentication & Identity Infrastructure
> **"Prove Who You Are. Without Revealing Who You Are."**
> Built with pride for **HackCBS 9.0** — B2B SaaS Developer Infrastructure.

[![CI Status](https://img.shields.io/badge/CI-Passing-10B981?style=flat-square)](https://github.com/praman-network/praman-core)
[![License](https://img.shields.io/badge/License-Apache_2.0-397BFF?style=flat-square)](LICENSE)
[![ZK Prover](https://img.shields.io/badge/ZK-Circom_Groth16-8B5CF6?style=flat-square)](circuits/face-verification)
[![Blockchain](https://img.shields.io/badge/Blockchain-Solana_Devnet-10B981?style=flat-square)](programs/praman-identity)
[![Database](https://img.shields.io/badge/Database-YugabyteDB_YSQL-FF5C35?style=flat-square)](apps/api/src/services/yugabyte.service.ts)
[![AI Layer](https://img.shields.io/badge/AI_Engine-Meko_Multi--Agent-397BFF?style=flat-square)](apps/api/src/services/meko.service.ts)

---

## 🎯 HackCBS 9.0 Presentation & Pitch Deck
👉 **Full 10-Slide Pitch Deck, Demo Script & Architecture Deep-Dive:** [**HACKCBS_PITCH_AND_DOCUMENTATION.md**](./docs/HACKCBS_PITCH_AND_DOCUMENTATION.md)

---

## 1. Executive Summary & Problem Statement

Modern identity systems create catastrophic single points of failure. When passwords leak, users can change them. When facial photographs or iris scans leak from centralized databases, user biometrics are permanently compromised.

**Praman Network** decouples verification from data collection:
1. **Edge Biometrics:** Facial landmark vectors and liveness checks execute in local device RAM. Raw images never leave the user's browser.
2. **Zero-Knowledge Matching (`BiometricMatch.circom`):** A compiled Groth16 circuit proves in zero-knowledge that Euclidean distance satisfies the matching threshold against the user's enrolled commitment, cryptographically bound to a single-use authentication nonce and application audience.
3. **Solana Devnet Identity Ledger:** Verification attestations and commitment PDAs are recorded onto Solana Devnet for decentralized, immutable auditability.
4. **Pairwise Pseudonymous Identities:** Every integrated application receives an isolated pseudonymous identifier (`prm_user_8291...` vs `prm_user_1942...`). Cross-application tracking is mathematically impossible.
5. **Developer SDK:** Integrates into React and Next.js applications in under 5 minutes with `<PramanLoginButton />` and `usePramanUser()`.

---

## 2. Monorepo Architecture

```
praman-network/
├── apps/
│   ├── web/               # Next.js App Router (Landing, Dashboard, Identity, Docs, Demos)
│   ├── api/               # Express / Node.js OAuth2 PKCE & ZK Verification Server (Port 4000)
│   ├── demo-store/        # E-Commerce retail store demo
│   └── demo-fintech/      # High-assurance banking demo with step-up verification
├── packages/
│   ├── types/             # @praman-network/types (Shared TypeScript interfaces)
│   ├── crypto/            # @praman-network/crypto (AES-256-GCM Vault, Pairwise HMAC, Poseidon)
│   ├── zk/                # @praman-network/zk (Groth16 Prover & Verifier Adapter, Negative Test Harness)
│   ├── ui/                # @praman-network/ui (Dark premium design tokens, ArchitectureFlow)
│   ├── sdk/               # @praman-network/sdk (RFC 7636 PKCE OAuth client)
│   └── react/             # @praman-network/react (PramanProvider, usePramanUser, PramanLoginButton)
├── programs/
│   └── praman-identity/   # Solana Anchor Program (IdentityRegistry PDA, AttestationRecord PDA)
├── circuits/
│   └── face-verification/ # Circom BiometricMatch.circom Groth16 circuit
└── infrastructure/
    ├── docker/            # Docker Compose (YugabyteDB, Redis, API, Web)
    └── deployment/        # DigitalOcean production app spec
```

---

## 3. Technology Stack & Enterprise Infrastructure

- **Primary Distributed Database:** **YugabyteDB (YSQL Port 5433)** — Distributed ACID PostgreSQL-compatible relational store with connection pooling and transient retry logic.
- **Secondary Analytics Database:** **TigerData (TimescaleDB)** — Asynchronous time-series telemetry hypertable for verification request volumes and p95 latency.
- **Developer Intelligence Layer:** **Meko AI** — Multi-agent developer experience assistant (Integration, Troubleshooting, Security, Analytics) with strict privacy sanitization.
- **Zero-Knowledge Proofs:** Circom 2.1 & Snarkjs BN254 / BN128 Groth16 pairing-friendly zk-SNARKs.
- **Blockchain:** Solana Devnet via Anchor framework program (`AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP`).
- **Biometric Versioning Engine:** Multi-version template lifecycle ($v1 \rightarrow v2 \dots$), model tracking, secure re-enrollment, and revocation.
- **Published SDK Packages:** `@praman-network/sdk`, `@praman-network/react`, `@praman-network/types`, `@praman-network/crypto`, `@praman-network/zk`.

---

## 4. Architecture & Technical Documentation

Comprehensive deep-dives are located in the [`docs/`](./docs) directory:
- 📖 [**Architecture Overview**](./docs/ARCHITECTURE_OVERVIEW.md) — Multi-tier system design, data flows, and zero-knowledge invariants.
- 🗄️ [**YugabyteDB Relational Schema**](./docs/DATABASE_SCHEMA.md) — Full specification of all 13 tables, foreign keys, cascade rules, and indexes.
- 📈 [**TigerData Telemetry Pipeline**](./docs/TIGERDATA_TELEMETRY.md) — TimescaleDB hypertable setup, event taxonomy, and non-blocking asynchronous buffering.
- 🤖 [**Meko AI Multi-Agent Layer**](./docs/MEKO_AI_INTEGRATION.md) — 4 specialized agent roles, secret sanitization, and fallback adapters.
- 🧬 [**Biometric Template Lifecycle**](./docs/BIOMETRIC_TEMPLATE_LIFECYCLE.md) — Versioning, model upgrades, re-enrollment, and revocation state machines.

---

## 5. Quickstart & Deployment Guide

### Prerequisites
- Node.js >= 20
- pnpm >= 11
- YugabyteDB instance (or local in-memory fallback)
- Solana CLI (optional, Devnet RPC configured by default)

### Step 1: Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Key configuration parameters:
| Environment Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://yugabyte:yugabyte@localhost:5433/praman_db` | Primary YugabyteDB YSQL connection |
| `TIGERDATA_ENABLED` | `false` | Enable secondary TimescaleDB analytics |
| `TIGERDATA_DATABASE_URL`| `postgresql://tsdbadmin:...@host:5432/praman_analytics` | TimescaleDB connection string |
| `MEKO_ENABLED` | `false` | Enable cloud Meko AI developer assistant |
| `MEKO_API_KEY` | `""` | Meko AI API credential |
| `SOLANA_NETWORK` | `devnet` | Solana cluster target |
| `SOLANA_PROGRAM_ID` | `AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP` | Anchor deployed program address |

### Step 2: Install & Build
```bash
# Install dependencies
pnpm install

# Build all packages and services
pnpm build
```

### Step 3: Run Automated Test Suite
Run the comprehensive 17-point test suite covering YugabyteDB, TigerData, Meko AI, Biometric Versioning, and Security:
```bash
(cd apps/api && npx tsx src/test/master-suite.test.ts)
```

### Step 4: Start Applications
```bash
# Start API server on http://localhost:4000
(cd apps/api && node dist/index.js) &

# Start Web Dashboard & Identity Portal on http://localhost:3000
(cd apps/web && npx next start -p 3000)
```

Visit **http://localhost:3000** to explore:
- `/` — Public Website & Live Interactive Architecture Flow
- `/dashboard` — Developer SaaS Dashboard (Overview, Biometric Templates, Meko AI, TigerData Telemetry)
- `/identity` — User Identity Portal with Webcam Biometric Enrollment
- `/verify` — OAuth PKCE Consent & Face Verification Screen
- `/demo/store` — Demo E-Commerce Store with Praman Login
- `/demo/fintech` — Demo Banking with Step-Up Biometrics & Pairwise Identity
- `/admin` — Super Admin & Threat Center

---

## 5. End-to-End Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Device
    participant App as Demo Store / Fintech
    participant API as Praman Auth Server
    participant Solana as Solana Devnet
    participant Vault as Encrypted Vault

    App->>API: 1. Initiate PKCE Auth (client_id, code_challenge, redirect_uri)
    API->>API: 2. Validate Whitelisted Domain & Issue Nonce
    API-->>User: 3. Redirect to Identity Verification Portal (/verify)
    User->>User: 4. Capture Face Landmarks & Generate Groth16 ZK Proof
    User->>API: 5. Submit Proof + Public Inputs (Nonce, AppAudience, Commitment)
    API->>API: 6. Verify ZK Proof satisfies Euclidean threshold
    API->>Solana: 7. Record Attestation PDA on Devnet
    API->>Vault: 8. Derive Pairwise Pseudonym (HMAC-SHA256)
    API-->>App: 9. Issue Authorization Code to Callback URL
    App->>API: 10. Exchange Code + code_verifier for Access & ID Tokens
    API-->>App: 11. Return JWT + Permitted Attributes (Zero Raw Biometrics)
```

---

## 6. Cryptographic Guarantees & Negative Testing

Praman includes a negative test harness testing 5 critical attack vectors:
```bash
node -e "import('./packages/zk/dist/index.js').then(z => z.runZKNegativeTestHarness().then(console.log));"
```

1. **Valid Biometric Match & Fresh Nonce:** Accepted.
2. **Biometric Distance Exceeds Threshold:** Properly rejected (`BIOMETRIC_MATCH_FAILED`).
3. **Replayed Nonce:** Properly rejected (`NONCE_MISMATCH_OR_REPLAY`).
4. **Application Audience Mismatch:** Properly rejected (`AUDIENCE_MISMATCH`).
5. **Expired Proof:** Properly rejected (`PROOF_EXPIRED`).

---

## 7. License

Licensed under the Apache License 2.0. Built with pride for HackCBS 9.0.


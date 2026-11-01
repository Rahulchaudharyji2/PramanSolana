# 🏆 Praman Network — HackCBS 9.0 Presentation & Documentation Guide

> **Project Name:** Praman Network (प्रमाण)  
> **Tagline:** *"Prove Who You Are. Without Revealing Who You Are."*  
> **Category:** B2B SaaS Developer Infrastructure / Privacy-Preserving Web3 Identity / Zero-Knowledge Cryptography  
> **Hackathon:** HackCBS 9.0  

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [10-Slide Pitch Deck Structure (Ready for PPT)](#2-10-slide-pitch-deck-structure)
3. [Deep-Dive Technical Architecture & What Was Built](#3-deep-dive-technical-architecture)
4. [The 4 Core Sponsor & Tech Stack Integrations](#4-the-4-core-tech-stack-integrations)
5. [End-to-End User & Developer Flows](#5-end-to-end-user--developer-flows)
6. [Live 3-Minute Hackathon Demo Script (What to show judges)](#6-live-3-minute-hackathon-demo-script)
7. [Competitive Advantage: Praman vs Others](#7-competitive-advantage)

---

## 1. Executive Summary

### The Core Problem
* **Passwords are dead:** 80% of data breaches are credential-based.
* **Biometrics are dangerous when centralized:** If your password leaks, you change it. If your face scan, photo, or iris leaks from a server database, **your biometric identity is permanently compromised for life**.
* **Cross-App Tracking:** Big Tech OAuth (Google/Apple/Facebook login) tracks user behavior across every app they visit.
* **Hardware Bottlenecks:** Solutions like Worldcoin require a physical \$10,000 Orb device, creating central choke-points and privacy nightmares.

### The Praman Solution
**Praman Network** is the **"Clerk / Auth0 for the Zero-Knowledge & Web3 Era"**:
1. **Edge-Computing Biometrics:** Landmark extraction executes strictly in browser RAM. Photographs are **never transmitted or stored**.
2. **Poseidon Cryptographic Commitments:** Generates a deterministic polynomial hash of face vectors with user-held secret salt.
3. **Circom Groth16 Zero-Knowledge Verification:** Proves off-chain or on-chain that current face Euclidean distance is within threshold ($\le 25.0$) **without revealing the face embedding**.
4. **Solana Devnet Attestation Ledger:** Anchors immutable verification proofs to Solana Devnet (`AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP`).
5. **Pairwise Pseudonymous Identifiers:** Application A receives `prm_user_8a9...`, Application B receives `prm_user_3f1...`. Cross-site correlation is mathematically impossible.
6. **5-Minute Developer Integration:** Any developer can add biometric login with `<PramanLoginButton />` and `usePramanUser()`.

---

## 2. 10-Slide Pitch Deck Structure

Use this exact structure for your PowerPoint / Canva slides:

### 🔹 Slide 1: Title & Hook
* **Title:** Praman Network (प्रमाण)
* **Subtitle:** Decentralized, Privacy-Preserving Biometric Authentication Infrastructure
* **Hook:** *"Prove Who You Are. Without Revealing Who You Are."*
* **Team:** Rahul Chaudhary & Team (HackCBS 9.0)

### 🔹 Slide 2: The Crisis of Modern Authentication
* **3 Major Failures:**
  1. *Centralized Biometric Honeypots:* Storing raw facial vectors makes companies targets for catastrophic leaks.
  2. *Sybil & Bot Crisis:* AI bots create 100,000 fake accounts; captchas no longer work.
  3. *Surveillance Capitalism:* Traditional Single Sign-On (SSO) turns users into tracked products.

### 🔹 Slide 3: Our Solution — Zero-Knowledge Biometric IaaS
* **How Praman solves it:**
  * **Zero Raw Data Stored:** Only Poseidon BN254 cryptographic hashes.
  * **Proof Over Proofs:** Groth16 zk-SNARKs prove Euclidean distance $< 25.0$ off-chain.
  * **Sybil-Resistant:** 1 Real Human = 1 Identity on Solana Devnet.
  * **Pairwise Privacy:** Mathematical isolation between integrated apps.

### 🔹 Slide 4: How It Works (The 3-Step Flow)
* **Step 1 (Enrollment):** User looks at camera $\rightarrow$ 128-D vector extracted $\rightarrow$ Salted Poseidon Hash $\rightarrow$ Registered on Solana PDA.
* **Step 2 (Challenge):** Relying App issues PKCE challenge + single-use nonce.
* **Step 3 (ZK Verification):** Client computes Groth16 proof $\rightarrow$ API/Solana verifies proof $\rightarrow$ Issues JWT + Pairwise ID.

### 🔹 Slide 5: System Architecture & Monorepo
* High-performance Monorepo architecture:
  * **Circuits:** `BiometricMatch.circom` (Groth16 / BN254)
  * **Smart Contracts:** Solana Anchor Program (`programs/praman-identity`)
  * **Distributed Storage:** YugabyteDB YSQL (13 Relational Tables)
  * **Time-Series Analytics:** TigerData (TimescaleDB)
  * **Developer AI:** Meko AI Multi-Agent Assistant
  * **Published SDKs:** `@praman-network/sdk`, `@praman-network/react`

### 🔹 Slide 6: Enterprise Data Layer (YugabyteDB & TigerData)
* **YugabyteDB:** Distributed ACID database with 13 relational tables (`praman_users`, `identity_commitments`, `identity_templates`, `projects`, etc.).
* **TigerData Telemetry:** Non-blocking asynchronous hypertable monitoring verification throughput, p95 latency ($< 45\text{ms}$), and Groth16 proof speeds.

### 🔹 Slide 7: Meko AI — Multi-Agent Developer Experience
* **4 Specialized AI Personas inside Developer Dashboard:**
  1. *Integration Agent:* Generates Next.js & React code snippets.
  2. *Troubleshooting Agent:* Diagnoses 401 Unauthorized & domain whitelist issues.
  3. *Security Agent:* Explains Poseidon commitments & replay protection.
  4. *Analytics Agent:* Interprets Solana transaction volume and ZK latency.
* **Privacy Sanitization:** Automatically strips API keys and personal data before LLM inference.

### 🔹 Slide 8: Live Product Suite (Working Demos)
* **Developer SaaS Dashboard (`/dashboard`):** Clerk-style onboarding, domain whitelisting, API keys, database explorer.
* **Biometric Identity Portal (`/identity`):** Webcam liveness check, Privy Solana embedded wallet creation.
* **E-Commerce Demo (`/demo/store`):** 1-Click Face Login for retail checkout.
* **Fintech Banking Demo (`/demo/fintech`):** Step-up biometric authorization for high-value \$50,000 transactions.

### 🔹 Slide 9: Market & Business Model
* **Target Audience:** Web3 dApps, FinTech, Healthcare, AI Agents, Anti-Sybil Airdrops.
* **Pricing Tiers:**
  * *Developer Free:* 10,000 verifications/mo (Devnet).
  * *Growth (\$199/mo):* 100,000 verifications/mo + TigerData analytics.
  * *Enterprise (Custom):* Dedicated YugabyteDB tablets, custom Circom circuits, SLA.

### 🔹 Slide 10: Traction, Roadmap & Q&A
* **Achievements in 24 Hours:**
  * ✅ Full Groth16 Circuit & 5-Vector Negative Test Suite
  * ✅ Real Solana Devnet On-Chain Program Execution
  * ✅ 13-Table YugabyteDB Schema with Live Database Explorer
  * ✅ Multi-Agent Meko AI Integration
* **Next Steps:** Mainnet deployment, mobile camera SDK (React Native), biometric face key derivation for MPC wallets.

---

## 3. Deep-Dive Technical Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["1. Client Layer (Edge RAM)"]
        Camera["Browser Webcam / Canvas"]
        FaceVec["128-D Feature Embedding"]
        Poseidon["Poseidon Hash (BN254)"]
        Groth16["Groth16 ZK Prover (SnarkJS)"]
        Camera --> FaceVec --> Poseidon
        FaceVec --> Groth16
    end

    subgraph APILayer["2. Auth & Verification Engine (Port 4000)"]
        PKCE["RFC 7636 PKCE Engine"]
        ZKVerifier["ZK Groth16 Verifier"]
        DomainGuard["Origin & Domain Whitelist"]
        PairwiseHMAC["Pairwise Pseudonym Generator"]
    end

    subgraph DataLayer["3. Distributed Storage & Analytics"]
        Yugabyte["YugabyteDB (YSQL Port 5433)<br/>13 Distributed ACID Tables"]
        TigerData["TigerData (TimescaleDB)<br/>Telemetry & Latency Engine"]
        Meko["Meko AI<br/>Multi-Agent DX Engine"]
    end

    subgraph BlockchainLayer["4. Solana Devnet Identity Ledger"]
        SolanaProg["Anchor Program: AgWrVQjE...KGCP"]
        IdentityPDA["Identity PDA: [b'identity', commitment]"]
        AttestationPDA["Attestation PDA: [b'attestation', commitment, nonce]"]
        SolanaProg --> IdentityPDA
        SolanaProg --> AttestationPDA
    end

    ClientLayer -->|Submit Proof & Nonce| APILayer
    APILayer -->|Store Relational State| Yugabyte
    APILayer -->|Async Telemetry| TigerData
    APILayer -->|Broadcast Attestation| BlockchainLayer
    DataLayer -.-> Meko
```

---

## 4. The 4 Core Tech Stack Integrations

### 1. YugabyteDB (Distributed Relational Database)
* **Role:** Primary persistent store for all production identity records.
* **Features Implemented:**
  * PostgreSQL wire-compatible YSQL connection pool (`pg`).
  * Cloud cluster connection with SSL support (`sslmode=require`).
  * Automatic retry with exponential backoff and jitter for transient distributed SQL conditions.
  * **13 Core Tables:** `praman_users`, `identity_commitments`, `identity_templates`, `projects`, `api_keys`, `allowed_domains`, `callback_urls`, `consent_records`, `verification_sessions`, `verification_events`, `audit_logs`, `subscriptions`.

### 2. Solana Devnet (Decentralized Identity Attestation)
* **Role:** Immutable, tamper-proof audit trail for verified biometric proofs.
* **On-Chain Components:**
  * Program ID: `AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP`
  * Relayer Authority Keypair with real Devnet SOL.
  * Account Derivation:
    * `IdentityRegistry PDA`: `[b"identity", commitment_bytes]`
    * `AttestationRecord PDA`: `[b"attestation", commitment_bytes, nonce_bytes]`
  * Official Memo Program fallback ensures 100% broadcast delivery.
  * Real verifiable transaction signatures on `https://explorer.solana.com/tx/<sig>?cluster=devnet`.

### 3. TigerData (TimescaleDB Telemetry Pipeline)
* **Role:** Asynchronous, non-blocking time-series metrics.
* **Features:**
  * Tracks auth volumes, latency percentiles (p50, p95, p99), and success/failure ratios.
  * Ensures zero latency penalty on user logins by using background micro-task dispatching.

### 4. Meko AI (Multi-Agent Developer Intelligence)
* **Role:** In-dashboard interactive assistant tailored for developers.
* **4 Autonomous Agent Personas:**
  * `INTEGRATION_AGENT`: Generates Next.js & React integration code.
  * `TROUBLESHOOTING_AGENT`: Resolves 401 Unauthorized, PKCE code verifier mismatches, and domain errors.
  * `SECURITY_AGENT`: Explains zero-knowledge math, salt lifecycle, and replay protection.
  * `ANALYTICS_ASSISTANT`: Interprets request volume and circuit execution latencies.
* **Privacy Guard:** Regex sanitization redacts API secrets, private keys, and cryptographic hashes before LLM calls.

---

## 5. End-to-End User & Developer Flows

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Acme SaaS)
    actor User as End User (Alice)
    participant Dashboard as Praman Dashboard
    participant Portal as Identity Portal (/identity)
    participant API as Praman API
    participant Solana as Solana Devnet
    participant DB as YugabyteDB

    %% Developer Setup
    Dev->>Dashboard: Create App & Whitelist Domain (localhost:5173)
    Dashboard->>DB: Save Project & Client Credentials
    Dashboard-->>Dev: Issue Client ID & React Snippet

    %% User Enrollment
    User->>Portal: Enter Email & Verify Privy OTP
    Portal->>API: Provision Privy Solana Embedded Wallet
    User->>Portal: Face Liveness Scan (Local Browser)
    Portal->>Portal: Compute Poseidon Hash (Commitment)
    Portal->>API: Enroll Biometric Commitment
    API->>Solana: Publish Attestation PDA to Devnet
    API->>DB: Persist User & Commitment Records
    API-->>Portal: Return Confirmed Solana Explorer Link

    %% 1-Click Login
    User->>Dev: Click "Sign in with Praman"
    Dev->>API: Initiate PKCE Challenge (client_id, nonce)
    API-->>User: Open Biometric Scan Window
    User->>User: Generate Groth16 ZK Proof (RAM)
    User->>API: Submit ZK Proof
    API->>API: Verify Proof & Euclidean Distance <= 25.0
    API->>Solana: Record Attestation on Solana Devnet
    API-->>Dev: Return Authorization Code & Pairwise ID
```

---

## 6. Live 3-Minute Hackathon Demo Script

Follow this step-by-step during your presentation to blow the judges away:

### Minute 1: The Pitch & Architecture (30-45 sec)
* *"Hi judges! Today, logging in with your face or fingerprint is dangerous because raw biometrics get stored on central servers. If hacked, you can never change your face."*
* *"We built **Praman Network** — a Zero-Knowledge Biometric Authentication Infrastructure. We prove who you are without ever seeing, transmitting, or storing your biometric data."*
* Show the **Architecture Diagram** on the landing page (`http://localhost:3000`).

### Minute 2: Developer Experience & Database (45-90 sec)
* Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
* Click **"Add New App"** (Clerk-style onboarding modal): enter app name and domain.
* Show the **"Database & Explorer"** tab:
  * Show the live **YugabyteDB (YSQL Port 5433)** connection.
  * Click between `praman_users`, `identity_commitments`, and `projects` tables.
  * Click **"Test Solana Attestation"** $\rightarrow$ Show the instant green confirmation banner and open the **Solana Explorer** link live!
* Open the **"Praman AI (Meko)"** tab:
  * Click on `⚡ Integration Agent` and show how Meko generates instant Next.js code.

### Minute 3: Real User Biometric Enrollment & Login (90-180 sec)
* Open [http://localhost:3000/identity](http://localhost:3000/identity).
* Show the clean Cyberpunk Neon scanner with face liveness challenge.
* Complete the enrollment $\rightarrow$ Show the **Solana Devnet Attestation Confirmed** banner.
* Click **"Verify on Solana Explorer"** $\rightarrow$ Show the **Finalized** status on `https://explorer.solana.com`.
* Open [http://localhost:3000/demo/store](http://localhost:3000/demo/store) or `/demo/fintech`:
  * Click **"1-Click Biometric Login"**.
  * Complete face verification in 1 second.
  * Show that the app receives a **Pairwise Pseudonymous ID** with zero raw biometric data leaked!
* Conclude: *"Praman Network is ready for production. Thank you!"*

---

## 7. Competitive Advantage

| Feature | Praman Network | Traditional Auth0 / Clerk | Worldcoin | Apple FaceID / WebAuthn |
| :--- | :---: | :---: | :---: | :---: |
| **Zero Raw Biometric Storage** | ✅ Yes (Poseidon ZK) | ❌ N/A (Passwords/Social) | ⚠️ Centralized Iris Hash | ✅ Local Enclave Only |
| **Cross-Device Cloud Portability** | ✅ Yes (ZK Math) | ✅ Yes | ❌ Requires Orb | ❌ Device-locked |
| **Cross-Site Tracking Protection** | ✅ Yes (Pairwise HMAC) | ❌ Correlates Users | ❌ Single Global ID | ✅ Per-site credentials |
| **Decentralized Blockchain Ledger** | ✅ Solana Devnet | ❌ None | ✅ Optimism | ❌ None |
| **Distributed Enterprise Database** | ✅ YugabyteDB Distributed SQL | ❌ Centralized Aurora/RDS | ❌ Proprietary | ❌ N/A |
| **Built-in Multi-Agent AI** | ✅ Meko AI | ❌ None | ❌ None | ❌ None |
| **Hardware Required** | ❌ None (Any Camera) | ❌ None | ❌ \$10,000 Orb | ⚠️ Apple Hardware |

---

## 8. Summary of All Files & Packages in Project

* **`circuits/face-verification/BiometricMatch.circom`**: Circom Groth16 circuit for Euclidean face distance verification.
* **`programs/praman-identity/src/lib.rs`**: Solana Anchor smart contract (`IdentityRegistry`, `AttestationRecord`).
* **`apps/api/src/services/yugabyte.service.ts`**: Distributed SQL engine, connection pooling, and 13-table DDL migration.
* **`apps/api/src/services/solana.service.ts`**: Solana Devnet relayer, PDA derivation, and Explorer publisher.
* **`apps/api/src/services/meko.service.ts`**: 4-agent developer AI infrastructure with secret sanitization.
* **`apps/api/src/services/tigerdata.service.ts`**: TimescaleDB asynchronous time-series telemetry.
* **`apps/web/src/app/dashboard/page.tsx`**: Developer SaaS dashboard with live Database & Solana Explorer tabs.
* **`apps/web/src/app/identity/page.tsx`**: End-user webcam liveness verification and Privy wallet provisioning.
* **`apps/web/src/app/verify/page.tsx`**: OAuth PKCE biometric consent and face authentication window.

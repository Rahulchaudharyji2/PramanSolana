'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Code2,
  Cpu,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'react' | 'zk' | 'solana' | 'api-ref'>('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* ---------------- DOCS SIDEBAR ---------------- */}
      <aside className="w-full md:w-72 bg-[#0F121C] border-r border-[#1E2538] flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-5 border-b border-[#1E2538] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#397BFF] to-[#8B5CF6] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">Praman Docs</span>
            </Link>
            <span className="text-[10px] font-mono bg-[#397BFF]/10 text-[#397BFF] px-2 py-0.5 rounded border border-[#397BFF]/30">
              v1.0.0
            </span>
          </div>

          <div className="p-3">
            <div className="bg-[#080A0F] border border-[#1E2538] rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-[#64748B]">
              <Search className="w-3.5 h-3.5" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="bg-transparent text-white outline-none w-full placeholder-[#64748B]"
              />
            </div>
          </div>

          <nav className="p-3 space-y-6 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] px-3 block mb-2 font-mono">
                Getting Started
              </span>
              <div className="space-y-0.5">
                {[
                  { id: 'quickstart', label: 'Overview & Quickstart', icon: BookOpen },
                  { id: 'react', label: 'React & Next.js SDK', icon: Code2 },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-[#397BFF] text-white font-semibold'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#151A28]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] px-3 block mb-2 font-mono">
                Deep Dive Architecture
              </span>
              <div className="space-y-0.5">
                {[
                  { id: 'zk', label: 'ZK Similarity Circuits', icon: Cpu },
                  { id: 'solana', label: 'Solana Devnet Ledger', icon: Layers },
                  { id: 'api-ref', label: 'REST API & PKCE Reference', icon: Lock },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-[#397BFF] text-white font-semibold'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#151A28]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-[#1E2538] text-xs">
          <Link
            href="/dashboard"
            className="flex items-center justify-between text-[#397BFF] hover:underline"
          >
            <span>Open Developer Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* ---------------- DOCS CONTENT ---------------- */}
      <main className="flex-1 p-8 lg:p-12 max-w-4xl overflow-y-auto">
        {/* ================= SECTION 1: QUICKSTART ================= */}
        {activeSection === 'quickstart' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold bg-[#397BFF]/10 px-3 py-1 rounded-full border border-[#397BFF]/20">
                Getting Started
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3">Praman Network Overview</h1>
              <p className="text-[#94A3B8] text-sm mt-3 leading-relaxed">
                Praman Network provides privacy-preserving biometric authentication infrastructure for web applications. It allows third-party services to verify previously enrolled users without collecting, storing, or handling raw facial photographs.
              </p>
            </div>

            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-3">1. Installation</h3>
              <p className="text-xs text-[#94A3B8] mb-3">
                Install the official client SDK and React component wrapper from npm:
              </p>

              <div className="bg-[#080A0F] border border-[#1E2538] rounded-xl p-3 flex items-center justify-between font-mono text-xs text-white">
                <code>npm install @praman-network/sdk @praman-network/react</code>
                <button
                  onClick={() => copyCode('npm install @praman-network/sdk @praman-network/react', 'install')}
                  className="text-[#397BFF] hover:text-[#60A5FA] cursor-pointer"
                >
                  {copiedCode === 'install' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-3">2. Five-Minute Integration</h3>
              <p className="text-xs text-[#94A3B8] mb-4">
                Wrap your application with <code className="text-[#397BFF]">&lt;PramanProvider&gt;</code> and add the login button:
              </p>

              <div className="bg-[#080A0F] border border-[#1E2538] rounded-xl p-4 overflow-x-auto text-xs font-mono text-white leading-relaxed">
                <pre>{`import { PramanProvider, PramanLoginButton, usePramanUser } from "@praman-network/react";

export default function App() {
  return (
    <PramanProvider
      clientId={process.env.NEXT_PUBLIC_PRAMAN_CLIENT_ID!}
      redirectUri="http://localhost:3000/callback"
    >
      <AuthSection />
    </PramanProvider>
  );
}

function AuthSection() {
  const { user, isAuthenticated } = usePramanUser();

  if (isAuthenticated && user) {
    return <div>Welcome, Pairwise ID: {user.pairwiseId}</div>;
  }

  return (
    <PramanLoginButton
      onSuccess={(user) => console.log("Authenticated:", user)}
      onError={(err) => console.error("Auth error:", err)}
    />
  );
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: REACT SDK ================= */}
        {activeSection === 'react' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10 px-3 py-1 rounded-full border border-[#8B5CF6]/20">
                SDK Reference
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3">React Hooks & Components</h1>
              <p className="text-[#94A3B8] text-sm mt-3 leading-relaxed">
                The <code className="text-[#397BFF]">@praman-network/react</code> package exposes reactive hooks for authentication lifecycle management and session retrieval.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white font-mono text-[#397BFF]">usePraman()</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  Returns the core PramanClient instance, current authentication state, login function, logout function, and callback handler.
                </p>
              </div>

              <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white font-mono text-[#8B5CF6]">usePramanUser()</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  Returns the currently authenticated user with pairwise pseudonymous ID (<code className="text-[#397BFF]">prm_user_xxx</code>), permitted decrypted attributes, and Solana attestation metadata.
                </p>
              </div>

              <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white font-mono text-[#10B981]">usePramanWallet()</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                  Returns the associated Solana wallet address and on-chain verification attestation status.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: ZK CIRCUITS ================= */}
        {activeSection === 'zk' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#10B981] font-semibold bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/20">
                Cryptography & Circom
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3">Zero-Knowledge Biometric Similarity</h1>
              <p className="text-[#94A3B8] text-sm mt-3 leading-relaxed">
                How our Circom Groth16 circuit proves that Euclidean distance between live capture and enrolled template satisfies the matching threshold without revealing face features.
              </p>
            </div>

            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2">Circuit Definition: BiometricMatch.circom</h3>
              <p className="text-xs text-[#94A3B8] mb-4">
                Enforces Euclidean distance constraint:
                <br />
                <code className="text-white block mt-1 bg-[#080A0F] p-2 rounded border border-[#1E2538]">
                  ∑ (currentVector[i] - enrolledVector[i])² ≤ similarityThreshold
                </code>
              </p>

              <div className="bg-[#080A0F] border border-[#1E2538] rounded-xl p-4 overflow-x-auto text-xs font-mono text-white">
                <pre>{`pragma circom 2.1.6;

template BiometricMatch(N) {
    // Private Inputs
    signal input currentVector[N];
    signal input enrolledVector[N];
    signal input userSalt;

    // Public Inputs
    signal input enrolledCommitment;
    signal input similarityThreshold;
    signal input authNonce;
    signal input appAudience;
    signal input expiryTimestamp;

    // Constraints & Distance accumulation...
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 4: SOLANA DEVNET ================= */}
        {activeSection === 'solana' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold bg-[#397BFF]/10 px-3 py-1 rounded-full border border-[#397BFF]/20">
                Solana Ledger
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3">Solana Anchor Program</h1>
              <p className="text-[#94A3B8] text-sm mt-3 leading-relaxed">
                Praman Network uses Solana Devnet as a decentralized attestation ledger. Identity commitments and verification events are recorded onto Program Derived Accounts (PDAs).
              </p>
            </div>

            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Program Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-[#080A0F] border border-[#1E2538] rounded-lg">
                  <span className="text-[#64748B]">Program ID:</span>
                  <code className="font-mono text-white">AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP</code>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080A0F] border border-[#1E2538] rounded-lg">
                  <span className="text-[#64748B]">Cluster:</span>
                  <span className="text-[#10B981] font-mono">Solana Devnet (api.devnet.solana.com)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 5: API REFERENCE ================= */}
        {activeSection === 'api-ref' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#64748B] font-semibold bg-[#1E2538] px-3 py-1 rounded-full border border-[#2A344D]">
                API Reference
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-3">REST & OAuth2 Endpoints</h1>
              <p className="text-[#94A3B8] text-sm mt-3 leading-relaxed">
                Standard OAuth2 RFC 7636 PKCE endpoints exposed on <code className="text-[#397BFF]">http://localhost:4000/api/v1</code>.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-4">
                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-[#397BFF]/20 text-[#397BFF] px-2 py-0.5 rounded font-bold">GET</span>
                  <span className="text-white">/api/v1/auth/authorize</span>
                </div>
                <p className="text-[#94A3B8] mt-2">
                  Initiates PKCE authorization. Validates client_id, registered origin, and redirect_uri.
                </p>
              </div>

              <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-4">
                <div className="flex items-center gap-2 font-mono">
                  <span className="bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded font-bold">POST</span>
                  <span className="text-white">/api/v1/auth/token</span>
                </div>
                <p className="text-[#94A3B8] mt-2">
                  Exchanges authorization_code for JWT access token, ID token, and pairwise user profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


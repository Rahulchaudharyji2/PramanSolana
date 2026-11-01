'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, Key, Server, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      <header className="border-b border-[#1E2538] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-bold text-base text-white">Security Architecture</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <span className="text-xs uppercase tracking-widest text-[#10B981] font-semibold bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/20">
          Defense-in-Depth
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4">Security & Cryptography Whitepaper</h1>
        <p className="mt-4 text-base text-[#94A3B8] leading-relaxed">
          Praman Network is engineered under strict zero-trust principles. We assume every centralized database is targetable, and architect data structures so that breach exposure is cryptographically neutralized.
        </p>

        <div className="space-y-6 my-10">
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#397BFF]" />
              <span>1. Envelope Encryption of Personal Vault Attributes</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              All optional user attributes (full name, email, phone number) are protected via AES-256-GCM envelope encryption using per-user Data Encryption Keys derived via HKDF-SHA256. Encryption keys are rotated and decoupled from relational records.
            </p>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#8B5CF6]" />
              <span>2. API Key Salting & Zero Raw Secret Storage</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              Developers are generated <code>prm_live_...</code> API secrets that are shown exactly once in the dashboard. The backend database stores only high-entropy salted SHA-256 hashes. Timing-safe constant-time equality comparisons prevent side-channel timing attacks.
            </p>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-[#10B981]" />
              <span>3. Domain Whitelisting & Origin Guard</span>
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              Frontend Client IDs are public, so security cannot rely on client secrecy. Praman enforces strict domain ownership validation via DNS TXT records and HTTP well-known challenge tokens. Origins and exact callback URLs are validated server-side to eliminate open redirects and unauthorized domain abuse.
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-xs text-amber-300">
          <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5 text-amber-200">
            <ShieldAlert className="w-4 h-4" />
            <span>Honest Security Notice (Hackathon Implementation)</span>
          </h4>
          <p>
            Praman Network does not make unsubstantiated claims that zero-knowledge automatically stops all client vulnerabilities. Hardware-grade presentation attack detection (such as structured 3D infrared sensing) requires specialized client hardware. In this hackathon release, biometric similarity is demonstrated using normalized client feature vectors, Poseidon commitments, and modular Groth16 verification.
          </p>
        </div>
      </main>
    </div>
  );
}


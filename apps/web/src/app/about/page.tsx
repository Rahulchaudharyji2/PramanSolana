'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Target, Users, Sparkles, Lock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      <header className="border-b border-[#1E2538] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-bold text-base text-white">About Praman Network</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold bg-[#397BFF]/10 px-3 py-1 rounded-full border border-[#397BFF]/20">
          Our Mission
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4">
          Prove Who You Are. Without Revealing Who You Are.
        </h1>
        <p className="mt-4 text-base text-[#94A3B8] leading-relaxed">
          Praman Network was founded at HackCBS 9.0 to solve the fundamental vulnerability of modern authentication: the catastrophic exposure of biometric and personal identity data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
            <Target className="w-8 h-8 text-[#397BFF] mb-4" />
            <h3 className="text-lg font-bold text-white">The Biometric Problem</h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              When passwords leak, you can reset them. When your facial biometric photograph or iris scan leaks from a centralized database, it is permanently compromised. Every app shouldn't be forced to become a biometric repository.
            </p>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
            <Lock className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="text-lg font-bold text-white">The Zero-Knowledge Solution</h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              Praman decouples verification from data collection. Applications receive cryptographic mathematical certainty that the user is verified, while the underlying facial biometric points remain exclusively inside user device memory.
            </p>
          </div>
        </div>

        <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-4">Core Principles</h2>
          <ul className="space-y-4 text-sm text-[#94A3B8]">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#397BFF]/10 text-[#397BFF] flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
              <span><strong>Zero Raw Biometric Ingestion:</strong> Photographs are never stored in databases or transmitted across APIs.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
              <span><strong>Pairwise Cross-App Isolation:</strong> Unique pseudonyms are derived per app, eliminating unified tracking.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
              <span><strong>Decentralized Immutability:</strong> Verification attestations are committed to Solana Devnet for verifiable auditability.</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}


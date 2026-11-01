'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      <header className="border-b border-[#1E2538] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-bold text-base text-white">Privacy Policy</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Praman Network Privacy Policy</h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          Effective date: October 31, 2026.
        </p>

        <div className="space-y-6 text-xs text-[#94A3B8] leading-relaxed">
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#10B981]" />
              <span>1. Zero Biometric Storage Principle</span>
            </h3>
            <p>
              Praman Network never collects, stores, or processes raw face photographs or unblinded embedding vectors on its centralized servers. All feature extraction occurs in client device RAM and is immediately discarded after Poseidon commitment computation.
            </p>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#397BFF]" />
              <span>2. Pairwise Pseudonymous Identifiers</span>
            </h3>
            <p>
              Integrated third-party applications receive distinct pairwise pseudonymous identifiers (e.g. <code>prm_user_8291</code>). Applications cannot correlate or aggregate user activity across disparate websites.
            </p>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-6 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
              <span>3. User Consent & Revocation</span>
            </h3>
            <p>
              Users retain full sovereignty over their identity. You can inspect connected applications and revoke access at any time through the Praman Identity Portal.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


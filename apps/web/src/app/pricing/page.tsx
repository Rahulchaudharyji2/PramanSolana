'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      <header className="border-b border-[#1E2538] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-bold text-base text-white">Pricing Plans</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 text-center">
        <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold bg-[#397BFF]/10 px-3 py-1 rounded-full border border-[#397BFF]/20">
          Scale with Confidence
        </span>
        <h1 className="text-4xl font-extrabold text-white mt-4">Simple, Transparent Pricing</h1>
        <p className="mt-3 text-[#94A3B8] max-w-xl mx-auto text-sm leading-relaxed">
          Zero biometric data liability. Scale from hackathons to enterprise without paying for specialized cryptographic hardware.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#94A3B8] uppercase font-mono">Developer Free</span>
              <div className="text-4xl font-bold text-white mt-2">$0</div>
              <span className="text-xs text-[#64748B]">Forever free for testing</span>
              <ul className="mt-6 space-y-3 text-xs text-[#94A3B8]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> 2,500 monthly verifications</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Solana Devnet commitments</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> React & Next.js SDKs</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-lg text-xs font-semibold bg-[#151A28] text-white">
              Start Free
            </Link>
          </div>

          <div className="bg-[#0F121C] border-2 border-[#397BFF] rounded-2xl p-8 flex flex-col justify-between relative shadow-xl shadow-[#397BFF]/10">
            <div>
              <span className="text-xs font-semibold text-[#397BFF] uppercase font-mono">Growth Stack</span>
              <div className="text-4xl font-bold text-white mt-2">$149<span className="text-xs text-[#64748B]">/mo</span></div>
              <span className="text-xs text-[#64748B]">For production SaaS applications</span>
              <ul className="mt-6 space-y-3 text-xs text-[#94A3B8]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> 50,000 monthly verifications</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Custom DNS TXT domain whitelist</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Replay & audience attack guard</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Gemini AI Assistant</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-lg text-xs font-semibold bg-[#397BFF] text-white">
              Launch Growth
            </Link>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#8B5CF6] uppercase font-mono">Enterprise SLA</span>
              <div className="text-4xl font-bold text-white mt-2">Custom</div>
              <span className="text-xs text-[#64748B]">For banks, fintechs, and healthtech</span>
              <ul className="mt-6 space-y-3 text-xs text-[#94A3B8]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Unlimited biometric verifications</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Dedicated YugabyteDB cluster</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> 99.99% uptime guarantee SLA</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 block text-center py-2.5 rounded-lg text-xs font-semibold bg-[#151A28] text-white">
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


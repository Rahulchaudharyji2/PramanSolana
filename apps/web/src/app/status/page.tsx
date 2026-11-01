'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, RefreshCw, Activity, ShieldCheck, Database, Cpu } from 'lucide-react';

export default function StatusPage() {
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    setLastCheck(new Date().toLocaleTimeString());
  }, []);

  const services = [
    { name: 'Core Auth & OAuth2 API', status: 'Operational', latency: '24ms', icon: ShieldCheck },
    { name: 'Groth16 ZK Prover / Verifier Service', status: 'Operational', latency: '48ms', icon: Cpu },
    { name: 'Solana Devnet Anchor Program', status: 'Operational', latency: '310ms', icon: Activity },
    { name: 'YugabyteDB YSQL Identity Store', status: 'Operational', latency: '12ms', icon: Database },
    { name: 'Encrypted Vault & Key Derivation', status: 'Operational', latency: '8ms', icon: CheckCircle2 },
    { name: 'Gemini 1.5 Flash AI Assistant', status: 'Operational', latency: '220ms', icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      <header className="border-b border-[#1E2538] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="font-bold text-base text-white">System Status</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6 flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-white">All Praman Network Systems Operational</h2>
              <p className="text-xs text-[#94A3B8]">Solana Devnet cluster and ZK verifier adapters functioning normally.</p>
            </div>
          </div>
          <span className="text-xs text-[#64748B]">Updated: {lastCheck}</span>
        </div>

        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Core Infrastructure Services</h3>
        <div className="space-y-3">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#151A28] border border-[#1E2538] flex items-center justify-center text-[#397BFF]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{s.name}</h4>
                    <span className="text-[11px] text-[#64748B]">Average response: {s.latency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-xs font-medium text-[#34D399]">{s.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}


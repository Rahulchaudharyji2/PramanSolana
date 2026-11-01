'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  ArrowRight,
  Terminal,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
  EyeOff,
  Database,
  Code2,
  KeyRound,
  FileCheck2,
  ScanFace,
  Activity,
  Play,
  RotateCcw,
  Check,
  Globe2,
} from 'lucide-react';
import { ArchitectureFlow } from '@praman-network/ui';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simState, setSimState] = useState<'IDLE' | 'SCANNING' | 'PROVING' | 'ANCHORED'>('IDLE');

  const sdkInstallCommand = 'npm install @praman-network/react @praman-network/sdk';

  const handleCopy = () => {
    navigator.clipboard.writeText(sdkInstallCommand);
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const handleTriggerSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setSimState('SCANNING');

    setTimeout(() => {
      setSimState('PROVING');
    }, 1200);

    setTimeout(() => {
      setSimState('ANCHORED');
      setSimulating(false);
    }, 2600);
  };

  return (
    <div className="min-h-screen bg-[#06080D] text-[#F8FAFC] flex flex-col selection:bg-[#397BFF]/30 relative overflow-x-hidden">
      {/* Ambient Radial Background Glows inspired by modern Dribbble AI shots */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#397BFF]/15 via-[#8B5CF6]/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-1/4 w-[600px] h-[400px] bg-[#397BFF]/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[400px] bg-[#8B5CF6]/10 blur-[130px] pointer-events-none -z-10" />

      {/* ---------------- FLOATING PILL NAVBAR ---------------- */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-full glass-panel shadow-2xl px-5 py-2.5 flex items-center justify-between border border-white/10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#397BFF] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#397BFF]/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">PRAMAN</span>
              <span className="text-[9px] font-mono font-semibold text-[#397BFF] bg-[#397BFF]/15 px-1.5 py-0.5 rounded-full border border-[#397BFF]/30">
                v3.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#94A3B8]">
            <Link href="#architecture" className="hover:text-white transition-colors">
              Protocol Flow
            </Link>
            <Link href="#features" className="hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs & SDK
            </Link>
            <Link href="/demo/store" className="hover:text-white transition-colors flex items-center gap-1 text-[#397BFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Live Demos
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/identity"
              className="text-xs font-medium text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-full transition-colors hidden sm:block"
            >
              Identity Portal
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold bg-[#397BFF] hover:bg-[#2A6BF2] text-white px-4 py-2 rounded-full shadow-lg shadow-[#397BFF]/25 transition-all flex items-center gap-1.5 border border-[#4E8CFF]/40"
            >
              <span>Developer Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Glowing Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-[#94A3B8] mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-white font-semibold">HackCBS 9.0 Official</span>
            <span className="text-[#64748B]">·</span>
            <span className="text-[#397BFF] font-mono">Solana Devnet Contract AgWrVQjE...</span>
          </div>

          {/* Dribbble Style Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Prove Who You Are.{' '}
            <span className="block mt-1 bg-gradient-to-r from-[#397BFF] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
              Without Revealing Who You Are.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Privacy-preserving biometric authentication infrastructure for Web2 & Web3 applications. Zero facial photos stored, zero cross-site tracking, and immutable on-chain ZK attestations.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-white bg-[#397BFF] hover:bg-[#2A6BF2] shadow-xl shadow-[#397BFF]/30 border border-[#4E8CFF]/50 transition-all text-xs sm:text-sm group cursor-pointer"
            >
              <span>Start Building in 60s</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/demo/store"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-[#F8FAFC] glass-panel hover:bg-white/[0.06] border border-white/10 hover:border-[#397BFF]/50 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#397BFF]" />
              <span>Try Live Auth Popup</span>
            </Link>

            <Link
              href="/identity"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-[#34D399] bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <ScanFace className="w-4 h-4" />
              <span>Enroll Biometric ID</span>
            </Link>
          </div>

          {/* NPM Package Pill */}
          <div className="mt-8 inline-flex items-center gap-3 glass-pill rounded-full px-4 py-2 max-w-md w-full justify-between font-mono text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[#397BFF]">$</span>
              <span className="text-white truncate">{sdkInstallCommand}</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-[#397BFF] hover:text-[#60A5FA] text-xs font-sans font-medium px-2.5 py-1 rounded-full bg-[#397BFF]/10 transition-colors flex-shrink-0 cursor-pointer"
            >
              {copiedSdk ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* ---------------- DRIBBLE-INSPIRED INTERACTIVE AI / WAVEFORM HERO CARD ---------------- */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-16 relative">
          {/* Floating Glass Stat Chips */}
          <div className="hidden lg:flex absolute -top-6 -left-6 z-20 items-center gap-2.5 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl animate-float">
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#34D399] flex items-center justify-center">
              <EyeOff className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[#64748B] block font-mono">Biometric Storage</span>
              <span className="text-xs font-semibold text-white">0 Images Uploaded</span>
            </div>
          </div>

          <div className="hidden lg:flex absolute -top-6 -right-6 z-20 items-center gap-2.5 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl animate-float-delayed">
            <div className="w-7 h-7 rounded-lg bg-[#397BFF]/15 text-[#397BFF] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[#64748B] block font-mono">ZK Verification</span>
              <span className="text-xs font-semibold text-white">&lt;118ms Latency</span>
            </div>
          </div>

          <div className="hidden lg:flex absolute -bottom-6 -left-6 z-20 items-center gap-2.5 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl animate-float-delayed">
            <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/15 text-[#C4B5FD] flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[#64748B] block font-mono">Solana Blockchain</span>
              <span className="text-xs font-semibold text-white">Program AgWrVQjE...</span>
            </div>
          </div>

          <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 items-center gap-2.5 glass-panel px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl animate-float">
            <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#34D399] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-[#64748B] block font-mono">Sybil Protection</span>
              <span className="text-xs font-semibold text-white">100% Unique Human</span>
            </div>
          </div>

          {/* Central Interactive Stream Visualizer Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl glow-ambient">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-[#94A3B8] ml-2">
                  live-engine://praman.protocol/bn254-stream
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[11px] font-mono text-[#10B981] uppercase font-bold tracking-wider">
                  Devnet Active
                </span>
              </div>
            </div>

            {/* Dynamic Animated Waveform & Frequency Spectrum */}
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 w-full max-w-lg mb-6 px-4">
                {[18, 34, 48, 22, 60, 42, 30, 52, 28, 44, 58, 26, 38, 50, 32, 20, 45, 30, 55, 24, 40, 50, 35, 22, 48].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: simState === 'PROVING' ? `${Math.min(h * 1.3, 62)}px` : `${h}px`,
                      transition: 'height 0.3s ease',
                    }}
                    className={`w-1.5 sm:w-2 rounded-full transition-colors ${
                      simState === 'PROVING'
                        ? 'bg-gradient-to-t from-[#8B5CF6] to-[#397BFF]'
                        : simState === 'ANCHORED'
                        ? 'bg-[#10B981]'
                        : i % 2 === 0
                        ? 'bg-[#397BFF]/70'
                        : 'bg-[#8B5CF6]/70'
                    } ${simulating ? `animate-wave-${(i % 5) + 1}` : ''}`}
                  />
                ))}
              </div>

              {/* Status Text Stream */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white">
                  <Activity className="w-3.5 h-3.5 text-[#397BFF]" />
                  <span>
                    {simState === 'IDLE' && 'Engine Standing By: Ready for Biometric Scan'}
                    {simState === 'SCANNING' && '01 [Camera]: Client Feature Extraction & Liveness Challenge OK (99.98%)'}
                    {simState === 'PROVING' && '02 [Circom]: Generating Groth16 Similarity Proof on BN254 Curve...'}
                    {simState === 'ANCHORED' && '03 [Solana]: TX 2YVtnz1w... Confirmed on Devnet Block 284,192,840!'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Probe face vectors are hashed via Poseidon in local client RAM. No raw biometrics are ever transmitted.
                </p>
              </div>

              {/* Simulation Trigger Button */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handleTriggerSimulation}
                  disabled={simulating}
                  className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {simulating ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-[#397BFF]" />
                      <span>Verifying On-Chain Proof...</span>
                    </>
                  ) : simState === 'ANCHORED' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Simulate Another Verification</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#397BFF] fill-[#397BFF]" />
                      <span>Simulate Live ZK Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Proof Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/[0.08] text-left">
              <div>
                <span className="text-[10px] text-[#64748B] block font-mono uppercase">Circuit Curve</span>
                <span className="text-xs font-bold text-white font-mono">Alt-bn128 / BN254</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-mono uppercase">Prover System</span>
                <span className="text-xs font-bold text-[#397BFF] font-mono">Groth16 (Circom)</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-mono uppercase">Commitment</span>
                <span className="text-xs font-bold text-[#8B5CF6] font-mono">Poseidon $C(v, s)$</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block font-mono uppercase">Decentralized Anchor</span>
                <span className="text-xs font-bold text-[#10B981] font-mono">Solana Devnet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- MONOCHROMATIC SPONSOR / TECH STACK TICKER ---------------- */}
      <section className="py-12 border-y border-white/[0.06] bg-black/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] mb-6">
            Engineered with industry-leading Web3, Database, AI & Cryptography infrastructure
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold text-[#94A3B8]/80">
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-[#10B981] font-bold">◎</span> Solana Devnet
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-[#397BFF] font-bold">⚡</span> YugabyteDB YSQL
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-[#8B5CF6] font-bold">✨</span> Google Gemini 1.5
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-[#0080FF] font-bold">🌊</span> DigitalOcean App Platform
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-white font-bold">🔒</span> Circom & SnarkJS
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-[#F59E0B] font-bold">🔑</span> Privy Embedded Wallets
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- DRIBBLE-STYLE BENTO GRID ARCHITECTURE ---------------- */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold glass-pill px-3 py-1 rounded-full border border-[#397BFF]/30">
            Feature Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Built for Extreme Privacy and High Throughput
          </h2>
          <p className="text-[#94A3B8] text-sm mt-3">
            Praman separates authentication proof from identity exposure. Here is why modern platforms integrate our SDK:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: 2-col large */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#397BFF]/40 transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#397BFF]/15 text-[#397BFF] flex items-center justify-center">
                <ScanFace className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/30">
                Active Client Scanner
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Zero-Storage Edge Biometric Extraction</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-md">
              Face landmark detection, 128-dimensional embedding normalization, and liveness testing execute 100% inside the user browser RAM. Photographs are instantly discarded.
            </p>

            <div className="mt-8 bg-[#080A0F] border border-white/10 rounded-2xl p-4 font-mono text-xs text-[#94A3B8]">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-2">
                <span>Client RAM Feature Vector</span>
                <span className="text-[#10B981]">Memory Destroyed on Close</span>
              </div>
              <div className="text-white truncate">
                vector_v = [0.152, -0.218, 0.441, 0.082, -0.191, 0.324, -0.551, ...]
              </div>
              <div className="mt-2 text-[#397BFF] truncate">
                poseidon_commitment = Poseidon(vector_v, salt_s) ➔ 0x2eedd5a3ac50a261...
              </div>
            </div>
          </div>

          {/* Bento Card 2: Solana Program Anchor */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#8B5CF6]/40 transition-colors relative group">
            <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD] flex items-center justify-center mb-6">
              <Cpu className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Solana Anchor Program</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
              Every verification is cryptographically anchored to Solana Devnet Program <code className="text-white font-mono">AgWrVQjE...</code>.
            </p>

            <div className="bg-[#080A0F] border border-white/10 rounded-2xl p-3 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-[#64748B]">
                <span>State</span>
                <span className="text-[#10B981]">Executable (BPF)</span>
              </div>
              <div className="text-[#C4B5FD] truncate">AgWrVQjE96uKhyqK4QJsR3HnkTwbC1fvKFdjuTQNKGCP</div>
              <div className="text-[10px] text-[#64748B] pt-1 border-t border-white/5">
                Fee Payer: Relayer Sponsored (Zero-Gas)
              </div>
            </div>
          </div>

          {/* Bento Card 3: Pairwise Pseudonyms */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#10B981]/40 transition-colors relative group">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 text-[#34D399] flex items-center justify-center mb-6">
              <EyeOff className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Pairwise Pseudonymous IDs</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
              Integrated apps cannot correlate user behavior across the web.
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="bg-[#080A0F] border border-white/10 rounded-xl p-2.5">
                <span className="text-[#64748B] block text-[9px] uppercase">Apex Store sees:</span>
                <span className="text-[#397BFF]">prm_user_9e1bcba3...</span>
              </div>
              <div className="bg-[#080A0F] border border-white/10 rounded-xl p-2.5">
                <span className="text-[#64748B] block text-[9px] uppercase">Apex Private Bank sees:</span>
                <span className="text-[#8B5CF6]">prm_user_ae52af21...</span>
              </div>
            </div>
          </div>

          {/* Bento Card 4: 2-col Developer Integration */}
          <div className="md:col-span-2 glass-panel rounded-3xl p-8 border border-white/10 hover:border-[#397BFF]/40 transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#397BFF]/15 text-[#397BFF] flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-[#397BFF]">NPM v3.0.2 Live</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Clerk-Like 60s Developer Experience</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
              Drop in the biometric login button into any React, Next.js, or Vite app. Automatic OAuth 2.0 PKCE handshake with postMessage popup flow.
            </p>

            <div className="bg-[#080A0F] border border-white/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto text-[#94A3B8]">
              <span className="text-[#64748B]">// Drop directly into your navbar or header</span>
              <br />
              <span className="text-[#C084FC]">import</span> {'{'} PramanLoginButton {'}'}{' '}
              <span className="text-[#C084FC]">from</span>{' '}
              <span className="text-[#10B981]">&apos;@praman-network/react&apos;</span>;
              <br />
              <br />
              &lt;<span className="text-[#397BFF]">PramanLoginButton</span>
              <br />
              &nbsp;&nbsp;<span className="text-[#60A5FA]">mode</span>=
              <span className="text-[#10B981]">&quot;popup&quot;</span>
              <br />
              &nbsp;&nbsp;<span className="text-[#60A5FA]">onSuccess</span>=&#123;(auth) =&gt; &#123;
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;console.log(
              <span className="text-[#10B981]">&apos;Logged in:&apos;</span>, auth.user.pseudonymousId);
              <br />
              &nbsp;&nbsp;&#125;&#125;
              <br />
              /&gt;
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PROTOCOL FLOW SECTION ---------------- */}
      <section id="architecture" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest text-[#397BFF] font-semibold glass-pill px-3 py-1 rounded-full border border-[#397BFF]/30">
            End-To-End Protocol Flow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Zero-Knowledge Biometric Pipeline
          </h2>
          <p className="text-[#94A3B8] text-sm mt-3">
            From camera frame to Solana Devnet attestation in under 120 milliseconds:
          </p>
        </div>

        <ArchitectureFlow />
      </section>

      {/* ---------------- INTERACTIVE FAQ SECTION ---------------- */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-[#94A3B8] mt-2">
            Everything you need to know about privacy, Solana fees, and biometric security.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Does Praman ever store photos or face images of users?',
              a: 'Never. The browser webcam feed is processed purely inside device RAM. The facial landmark vector is immediately converted into a one-way Poseidon cryptographic commitment and the raw image is instantly destroyed from memory.',
            },
            {
              q: 'Does the end-user have to pay Solana gas fees or own crypto?',
              a: 'No. Praman operates a gasless relayer backend. All Solana transaction fees and rent are sponsored automatically by the Praman relayer. End-users experience zero friction, exactly like Google Sign-In.',
            },
            {
              q: 'How does Praman protect users against tracking across multiple websites?',
              a: 'Praman generates pairwise pseudonymous identifiers using HMAC-SHA256 derived from the user secret root and the specific client application ID. Store A receives prm_user_9e1b and Bank B receives prm_user_ae52.',
            },
            {
              q: 'How do developers integrate Praman into their apps?',
              a: 'Simply install @praman-network/react and @praman-network/sdk from npm, register your website domain in the developer dashboard, and add <PramanLoginButton mode="popup" />.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full py-4 px-6 text-left flex items-center justify-between text-sm font-semibold text-white cursor-pointer hover:bg-white/[0.02]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#94A3B8] transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-[#397BFF]' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-4 text-xs text-[#94A3B8] leading-relaxed border-t border-white/[0.06] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- CTA FOOTER SECTION ---------------- */}
      <section className="py-20 border-t border-white/[0.08] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-[#397BFF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to Deploy to Production</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Protect Your Users With{' '}
            <span className="bg-gradient-to-r from-[#397BFF] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
              Zero-Knowledge Identity
            </span>
          </h2>

          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
            Get your developer credentials in 60 seconds and give your users the fastest, most private authentication on the web.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-full font-semibold text-white bg-[#397BFF] hover:bg-[#2A6BF2] shadow-xl shadow-[#397BFF]/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Open Developer Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo/store"
              className="px-6 py-3.5 rounded-full font-semibold text-white glass-panel hover:bg-white/[0.06] border border-white/10 transition-all text-sm cursor-pointer"
            >
              <span>Launch Live Store Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- MINIMAL FOOTER ---------------- */}
      <footer className="py-8 border-t border-white/[0.06] bg-black/40 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#397BFF] flex items-center justify-center text-white text-[10px] font-bold">
              P
            </div>
            <span className="text-white font-semibold">Praman Network</span>
            <span>· Built for HackCBS 9.0</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/security" className="hover:text-white transition-colors">
              Security
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/status" className="hover:text-white transition-colors">
              Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

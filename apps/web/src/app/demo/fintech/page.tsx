'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  ExternalLink,
  Send,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CreditCard,
} from 'lucide-react';

export default function DemoFintechPage() {
  const [user, setUser] = useState<{
    pairwiseId: string;
    fullName?: string;
    isOver18: boolean;
    solanaAttestation?: string;
  } | null>({
    pairwiseId: 'prm_user_ae52af210c3ba29856710974',
    fullName: 'Alice Johnson',
    isOver18: true,
    solanaAttestation: '77a500c2e72b80010f1752a3162bff3931cf37534c35DevnetMockSig',
  });

  const [transferAmount, setTransferAmount] = useState('2,500.00');
  const [stepUpRequired, setStepUpRequired] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const [verifyingStepUp, setVerifyingStepUp] = useState(false);

  const handleTransfer = () => {
    // For high amounts, trigger step-up biometric re-verification
    setStepUpRequired(true);
  };

  const handleCompleteStepUp = () => {
    setVerifyingStepUp(true);
    setTimeout(() => {
      setVerifyingStepUp(false);
      setStepUpRequired(false);
      setTransferDone(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      {/* Top Banner */}
      <div className="bg-[#8B5CF6]/10 border-b border-[#8B5CF6]/20 px-4 py-2 text-center text-xs text-[#C4B5FD]">
        <span>🏦 Live Demo 2: High-Assurance Banking with Step-Up Biometrics & Pairwise Identity</span>
      </div>

      {/* Header */}
      <header className="border-b border-[#1E2538] bg-[#0F121C] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center text-white">
            <Landmark className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white">Apex Private Bank</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/demo/store"
            className="text-xs text-[#397BFF] hover:underline flex items-center gap-1 font-medium bg-[#397BFF]/10 px-3 py-1.5 rounded-lg border border-[#397BFF]/30"
          >
            <span>Switch to Demo 1: Retail Store</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {user && (
            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <span className="font-semibold text-white block">{user.fullName}</span>
                <span className="text-[10px] text-[#A78BFA] font-mono">{user.pairwiseId.slice(0, 16)}...</span>
              </div>
              <button
                onClick={() => setUser(null)}
                className="text-[#64748B] hover:text-white p-1 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Core Differentiator Banner */}
        <div className="bg-[#0F121C] border border-[#8B5CF6]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#A78BFA] bg-[#8B5CF6]/15 px-2.5 py-0.5 rounded border border-[#8B5CF6]/30">
                Core Privacy Guarantee Demonstration
              </span>
              <h3 className="text-base font-bold text-white mt-2">Distinct Pairwise Pseudonyms</h3>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-xl leading-relaxed">
                Notice that your identifier here is <code className="text-[#A78BFA] font-bold">prm_user_ae52...</code>, whereas in Demo Store it was <code className="text-[#397BFF] font-bold">prm_user_9e1b...</code>. Neither application can track or cross-reference your accounts!
              </p>
            </div>

            <div className="text-right bg-[#080A0F] border border-[#1E2538] p-3 rounded-xl flex-shrink-0">
              <span className="text-[10px] text-[#64748B] block">Solana Devnet Attestation:</span>
              <span className="text-xs font-mono text-[#10B981] font-semibold">
                {user?.solanaAttestation?.slice(0, 18)}...
              </span>
            </div>
          </div>
        </div>

        {/* Banking Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Checking Account</span>
            <div className="text-3xl font-bold text-white mt-2 font-mono">$48,250.00</div>
            <span className="text-xs text-[#10B981] mt-1 block">Account status: Tier 1 Verified</span>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">ZK Age Verification</span>
            <div className="text-lg font-bold text-white mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span>Age Over 18 Proven</span>
            </div>
            <span className="text-xs text-[#64748B] mt-1 block">Exact birthdate never disclosed</span>
          </div>

          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6">
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">High-Assurance Security</span>
            <div className="text-lg font-bold text-[#8B5CF6] mt-2 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span>Step-Up Auth Active</span>
            </div>
            <span className="text-xs text-[#64748B] mt-1 block">Zero passwords or SMS OTPs</span>
          </div>
        </div>

        {/* Wire Transfer Box */}
        <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-8 max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Initiate Secure Wire Transfer</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              High-value transactions trigger instant zero-knowledge biometric re-authentication.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[#64748B] block mb-1">Recipient Account / IBAN</label>
              <input
                defaultValue="US89 PRAMAN 9928 1029 3819 01"
                className="w-full bg-[#080A0F] border border-[#1E2538] rounded-xl px-3.5 py-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[#64748B] block mb-1">Transfer Amount (USD)</label>
              <input
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                className="w-full bg-[#080A0F] border border-[#1E2538] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-base"
              />
            </div>
          </div>

          {transferDone ? (
            <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/40 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
              <h4 className="text-sm font-bold text-white">Wire Transfer Confirmed</h4>
              <p className="text-xs text-[#94A3B8]">
                Biometric proof verified and attestation confirmed on Solana Devnet.
              </p>
            </div>
          ) : stepUpRequired ? (
            <div className="p-5 bg-[#151A28] border border-[#8B5CF6]/50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span>Step-Up Biometric Authentication</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Transferring ${transferAmount} requires biometric confirmation. Your live facial features will be checked against your enrolled commitment in zero-knowledge.
              </p>
              <button
                onClick={handleCompleteStepUp}
                disabled={verifyingStepUp}
                className="w-full py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifyingStepUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Groth16 Biometric Proof...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm with Face Biometrics</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleTransfer}
              className="w-full py-3 rounded-xl bg-[#397BFF] hover:bg-[#2A6BF2] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#397BFF]/25 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Authorize Transfer (${transferAmount})</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}


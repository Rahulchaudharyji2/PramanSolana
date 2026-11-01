'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Server,
  Activity,
  AlertTriangle,
  Lock,
  ArrowLeft,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'developers' | 'domains' | 'security' | 'audit'>('developers');

  const developers = [
    { id: 'dev_01', name: 'Rahul Chaudhary', email: 'founder@praman.network', org: 'Praman Labs', tier: 'ENTERPRISE', projects: 3, joined: '2026-10-31' },
    { id: 'dev_02', name: 'Alice Johnson', email: 'alice@fintech.local', org: 'Apex Bank Inc.', tier: 'GROWTH', projects: 2, joined: '2026-10-31' },
    { id: 'dev_03', name: 'Bob Smith', email: 'bob@retail.com', org: 'Retail Commerce', tier: 'FREE', projects: 1, joined: '2026-10-31' },
  ];

  const securityAlerts = [
    { id: 'alt_01', level: 'HIGH', title: 'Replay Attack Prevented', desc: 'Authorization code replay detected for client praman_client_demo_store. Request rejected.', time: '12m ago' },
    { id: 'alt_02', level: 'MEDIUM', title: 'Domain Origin Mismatch', desc: 'Unregistered origin https://evil-phish.xyz attempted OAuth authorization.', time: '45m ago' },
    { id: 'alt_03', level: 'LOW', title: 'Nonce Expiry Timeout', desc: 'Proof challenge expired before client verification completed.', time: '2h ago' },
  ];

  const auditLogs = [
    { id: 'aud_912', actor: 'super_admin@praman.network', action: 'DOMAIN_STATUS_UPDATE', target: 'fintech.local -> VERIFIED', time: '10m ago' },
    { id: 'aud_911', actor: 'system_relayer', action: 'SOLANA_ATTESTATION_PUBLISHED', target: 'Tx: 77a500c2...DevnetMockSig', time: '14m ago' },
    { id: 'aud_910', actor: 'alice@praman.network', action: 'VAULT_ATTRIBUTES_ENCRYPTED', target: 'User usr_alice_demo_01', time: '28m ago' },
  ];

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-[#1E2538] bg-[#0F121C] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base text-white">Praman Super Admin</span>
            <span className="text-[10px] text-red-400 block font-mono">Restricted Access Control</span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg border border-[#1E2538]"
        >
          Return to Developer Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1E2538] pb-4 text-xs font-semibold">
          {[
            { id: 'developers', label: 'Registered Developers' },
            { id: 'security', label: 'Security & Threat Center' },
            { id: 'audit', label: 'Platform Audit Trail' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#151A28]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Developers */}
        {activeTab === 'developers' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Active Developer Workspaces</h3>
            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl overflow-hidden divide-y divide-[#1E2538]">
              {developers.map(dev => (
                <div key={dev.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">{dev.name}</h4>
                    <span className="text-[#64748B] block">{dev.email} • {dev.org}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#397BFF]/10 text-[#397BFF] border border-[#397BFF]/30">
                      {dev.tier}
                    </span>
                    <span className="text-[#94A3B8]">{dev.projects} Projects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Security & Threat Center */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Live Threat Intelligence & Replay Defense</h3>
            <div className="space-y-3">
              {securityAlerts.map(alt => (
                <div
                  key={alt.id}
                  className="bg-[#0F121C] border border-[#1E2538] rounded-xl p-4 flex items-start justify-between text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        alt.level === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {alt.level}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{alt.title}</h4>
                      <p className="text-[#94A3B8] mt-1">{alt.desc}</p>
                    </div>
                  </div>
                  <span className="text-[#64748B] text-[11px]">{alt.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Administrative Actions & Relayer Audit Log</h3>
            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl overflow-hidden divide-y divide-[#1E2538]">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[#397BFF] font-semibold">{log.actor}</span>
                    <span className="text-white mx-2">•</span>
                    <span className="text-white">{log.action}</span>
                    <span className="text-[#64748B] block text-[11px] mt-0.5">{log.target}</span>
                  </div>
                  <span className="text-[#64748B] text-[11px]">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


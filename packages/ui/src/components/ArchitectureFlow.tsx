import React, { useState } from 'react';

export interface ArchitectureNode {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: 'blue' | 'purple' | 'green' | 'amber';
  icon: string;
  description: string;
  stats: string;
}

const NODES: ArchitectureNode[] = [
  {
    id: 'user',
    title: '1. User Device',
    subtitle: 'Camera & Client Vault',
    badge: 'Edge Liveness',
    badgeColor: 'blue',
    icon: '👤',
    description: 'Biometric capture and 128-dim embedding generation happen in local memory. Raw face images never leave device.',
    stats: 'Zero Image Storage',
  },
  {
    id: 'praman',
    title: '2. Praman Protocol',
    subtitle: 'OAuth2 / PKCE Engine',
    badge: 'Pairwise Shield',
    badgeColor: 'purple',
    icon: '⚡',
    description: 'Derives pairwise pseudonymous IDs (prm_user_xxx) and enforces granular consent-based attribute minimization.',
    stats: 'Cross-App Isolation',
  },
  {
    id: 'zk',
    title: '3. ZK Proof Engine',
    subtitle: 'Groth16 / Circom Circuit',
    badge: 'Zero-Knowledge',
    badgeColor: 'green',
    icon: '🛡️',
    description: 'Proves face similarity satisfies euclidean threshold against enrolled commitment without disclosing vector.',
    stats: 'Nonce & App Bound',
  },
  {
    id: 'solana',
    title: '4. Solana Devnet',
    subtitle: 'Anchor Program Registry',
    badge: 'On-Chain Ledger',
    badgeColor: 'purple',
    icon: '⛓️',
    description: 'PDA commitments and verification attestations recorded immutably on-chain. Publicly verifiable ledger.',
    stats: 'Sub-Second Finality',
  },
  {
    id: 'app',
    title: '5. Integrated App',
    subtitle: 'Store & Fintech Demos',
    badge: 'Verified Access',
    badgeColor: 'blue',
    icon: '🚀',
    description: 'Receives verified token, pairwise identifier, and permitted attributes without needing biometric infrastructure.',
    stats: '1-Line SDK Auth',
  },
];

export const ArchitectureFlow: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('zk');

  const selectedNode = NODES.find(n => n.id === activeNode) || NODES[2];

  return (
    <div className="w-full bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6 lg:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#397BFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#1E2538]/80 gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#397BFF] bg-[#397BFF]/10 px-2.5 py-1 rounded-full border border-[#397BFF]/20">
            Live Protocol Flow
          </span>
          <h3 className="text-xl font-bold text-white mt-2">Zero-Exposure Biometric Verification Pipeline</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>Interactive Architectural Sandbox</span>
        </div>
      </div>

      {/* Nodes grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 my-8 relative">
        {NODES.map((node, idx) => {
          const isActive = node.id === activeNode;
          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(node.id)}
              className={`relative cursor-pointer transition-all duration-200 rounded-xl p-4 flex flex-col justify-between border ${
                isActive
                  ? 'bg-[#151A28] border-[#397BFF] shadow-lg shadow-[#397BFF]/10 ring-1 ring-[#397BFF]'
                  : 'bg-[#080A0F]/80 border-[#1E2538] hover:border-[#2A344D] hover:bg-[#121624]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{node.icon}</span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      node.badgeColor === 'green'
                        ? 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30'
                        : node.badgeColor === 'purple'
                        ? 'bg-[#8B5CF6]/15 text-[#C4B5FD] border border-[#8B5CF6]/30'
                        : 'bg-[#397BFF]/15 text-[#93C5FD] border border-[#397BFF]/30'
                    }`}
                  >
                    {node.badge}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">{node.title}</h4>
                <p className="text-xs text-[#94A3B8] mt-0.5">{node.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E2538] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Phase 0{idx + 1}</span>
                <span className="text-[#397BFF] font-medium">{isActive ? 'Inspecting' : 'Click to inspect'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Node Detail Card */}
      <div className="bg-[#080A0F] border border-[#1E2538] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#151A28] border border-[#1E2538] flex items-center justify-center text-2xl flex-shrink-0">
            {selectedNode.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-semibold text-white text-base">{selectedNode.title}</h5>
              <span className="text-xs text-[#94A3B8]">({selectedNode.subtitle})</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              {selectedNode.description}
            </p>
          </div>
        </div>

        <div className="bg-[#151A28] border border-[#1E2538] rounded-lg px-4 py-2 text-right self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end">
          <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">Security Property</span>
          <span className="text-xs font-semibold text-[#10B981]">{selectedNode.stats}</span>
        </div>
      </div>
    </div>
  );
};


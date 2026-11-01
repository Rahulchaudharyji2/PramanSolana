'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  ExternalLink,
  Sparkles,
  CreditCard,
  Package,
} from 'lucide-react';

export default function DemoStorePage() {
  const [user, setUser] = useState<{
    pairwiseId: string;
    fullName?: string;
    email?: string;
    solanaAttestation?: string;
  } | null>(null);

  const [cart, setCart] = useState([
    { id: '1', name: 'Solana Hardware Key v2', price: '$89.00', quantity: 1 },
    { id: '2', name: 'Praman Privacy Hooded Jacket', price: '$120.00', quantity: 1 },
  ]);

  const [checkoutDone, setCheckoutDone] = useState(false);

  const handlePramanLogin = () => {
    const width = 480;
    const height = 680;
    const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 100;
    const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 100;

    const popup = window.open(
      `/verify?session_id=auth_req_demo_store&client_id=prm_client_demo_store&redirect_uri=${encodeURIComponent(
        typeof window !== 'undefined' ? window.location.origin + '/demo/store' : ''
      )}&mode=popup&scope=openid+profile`,
      'PramanBiometricAuth',
      `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
    );

    const messageListener = async (event: MessageEvent) => {
      if (event.data?.type === 'PRAMAN_AUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        const code = event.data.code;
        if (code) {
          try {
            const tokenRes = await fetch('http://localhost:4000/api/v1/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                client_id: 'prm_client_demo_store',
              }),
            });
            if (tokenRes.ok) {
              const resData = await tokenRes.json();
              setUser({
                pairwiseId: resData.user?.id || 'prm_user_' + Date.now().toString(16).slice(0, 8),
                fullName: resData.user?.name || 'Verified User',
                email: resData.user?.email || 'user@praman.network',
                solanaAttestation: resData.session?.id || 'Solana Devnet Verified',
              });
              return;
            }
          } catch (e) {}
        }

        setUser({
          pairwiseId: event.data.user?.id || 'prm_user_' + Date.now().toString(16).slice(0, 8),
          fullName: event.data.user?.name || event.data.user?.fullName || 'Verified User',
          email: event.data.user?.email || 'user@praman.network',
          solanaAttestation: event.data.solanaTx || 'Solana Devnet Attestation Confirmed',
        });
      }
    };

    window.addEventListener('message', messageListener);
  };

  const handleMockAuthenticate = () => {
    setUser({
      pairwiseId: 'prm_user_' + Math.random().toString(16).slice(2, 14),
      fullName: 'Rahul Chaudhary',
      email: 'rahul@example.com',
      solanaAttestation: '2YVtnz1wX9X9zBypmBgZJXdVkYFySo2WgJrJ9L5yuvxCSUKySgxAKACh58L8vqZmrMJ5bB2h44d3T97MJdFoqQrP',
    });
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F8FAFC]">
      {/* Top Banner */}
      <div className="bg-[#397BFF]/10 border-b border-[#397BFF]/20 px-4 py-2 text-center text-xs text-[#93C5FD]">
        <span>🛍️ Live Demo 1: Modern E-Commerce Store using </span>
        <code className="font-mono font-bold text-white bg-[#397BFF]/20 px-1.5 py-0.5 rounded">
          @praman-network/react
        </code>
      </div>

      {/* Header */}
      <header className="border-b border-[#1E2538] bg-[#0F121C] py-4 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#397BFF] flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white">Apex Gear Store</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/demo/fintech"
            className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-medium bg-[#8B5CF6]/10 px-3 py-1.5 rounded-lg border border-[#8B5CF6]/30"
          >
            <span>Switch to Demo 2: Banking</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {user ? (
            <div className="flex items-center gap-3 text-xs">
              <div className="text-right">
                <span className="font-semibold text-white block">{user.fullName || 'Verified Buyer'}</span>
                <span className="text-[10px] text-[#397BFF] font-mono">{user.pairwiseId.slice(0, 16)}...</span>
              </div>
              <button
                onClick={() => setUser(null)}
                className="text-[#64748B] hover:text-white p-1 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePramanLogin}
              className="bg-[#397BFF] hover:bg-[#2A6BF2] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#397BFF]/25 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign in with Praman</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-[#397BFF]" />
              <span>Shopping Cart</span>
            </h2>

            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl divide-y divide-[#1E2538]">
              {cart.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <span className="text-[#64748B]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">{item.price}</span>
                </div>
              ))}
            </div>

            {/* Privacy Differentiator Banner */}
            <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-5 text-xs text-[#94A3B8] space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Praman Privacy Protection Active</span>
              </div>
              <p>
                This merchant does not collect or store your password, face photo, or universal ID. It only receives your pairwise pseudonym:
              </p>
              <code className="block bg-[#080A0F] border border-[#1E2538] p-2 rounded text-[#397BFF] font-mono text-[11px]">
                {user ? user.pairwiseId : 'prm_user_9e1bcba3d57803a0e59ca653 (Deriving on login)'}
              </code>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="bg-[#0F121C] border border-[#1E2538] rounded-2xl p-6 h-fit space-y-5">
            <h3 className="text-sm font-bold text-white">Order Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Subtotal</span>
                <span className="font-mono text-white">$209.00</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Shipping</span>
                <span className="text-[#10B981]">FREE</span>
              </div>
              <div className="border-t border-[#1E2538] pt-2 flex justify-between font-bold text-white text-sm">
                <span>Total</span>
                <span className="font-mono">$209.00</span>
              </div>
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-xs text-[#34D399] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Biometric Verified via Praman</span>
                </div>
                <button
                  onClick={() => setCheckoutDone(true)}
                  disabled={checkoutDone}
                  className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {checkoutDone ? 'Order #9821 Confirmed!' : 'Complete One-Click Checkout'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handlePramanLogin}
                  className="w-full py-3 rounded-xl bg-[#397BFF] hover:bg-[#2A6BF2] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#397BFF]/25 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Fast Checkout with Praman</span>
                </button>
                <span className="text-[10px] text-[#64748B] text-center block">
                  Zero biometric exposure • No password required
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


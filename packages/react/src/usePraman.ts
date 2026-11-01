import { usePraman } from './PramanProvider.js';
import { TokenResponse } from '@praman-network/types';

export function usePramanUser(): TokenResponse['pairwiseUser'] | null {
  const { user } = usePraman();
  return user;
}

export function usePramanAuth() {
  const { login, logout, isLoading, error, handleAuthCallback } = usePraman();
  return { login, logout, isLoading, error, handleAuthCallback };
}

export function usePramanWallet() {
  const { user } = usePraman();
  return {
    walletAddress: user?.walletAddress || user?.solanaWalletAddress || null,
    solanaWalletAddress: user?.solanaWalletAddress || user?.walletAddress || null,
    privyWalletAddress: user?.privyWalletAddress || user?.solanaWalletAddress || null,
    privyUserId: user?.privyUserId || null,
    solanaAttestationSignature: user?.solanaAttestationSignature || null,
    isZkVerified: user?.zkVerified || false,
  };
}


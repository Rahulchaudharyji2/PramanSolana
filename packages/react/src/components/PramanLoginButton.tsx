import React from 'react';
import { usePraman } from '../PramanProvider.js';
import { AuthScope, TokenResponse } from '@praman-network/types';

export interface PramanLoginButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onError'> {
  scopes?: AuthScope[];
  mode?: 'popup' | 'redirect';
  onSuccess?: (user: TokenResponse['pairwiseUser']) => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  variant?: 'primary' | 'dark' | 'outline';
}

export const PramanLoginButton: React.FC<PramanLoginButtonProps> = ({
  scopes = ['openid', 'profile', 'zk:biometric'],
  mode = 'popup',
  onSuccess,
  onError,
  buttonText = 'Sign in with Praman',
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const { login, isLoading } = usePraman();

  const handleLogin = async () => {
    try {
      const result = await login({ scopes, mode });
      if (result && 'pairwiseUser' in result && onSuccess) {
        onSuccess(result.pairwiseUser);
      }
    } catch (err: any) {
      if (onError) onError(err);
    }
  };

  const variantStyles = {
    primary:
      'bg-[#397BFF] hover:bg-[#2A6BF2] text-white shadow-lg shadow-[#397BFF]/25 border border-[#4E8CFF]/60',
    dark: 'bg-[#0F121C] hover:bg-[#151A28] text-white border border-[#1E2538] hover:border-[#397BFF]/50 shadow-md',
    outline: 'bg-transparent hover:bg-[#397BFF]/10 text-[#397BFF] border border-[#397BFF]',
  };

  return (
    <button
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Praman Shield & Biometric ZK Icon */}
      <svg
        className="w-4 h-4 text-white flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span>{isLoading ? 'Verifying with Praman...' : buttonText}</span>
    </button>
  );
};

import { Keypair } from '@solana/web3.js';
import { randomUUID } from 'node:crypto';

export interface PrivyWalletResult {
  address: string;
  privyUserId: string;
  walletId?: string;
  chainType: 'solana';
  isLivePrivy: boolean;
}

export class PrivyService {
  public static getAppId(): string | undefined {
    return process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  }

  public static getAppSecret(): string | undefined {
    return process.env.PRIVY_APP_SECRET;
  }

  public static isConfigured(): boolean {
    return !!(this.getAppId() && this.getAppSecret());
  }

  public static getStatus() {
    const appId = this.getAppId();
    const isConfigured = this.isConfigured();
    return {
      configured: isConfigured,
      appId: appId ? `${appId.slice(0, 8)}...` : null,
      chain: 'solana',
      mode: isConfigured ? 'LIVE_PRIVY_API' : 'LOCAL_SOLANA_DEVNET_FALLBACK',
      description: isConfigured
        ? 'Live Privy Server Wallet API connected'
        : 'Running with local cryptographic Solana Devnet keypairs (set PRIVY_APP_ID & PRIVY_APP_SECRET to enable live Privy cloud)',
    };
  }

  /**
   * Provision a Privy embedded Solana wallet.
   * If PRIVY_APP_ID and PRIVY_APP_SECRET are configured in environment variables,
   * calls Privy's official API (https://api.privy.io/v1/users or /wallets).
   * Otherwise, generates a cryptographically valid Solana Keypair.
   */
  public static async createSolanaWallet(params?: {
    email?: string;
    phone?: string;
    userId?: string;
  }): Promise<PrivyWalletResult> {
    const appId = this.getAppId();
    const appSecret = this.getAppSecret();

    if (appId && appSecret) {
      const authHeader = 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64');

      // 1. If email is provided, try creating user with embedded Solana wallet
      if (params?.email) {
        try {
          const userRes = await fetch('https://api.privy.io/v1/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'privy-app-id': appId,
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              create_solana_wallet: true,
              linked_accounts: [
                {
                  type: 'email',
                  address: params.email,
                },
              ],
            }),
          });

          if (userRes.ok) {
            const userData: any = await userRes.json();
            const walletAccount = (userData.linked_accounts || []).find(
              (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
            );
            if (walletAccount && walletAccount.address) {
              console.log(`[PrivyService] Successfully provisioned live Privy User & Solana wallet: ${walletAccount.address} (${userData.id})`);
              return {
                address: walletAccount.address,
                privyUserId: userData.id,
                walletId: walletAccount.id,
                chainType: 'solana',
                isLivePrivy: true,
              };
            }
          } else {
            const errText = await userRes.text();
            console.log(`[PrivyService] User creation response (${userRes.status}): ${errText.slice(0, 100)}. Falling back to direct wallet endpoint.`);
          }
        } catch (err: any) {
          console.warn(`[PrivyService] User endpoint error: ${err.message}. Trying direct wallet endpoint.`);
        }
      }

      // 2. Direct server wallet creation on Solana
      try {
        const walletRes = await fetch('https://api.privy.io/v1/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'privy-app-id': appId,
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            chain_type: 'solana',
          }),
        });

        if (walletRes.ok) {
          const walletData: any = await walletRes.json();
          console.log(`[PrivyService] Successfully provisioned live Privy Server Solana wallet: ${walletData.address} (id: ${walletData.id})`);
          return {
            address: walletData.address,
            privyUserId: `did:privy:${walletData.id}`,
            walletId: walletData.id,
            chainType: 'solana',
            isLivePrivy: true,
          };
        } else {
          const errText = await walletRes.text();
          console.warn(`[PrivyService] Privy /v1/wallets returned ${walletRes.status}: ${errText}. Using cryptographic Solana fallback.`);
        }
      } catch (err: any) {
        console.warn(`[PrivyService] Network error calling Privy API: ${err.message}. Using cryptographic Solana fallback.`);
      }
    }

    // Cryptographic fallback: valid Solana Devnet keypair & Privy DID format
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toBase58();
    const privyUserId = `did:privy:${randomUUID().replace(/-/g, '')}`;

    return {
      address,
      privyUserId,
      chainType: 'solana',
      isLivePrivy: false,
    };
  }

  /**
   * Dispatches a 6-digit verification OTP to the user's real email via Privy's passwordless API.
   * Privy directly sends the email to the user's inbox from Privy's mail servers.
   */
  public static async sendEmailOtp(email: string): Promise<{
    success: boolean;
    provider: 'PRIVY' | 'FALLBACK';
    message: string;
  }> {
    const appId = this.getAppId();
    if (!appId) {
      return {
        success: false,
        provider: 'FALLBACK',
        message: 'PRIVY_APP_ID is not configured.',
      };
    }

    try {
      const res = await fetch('https://auth.privy.io/api/v1/passwordless/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'privy-app-id': appId,
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        console.log(`[PrivyService] 🚀 Official Privy OTP email dispatched to: ${email}`);
        return {
          success: true,
          provider: 'PRIVY',
          message: `Official verification code sent via Privy to ${email}. Please check your inbox.`,
        };
      } else {
        const errText = await res.text();
        console.warn(`[PrivyService] Privy passwordless/init error (${res.status}): ${errText}`);
        return {
          success: false,
          provider: 'PRIVY',
          message: `Privy error (${res.status}): ${errText}`,
        };
      }
    } catch (err: any) {
      console.warn(`[PrivyService] Network error during Privy OTP dispatch:`, err.message);
      return {
        success: false,
        provider: 'FALLBACK',
        message: err.message,
      };
    }
  }

  /**
   * Verifies the 6-digit OTP code against Privy's official passwordless authentication endpoint.
   * If valid, Privy returns the authenticated user object and identity token.
   */
  public static async verifyEmailOtp(
    email: string,
    code: string
  ): Promise<{
    success: boolean;
    privyUserId?: string;
    userData?: any;
    error?: string;
    message?: string;
  }> {
    const appId = this.getAppId();
    if (!appId) {
      return {
        success: false,
        error: 'PRIVY_NOT_CONFIGURED',
        message: 'PRIVY_APP_ID is not configured.',
      };
    }

    try {
      const res = await fetch('https://auth.privy.io/api/v1/passwordless/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'privy-app-id': appId,
        },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const privyUserId = data.user?.id || `did:privy:${randomUUID().replace(/-/g, '')}`;
        console.log(`[PrivyService] ✅ Email verified by Privy for ${email}. Privy User: ${privyUserId}`);
        return {
          success: true,
          privyUserId,
          userData: data.user,
          message: 'Email successfully verified via Privy!',
        };
      } else {
        const errJson = await res.json().catch(() => ({ error: 'Invalid verification code' }));
        console.warn(`[PrivyService] Privy verification failed (${res.status}):`, errJson);
        return {
          success: false,
          error: 'INVALID_PRIVY_CODE',
          message: errJson.error || 'Invalid verification code. Please check the 6-digit code sent by Privy.',
        };
      }
    } catch (err: any) {
      console.warn(`[PrivyService] Network error during Privy OTP verification:`, err.message);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err.message,
      };
    }
  }
}

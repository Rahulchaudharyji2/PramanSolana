import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { PrivyService } from './privy.service.js';

interface OtpEntry {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  token?: string;
  lastSentAt: number;
  provider: 'PRIVY' | 'RESEND' | 'SMTP' | 'DEV';
}

// In-memory OTP storage with TTL
const otpStore = new Map<string, OtpEntry>();

// In-memory verified tokens (valid for 15 minutes to complete registration)
const verifiedTokenStore = new Map<
  string,
  { email: string; privyUserId?: string; expiresAt: number }
>();

export class OtpService {
  /**
   * Helper to build a Nodemailer SMTP transporter if credentials exist.
   */
  private static getSmtpTransporter() {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = parseInt(process.env.SMTP_PORT || '587', 10);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return null;
  }

  /**
   * Generates and dispatches a 6-digit OTP code to the user's real email address.
   * Priority:
   * 1. Official Privy Passwordless Email API (via auth.privy.io)
   * 2. Resend REST API (via RESEND_API_KEY)
   * 3. Nodemailer SMTP / Gmail App Password (via SMTP_HOST / GMAIL_USER)
   * 4. Fallback dev console print for instant offline testing
   */
  public static async sendOtp(email: string): Promise<{
    success: boolean;
    provider: 'PRIVY' | 'RESEND' | 'SMTP' | 'DEV';
    message: string;
    emailSent: boolean;
    devOtp: string;
    expiresAt: number;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid email address is required');
    }

    const existing = otpStore.get(cleanEmail);
    const now = Date.now();

    // Rate-limit: 1 OTP per 10 seconds
    if (existing && now - existing.lastSentAt < 10000) {
      const waitSec = Math.ceil((10000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before requesting a new code.`);
    }

    // Generate random 6-digit numeric OTP (used for fallback or local test scripts)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    let emailSent = false;
    let provider: 'PRIVY' | 'RESEND' | 'SMTP' | 'DEV' = 'DEV';
    let message = `Verification code generated for ${cleanEmail}`;

    // 1. PRIMARY: Try Official Privy Passwordless Email API
    const privyAppId = PrivyService.getAppId();
    if (privyAppId) {
      const privyRes = await PrivyService.sendEmailOtp(cleanEmail);
      if (privyRes.success) {
        emailSent = true;
        provider = 'PRIVY';
        message = `Official 6-digit verification code sent via Privy to ${cleanEmail}. Please check your inbox.`;
        console.log(`[OtpService] 🚀 Verification email successfully dispatched via Privy to: ${cleanEmail}`);
      }
    }

    // 2. SECONDARY: Try Resend API if Privy was not configured or skipped
    if (!emailSent && process.env.RESEND_API_KEY) {
      try {
        const fromAddress = process.env.SMTP_FROM || 'Praman Network <onboarding@resend.dev>';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: cleanEmail,
            subject: `🔐 Your Praman Network Verification Code: ${code}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080A0F; color: #F8FAFC; padding: 40px 20px; text-align: center;">
                <div style="max-width: 460px; margin: 0 auto; background-color: #0F131D; border: 1px solid #1E2538; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  <h1 style="color: #00F2FE; font-size: 24px; margin-bottom: 8px;">Praman Network</h1>
                  <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px;">Zero-Knowledge Biometric Authentication on Solana</p>
                  <p style="color: #E2E8F0; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Your 6-digit email verification code to provision your Privy Solana Wallet and register your ZK Face Identity is:
                  </p>
                  <div style="background-color: #080A0F; border: 1px solid rgba(0, 242, 254, 0.4); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00F2FE;">
                      ${code}
                    </span>
                  </div>
                  <p style="color: #64748B; font-size: 12px;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
                </div>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          provider = 'RESEND';
          message = `Verification code delivered directly to ${cleanEmail}`;
          console.log(`[OtpService] 🚀 Real email successfully delivered via Resend API to: ${cleanEmail}`);
        }
      } catch (err: any) {
        console.warn(`[OtpService] Failed to dispatch email via Resend:`, err.message);
      }
    }

    // 3. TERTIARY: Try Nodemailer SMTP / Gmail App Password
    if (!emailSent) {
      const transporter = this.getSmtpTransporter();
      if (transporter) {
        try {
          const fromAddress =
            process.env.SMTP_FROM ||
            `"Praman Network" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'auth@praman.network'}>`;

          await transporter.sendMail({
            from: fromAddress,
            to: cleanEmail,
            subject: `🔐 Your Praman Network Verification Code: ${code}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080A0F; color: #F8FAFC; padding: 40px 20px; text-align: center;">
                <div style="max-width: 460px; margin: 0 auto; background-color: #0F131D; border: 1px solid #1E2538; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  <h1 style="color: #00F2FE; font-size: 24px; margin-bottom: 8px;">Praman Network</h1>
                  <p style="color: #94A3B8; font-size: 14px; margin-bottom: 24px;">Zero-Knowledge Biometric Authentication on Solana</p>
                  <p style="color: #E2E8F0; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Your 6-digit email verification code to provision your Privy Solana Wallet and register your ZK Face Identity is:
                  </p>
                  <div style="background-color: #080A0F; border: 1px solid rgba(0, 242, 254, 0.4); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                    <span style="font-family: monospace; font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00F2FE;">
                      ${code}
                    </span>
                  </div>
                  <p style="color: #64748B; font-size: 12px;">This code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
                </div>
              </div>
            `,
          });
          emailSent = true;
          provider = 'SMTP';
          message = `Verification code delivered directly to ${cleanEmail}`;
          console.log(`[OtpService] 🚀 Real email successfully delivered via SMTP to: ${cleanEmail}`);
        } catch (err: any) {
          console.warn(`[OtpService] SMTP dispatch failed:`, err.message);
        }
      }
    }

    otpStore.set(cleanEmail, {
      email: cleanEmail,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
      lastSentAt: now,
      provider,
    });

    console.log(`\n======================================================`);
    console.log(`📧 [Praman OTP] Verification for ${cleanEmail} (Provider: ${provider})`);
    if (provider !== 'PRIVY') {
      console.log(`🔑 Verification Code: ${code}`);
    } else {
      console.log(`🔑 Official code sent directly to inbox by Privy`);
    }
    console.log(`⏰ Valid for 10 minutes`);
    console.log(`======================================================\n`);

    return {
      success: true,
      provider,
      emailSent,
      message,
      devOtp: code,
      expiresAt,
    };
  }

  /**
   * Verifies the 6-digit OTP code entered by the user.
   * On success, generates a one-time verificationToken.
   * Priority:
   * 1. Official Privy Passwordless API verification (auth.privy.io)
   * 2. Local fallback verification
   */
  public static async verifyOtp(
    email: string,
    code: string
  ): Promise<{
    success: boolean;
    verificationToken?: string;
    privyUserId?: string;
    provider?: string;
    error?: string;
    message?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code ? code.trim() : '';

    if (!cleanCode || cleanCode.length < 6) {
      return {
        success: false,
        error: 'INVALID_CODE_LENGTH',
        message: 'Please enter the complete 6-digit verification code.',
      };
    }

    // 1. PRIMARY: If Privy is configured, verify with Privy
    const privyAppId = PrivyService.getAppId();
    if (privyAppId) {
      const privyRes = await PrivyService.verifyEmailOtp(cleanEmail, cleanCode);
      if (privyRes.success) {
        const verificationToken = `vtok_${randomUUID().replace(/-/g, '')}`;
        const privyUserId = privyRes.privyUserId;

        verifiedTokenStore.set(verificationToken, {
          email: cleanEmail,
          privyUserId,
          expiresAt: Date.now() + 15 * 60 * 1000,
        });

        otpStore.delete(cleanEmail);

        console.log(`✅ [Praman OTP] Email successfully verified via Privy: ${cleanEmail} (Privy User: ${privyUserId})`);

        return {
          success: true,
          verificationToken,
          privyUserId,
          provider: 'PRIVY',
          message: 'Email address verified successfully via Privy!',
        };
      }
    }

    // 2. FALLBACK: Check local store for dev / automated test script verification
    const entry = otpStore.get(cleanEmail);
    if (!entry) {
      return {
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid verification code or code expired. Please request a new code.',
      };
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanEmail);
      return {
        success: false,
        error: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a new code.',
      };
    }

    if (entry.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return {
        success: false,
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many incorrect attempts. Please request a fresh verification code.',
      };
    }

    if (entry.code !== cleanCode) {
      entry.attempts += 1;
      return {
        success: false,
        error: 'INVALID_OTP',
        message: `Incorrect code. ${5 - entry.attempts} attempt(s) remaining.`,
      };
    }

    // OTP matched successfully in fallback!
    const verificationToken = `vtok_${randomUUID().replace(/-/g, '')}`;
    entry.verified = true;
    entry.token = verificationToken;

    verifiedTokenStore.set(verificationToken, {
      email: cleanEmail,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    otpStore.delete(cleanEmail);

    console.log(`✅ [Praman OTP] Email verified via local fallback: ${cleanEmail} (token: ${verificationToken})`);

    return {
      success: true,
      verificationToken,
      provider: 'FALLBACK',
      message: 'Email address successfully verified!',
    };
  }

  /**
   * Validates and consumes the verification token during user registration.
   */
  public static validateAndConsumeToken(
    email: string,
    token?: string
  ): { valid: boolean; privyUserId?: string } {
    if (!token) return { valid: false };
    const cleanEmail = email.trim().toLowerCase();

    const record = verifiedTokenStore.get(token);
    if (!record) return { valid: false };

    if (Date.now() > record.expiresAt) {
      verifiedTokenStore.delete(token);
      return { valid: false };
    }

    if (record.email !== cleanEmail) {
      return { valid: false };
    }

    const privyUserId = record.privyUserId;

    // Token is valid! Consume it (one-time use)
    verifiedTokenStore.delete(token);
    return { valid: true, privyUserId };
  }
}

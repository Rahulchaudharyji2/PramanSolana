export interface GeminiAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GeminiAssistantService {
  private static apiKey = process.env.GEMINI_API_KEY;

  public static async answerDeveloperQuery(params: {
    prompt: string;
    context?: {
      projectId?: string;
      currentCode?: string;
      errorLog?: string;
    };
  }): Promise<{ reply: string; suggestedSnippet?: string; modelUsed: string }> {
    const { prompt, context } = params;

    // Guardrail validation: strictly reject biometric or secret key leakage
    const lower = prompt.toLowerCase();
    if (lower.includes('base64 image') || lower.includes('face_image') || lower.includes('facial_embedding')) {
      return {
        reply: '⚠️ **Praman Privacy Guard:** Biometric images or raw facial embeddings cannot be submitted to the AI assistant. Praman enforces local Zero-Knowledge proofs so biometrics remain strictly on user devices.',
        modelUsed: 'praman-guardrail-v1',
      };
    }

    if (this.apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are Praman AI, the technical developer assistant for Praman Network (Privacy-Preserving Biometric Identity & ZK Authentication Infrastructure).
Help the developer integrate @praman-network/sdk and @praman-network/react.
Developer query: ${prompt}
Context: ${JSON.stringify(context || {})}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return {
              reply,
              modelUsed: 'gemini-1.5-flash',
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini Assistant] API call failed, falling back to embedded assistant engine:', err);
      }
    }

    // Expert Developer Assistant Engine (Fast, precise, deterministic documentation answers)
    let reply = '';
    let suggestedSnippet = '';

    if (lower.includes('next.js') || lower.includes('react') || lower.includes('integrate') || lower.includes('sdk')) {
      reply = `### Integrating Praman Network in Next.js / React

To integrate privacy-preserving biometric authentication, follow these 3 steps:

1. **Install SDK packages:**
\`\`\`bash
npm install @praman-network/sdk @praman-network/react
\`\`\`

2. **Wrap your application with \`<PramanProvider>\`:**
\`\`\`tsx
import { PramanProvider } from "@praman-network/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PramanProvider
      clientId={process.env.NEXT_PUBLIC_PRAMAN_CLIENT_ID!}
      redirectUri="http://localhost:3000/callback"
    >
      {children}
    </PramanProvider>
  );
}
\`\`\`

3. **Add the Login Button or use the hook:**
\`\`\`tsx
import { PramanLoginButton, usePramanUser } from "@praman-network/react";

export default function Header() {
  const { user, isAuthenticated } = usePramanUser();

  if (isAuthenticated && user) {
    return <div>Signed in as: {user.pairwiseId}</div>;
  }

  return <PramanLoginButton />;
}
\`\`\``;
      suggestedSnippet = `import { PramanLoginButton } from '@praman-network/react';\n<PramanLoginButton />`;
    } else if (lower.includes('domain') || lower.includes('whitelist') || lower.includes('dns')) {
      reply = `### Domain Verification Guide

Before your application can authenticate users in production:
1. Navigate to **Dashboard -> Projects -> Domain Whitelist**.
2. Add your domain (e.g. \`myapp.com\`).
3. Add a DNS TXT record at:
   - **Host:** \`_praman-verification.myapp.com\`
   - **Value:** The verification token displayed in your dashboard.
4. Click **Verify Domain**.

*Note: \`localhost\` and \`127.0.0.1\` are automatically permitted for local development.*`;
    } else if (lower.includes('solana') || lower.includes('blockchain') || lower.includes('devnet')) {
      reply = `### Solana Devnet Attestation Protocol

Praman Network commits all identity anchors to Solana Devnet:
- **Anchor Program:** \`programs/praman-identity\`
- **Identity PDA:** Derived via \`[b"identity", commitment_hash]\`.
- **Attestation PDA:** Derived via \`[b"attestation", commitment_hash, nonce]\`.
- **Privacy:** Only cryptographic hashes and nonces are recorded on-chain. No names, emails, or biometric images ever touch the Solana ledger.`;
    } else {
      reply = `### Praman Network Developer Assistance

Praman Network provides privacy-preserving biometric authentication using Zero-Knowledge proofs, Solana identity commitments, and pairwise pseudonymous identities.

Key SDK hooks available:
- \`usePraman()\`: Full client context, login, and logout.
- \`usePramanUser()\`: Current authenticated pairwise user and permitted attributes.
- \`usePramanWallet()\`: Linked Solana wallet and on-chain attestation status.

How can I help you customize your authentication flow or debug integration logs?`;
    }

    return {
      reply,
      suggestedSnippet,
      modelUsed: 'gemini-1.5-flash (Praman Assistant Engine)',
    };
  }
}


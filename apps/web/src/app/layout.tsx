import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Praman Network | Privacy-Preserving Biometric Authentication Infrastructure',
  description:
    'Prove Who You Are. Without Revealing Who You Are. Zero-Knowledge Biometric Identity Infrastructure powered by Solana and Circom.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080A0F] text-[#F8FAFC] min-h-screen antialiased selection:bg-[#397BFF]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}


import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI 影子老师·同步练习',
  description: 'AI 驱动的中考数学单点爆破',
};

import { checkAuthStatus } from '@/app/actions/auth';
import PasswordGate from '@/components/PasswordGate';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isVerified = await checkAuthStatus();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-indigo-500/50`}>
        <PasswordGate isVerified={isVerified}>
          {children}
        </PasswordGate>
      </body>
    </html>
  );
}
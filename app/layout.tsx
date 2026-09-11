import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/lib/api/query-client';
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
  title: 'Crypto Trading Dashboard',
  description: 'Real-time crypto trading dashboard with live prices, optimistic order execution and portfolio tracking.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scheme-dark`}>
      <body className="min-h-full bg-neutral-950 text-neutral-200">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-radial-[at_50%_0%] from-sky-500/10 to-transparent to-70%"
        />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

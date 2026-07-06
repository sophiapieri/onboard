// Root layout that wires global fonts and the shared auth shell.

import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/ui/Navbar';
import { AuthPromptProvider } from '@/lib/hooks/useAuthPrompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'OnBoard',
  description: 'Turn Pinterest inspiration into a curated fashion shopping experience.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AuthProvider>
          <AuthPromptProvider>
            <Navbar />
            {children}
            <footer className="border-t border-sky/70 bg-sand px-6 py-10 sm:px-10 lg:px-16">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[0.2em] text-navy">ONBOARD</p>
                  <p className="text-sm text-muted">Your style. Curated.</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted">
                  <Link href="/explore" className="hover:text-navy">
                    Explore
                  </Link>
                  <Link href="/about" className="hover:text-navy">
                    About us
                  </Link>
                  <Link href="/login" className="hover:text-navy">
                    Log in
                  </Link>
                </div>
              </div>
            </footer>
          </AuthPromptProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

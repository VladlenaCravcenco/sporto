import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './next.css';

export const metadata: Metadata = {
  title: 'SPORTO',
  description: 'SPORTOSFERA S.R.L.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}

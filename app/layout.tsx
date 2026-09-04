import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import './next.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, ''),
  ),
  title: {
    default: 'SPORTO',
    template: '%s | SPORTO',
  },
  description: 'SPORTOSFERA S.R.L.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const language = requestHeaders.get('x-sporto-locale') === 'ru' ? 'ru' : 'ro';

  return (
    <html lang={language}>
      <body>{children}</body>
    </html>
  );
}

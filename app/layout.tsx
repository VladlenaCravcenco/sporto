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
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const language = requestHeaders.get('x-sporto-locale') === 'ru' ? 'ru' : 'ro';
  let heroOrigin: string | undefined;
  if (/^\/(ro|ru)\/?$/.test(requestHeaders.get('x-sporto-pathname') || '')) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
      if (url.protocol === 'https:') heroOrigin = url.origin;
    } catch { /* Public builds without Supabase still render normally. */ }
  }

  return (
    <html lang={language}>
      <head>
        {heroOrigin && <link rel="preconnect" href={heroOrigin} />}
        <link rel="preload" href="/fonts/inter/InterLatinCore.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {language === 'ru' && <link rel="preload" href="/fonts/inter/InterCyrillicCore.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />}
      </head>
      <body>{children}</body>
    </html>
  );
}

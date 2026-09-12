import { notFound, redirect } from 'next/navigation';
import type { Language } from '../../_components/HeaderPreview';

const productionUrl = 'https://www.sporto.md';
const supportedLanguages = new Set<Language>(['ro', 'ru']);
const legacyRoutes = new Set([
  'catalog',
  'product',
  'brands',
  'login',
  'forgot-password',
  'reset-password',
  'verify',
  'account',
  'turnkey-solutions',
  'maintenance-service',
  'order-request',
  'contacts',
  'about',
  'terms-of-cooperation',
  'delivery-terms',
  'privacy-policy',
]);

interface LegacyBridgePageProps {
  params: Promise<{ lang: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Temporary migration bridge. Exact App Router pages automatically take
 * precedence as they are migrated. Remove this catch-all before production
 * cutover, once every public route below exists natively in Next.js.
 */
export default async function LegacyBridgePage({ params, searchParams }: LegacyBridgePageProps) {
  const { lang, slug } = await params;
  if (!supportedLanguages.has(lang as Language) || !slug.length || !legacyRoutes.has(slug[0])) notFound();

  const target = new URL(`/${slug.map(encodeURIComponent).join('/')}`, productionUrl);
  const query = await searchParams;

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || key === 'lang') continue;
    for (const value of Array.isArray(rawValue) ? rawValue : [rawValue]) {
      target.searchParams.append(key, value);
    }
  }

  if (lang === 'ru') target.searchParams.set('lang', 'ru');
  redirect(target.toString());
}

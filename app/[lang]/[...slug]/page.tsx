import { notFound, redirect } from 'next/navigation';
import { PublicContentPage } from '../../_components/PublicContentPage';
import type { Language } from '../../_components/HeaderPreview';

const contentRoutes = new Set([
  'about', 'contacts', 'turnkey-solutions', 'maintenance-service',
  'terms-of-cooperation', 'delivery-terms', 'privacy-policy', 'order-request',
]);
const authRoutes = new Set(['login', 'register', 'account', 'forgot-password', 'reset-password', 'callback']);

export default async function PublicPage({ params, searchParams }: {
  params: Promise<{ lang: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang, slug } = await params;
  if (lang !== 'ro' && lang !== 'ru') notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value === undefined || key === 'lang') continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  if (slug.length === 1 && authRoutes.has(slug[0])) {
    query.set('lang', lang);
    redirect(`/${slug[0]}?${query}`);
  }
  if (!(slug.length === 1 && contentRoutes.has(slug[0])) && !(slug.length === 2 && slug[0] === 'brands')) notFound();
  return <PublicContentPage language={lang as Language} pathname={`/${slug.join('/')}`} search={query.size ? `?${query}` : ''} />;
}

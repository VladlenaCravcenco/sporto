import { notFound, redirect } from 'next/navigation';
import { PublicContentPage } from '../../_components/PublicContentPage';
import type { Language } from '../../_components/HeaderPreview';
import type { Metadata } from 'next';
import { contentSeo, localizedMetadata } from '../../_lib/page-seo';
import { getPublicPageData } from '../../_lib/public-page-data';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string[] }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (lang !== 'ro' && lang !== 'ru') return {};
  if (slug.length !== 1) return {};
  if (slug[0] === 'order-request') return { title: lang === 'ro' ? 'Cerere de ofertă' : 'Заявка', robots: { index: false, follow: false } };
  const seo = contentSeo[slug[0]]?.[lang];
  return seo ? localizedMetadata(lang, '/' + slug[0], ...seo) : {};
}

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
  if (!(slug.length === 1 && contentRoutes.has(slug[0]))) notFound();
  const initialData = await getPublicPageData(slug[0]);
  return <PublicContentPage key={`${lang}/${slug[0]}`} initialData={initialData} language={lang as Language} pathname={`/${slug.join('/')}`} search={query.size ? `?${query}` : ''} />;
}

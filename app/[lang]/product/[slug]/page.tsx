import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getProductDetail } from '../../../_lib/product-data';
import type { Language } from '../../../_components/HeaderPreview';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');

interface ProductByIdPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'produs';
}

function productPath(product: { id: string; name_ro: string; name_ru: string | null }, language: Language) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  return `/${language}/product/${encodeURIComponent(slugify(name))}/${encodeURIComponent(product.id)}`;
}

export async function generateMetadata({ params }: ProductByIdPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (lang !== 'ro' && lang !== 'ru') return {};
  const data = await getProductDetail(slug);
  if (!data) return {};
  const name = lang === 'ru' ? data.product.name_ru || data.product.name_ro : data.product.name_ro;
  return { title: name, alternates: { canonical: `${siteUrl}${productPath(data.product, lang)}` } };
}

export default async function ProductByIdPage({ params }: ProductByIdPageProps) {
  const { lang, slug } = await params;
  if (lang !== 'ro' && lang !== 'ru') notFound();
  const data = await getProductDetail(slug);
  if (!data) notFound();
  redirect(productPath(data.product, lang));
}
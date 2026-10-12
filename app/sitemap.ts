import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './_lib/supabase-env';
import { productPath } from './_lib/product-url';

export const dynamic = 'force-dynamic';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = getSupabasePublicConfig();
  // Fail instead of publishing an incomplete sitemap when the database is unavailable.
  if (!config) throw new Error('Sitemap requires public Supabase configuration');
  const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const entries: MetadataRoute.Sitemap = [];
  const add = (ro: string, ru: string, updated?: string | null) => {
    const languages = { ro: `${siteUrl}${ro}`, ru: `${siteUrl}${ru}`, 'x-default': `${siteUrl}${ro}` };
    for (const path of [ro, ru]) entries.push({ url: `${siteUrl}${path}`, ...(updated ? { lastModified: updated } : {}), alternates: { languages } });
  };
  for (const path of ['', '/catalog', '/about', '/contacts', '/turnkey-solutions', '/maintenance-service', '/terms-of-cooperation', '/delivery-terms', '/privacy-policy']) {
    add(`/ro${path}`, `/ru${path}`);
  }
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('products').select('id,name_ro,name_ru,updated_at').eq('active', true).order('id').range(from, from + 999);
    if (error) throw new Error(`Sitemap products: ${error.message}`);
    for (const product of data || []) add(productPath(product, 'ro'), productPath(product, 'ru'), product.updated_at);
    if (!data || data.length < 1000) break;
  }
  return entries;
}

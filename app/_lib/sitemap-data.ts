import { readProductCategoryLinks } from './product-category-links';
import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import { productPath } from './product-url';
import { readPublicRows } from './public-rows';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = getSupabasePublicConfig();
  // Fail instead of publishing an incomplete sitemap when the database is unavailable.
  if (!config) throw new Error('Sitemap requires public Supabase configuration');
  const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const entries: MetadataRoute.Sitemap = [];
  const categoryIds = new Set<string>();
  const childIds = new Set<string>();
  const brandNames = new Set<string>();
  const add = (ro: string, ru: string, updated?: string | null) => {
    const languages = { ro: `${siteUrl}${ro}`, ru: `${siteUrl}${ru}`, 'x-default': `${siteUrl}${ro}` };
    for (const path of [ro, ru]) entries.push({ url: `${siteUrl}${path}`, ...(updated ? { lastModified: updated } : {}), alternates: { languages } });
  };
  for (const path of ['', '/catalog', '/about', '/contacts', '/turnkey-solutions', '/maintenance-service', '/terms-of-cooperation', '/delivery-terms', '/privacy-policy']) {
    add(`/ro${path}`, `/ru${path}`);
  }
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('products').select('id,name_ro,name_ru,updated_at,category,subcategory,brand').eq('active', true).order('id').range(from, from + 999);
    if (error) throw new Error(`Sitemap products: ${error.message}`);
    for (const product of data || []) {
      add(productPath(product, 'ro'), productPath(product, 'ru'), product.updated_at);
      if (product.category) categoryIds.add(product.category);
      if (product.category && product.subcategory) childIds.add(JSON.stringify([product.category, product.subcategory]));
      if (product.brand) brandNames.add(product.brand);
    }
    if (!data || data.length < 1000) break;
  }
  for (const link of await readProductCategoryLinks(db)) {
    categoryIds.add(link.category);
    if (link.subcategory) childIds.add(JSON.stringify([link.category, link.subcategory]));
  }
  const [categories, children, brands] = await Promise.all([
    readPublicRows(db.from('categories').select('slug').eq('active', true).order('slug')),
    readPublicRows(db.from('subcategories').select('category_slug,slug').order('category_slug').order('slug')),
    readPublicRows(db.from('brands').select('name,slug').eq('active', true).order('slug')),
  ]);
  for (const category of categories) {
    if (!category.slug || !categoryIds.has(category.slug)) continue;
    const path = '/catalog?' + new URLSearchParams({ category: category.slug });
    add('/ro' + path, '/ru' + path);
    for (const child of children) {
      if (child.category_slug !== category.slug || !child.slug || !childIds.has(JSON.stringify([category.slug, child.slug]))) continue;
      const path = '/catalog?' + new URLSearchParams({ category: category.slug, subcategory: child.slug });
      add('/ro' + path, '/ru' + path);
    }
  }
  for (const brand of brands) if (brand.slug && brandNames.has(brand.name)) add(`/ro/brands/${encodeURIComponent(brand.slug)}`, `/ru/brands/${encodeURIComponent(brand.slug)}`);
  return entries;
}

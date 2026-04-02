import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const siteUrl = 'https://sportosfera.md';
const generatedAt = new Date().toISOString();

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/catalog', priority: '0.9', changefreq: 'daily' },
  { path: '/turnkey-solutions', priority: '0.8', changefreq: 'monthly' },
  { path: '/maintenance-service', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contacts', priority: '0.8', changefreq: 'monthly' },
  { path: '/terms-of-cooperation', priority: '0.4', changefreq: 'yearly' },
  { path: '/delivery-terms', priority: '0.4', changefreq: 'yearly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizePath(urlPath) {
  if (!urlPath || urlPath === '/') return siteUrl;
  return `${siteUrl}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
}

function createUrlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
  ];

  if (lastmod) {
    parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }

  if (changefreq) {
    parts.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  }

  if (priority) {
    parts.push(`    <priority>${escapeXml(priority)}</priority>`);
  }

  parts.push('  </url>');
  return parts.join('\n');
}

async function fetchDynamicEntries() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [productsResult, brandsResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, updated_at')
      .eq('active', true)
      .order('id', { ascending: true })
      .limit(10000),
    supabase
      .from('brands')
      .select('slug, created_at, active')
      .neq('slug', '')
      .order('slug', { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Products query failed: ${productsResult.error.message}`);
  }

  if (brandsResult.error) {
    throw new Error(`Brands query failed: ${brandsResult.error.message}`);
  }

  const productEntries = (productsResult.data ?? [])
    .filter((product) => product.id)
    .map((product) => ({
      loc: normalizePath(`/product/${product.id}`),
      lastmod: product.updated_at || generatedAt,
      changefreq: 'weekly',
      priority: '0.7',
    }));

  const brandEntries = (brandsResult.data ?? [])
    .filter((brand) => brand.slug && brand.active !== false)
    .map((brand) => ({
      loc: normalizePath(`/brands/${brand.slug}`),
      lastmod: brand.created_at || generatedAt,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  return [...productEntries, ...brandEntries];
}

async function generateSitemap() {
  const staticEntries = staticPages.map((page) => ({
    loc: normalizePath(page.path),
    lastmod: generatedAt,
    changefreq: page.changefreq,
    priority: page.priority,
  }));

  let dynamicEntries = [];

  try {
    dynamicEntries = await fetchDynamicEntries();
    console.log(`[sitemap] Loaded ${dynamicEntries.length} dynamic URLs from Supabase`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemap] Failed to load dynamic URLs, falling back to static pages only: ${message}`);
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticEntries, ...dynamicEntries].map(createUrlEntry),
    '</urlset>',
    '',
  ].join('\n');

  await mkdir(publicDir, { recursive: true });
  await writeFile(sitemapPath, sitemap, 'utf8');
  console.log(`[sitemap] Wrote ${staticEntries.length + dynamicEntries.length} URLs to ${sitemapPath}`);
}

await generateSitemap();

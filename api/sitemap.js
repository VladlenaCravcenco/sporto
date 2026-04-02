import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_URL = 'https://www.sporto.md';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

const STATIC_PAGES = [
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

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return DEFAULT_SITE_URL;
  return `${proto}://${host}`;
}

function absoluteUrl(baseUrl, urlPath) {
  if (!urlPath || urlPath === '/') return baseUrl;
  return `${baseUrl}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;
}

function renderUrl({ loc, lastmod, changefreq, priority }) {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
  ];

  if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  if (priority) lines.push(`    <priority>${escapeXml(priority)}</priority>`);

  lines.push('  </url>');
  return lines.join('\n');
}

export default async function handler(req, res) {
  const baseUrl = getBaseUrl(req);
  const generatedAt = new Date().toISOString();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const staticEntries = STATIC_PAGES.map((page) => ({
    loc: absoluteUrl(baseUrl, page.path),
    lastmod: generatedAt,
    changefreq: page.changefreq,
    priority: page.priority,
  }));

  let dynamicEntries = [];

  try {
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
        loc: absoluteUrl(baseUrl, `/product/${product.id}`),
        lastmod: product.updated_at || generatedAt,
        changefreq: 'weekly',
        priority: '0.7',
      }));

    const brandEntries = (brandsResult.data ?? [])
      .filter((brand) => brand.slug && brand.active !== false)
      .map((brand) => ({
        loc: absoluteUrl(baseUrl, `/brands/${brand.slug}`),
        lastmod: brand.created_at || generatedAt,
        changefreq: 'weekly',
        priority: '0.6',
      }));

    dynamicEntries = [...productEntries, ...brandEntries];
  } catch (error) {
    console.error('[sitemap] failed to load dynamic entries', error);
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticEntries, ...dynamicEntries].map(renderUrl),
    '</urlset>',
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(body);
}

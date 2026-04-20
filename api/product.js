import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.sporto.md';
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_TEMPLATE_PATH = path.join(__dirname, '..', 'dist', 'index.html');

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function decodePathSegment(value) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch {
    return String(value || '');
  }
}

function normalizeKey(value) {
  return String(value || '').trim();
}

function getProductRouteKey(product) {
  return normalizeKey(product.sku) || String(product.id);
}

function buildProductPath(product) {
  return `/product/${encodeURIComponent(getProductRouteKey(product))}`;
}

function normalizeImageUrl(image, origin) {
  const raw = normalizeKey(image);
  if (!raw) return DEFAULT_OG;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  return new URL(raw.startsWith('/') ? raw : `/${raw}`, origin).toString();
}

function buildDescription(product) {
  return normalizeKey(product.description_ro)
    || normalizeKey(product.description_ru)
    || `Descoperă ${product.name_ro} disponibil la comandă în Moldova.`;
}

function buildKeywords(product) {
  return [
    product.name_ro,
    product.name_ru,
    product.brand,
    product.sku,
    'echipament sportiv Moldova',
    'спортивное оборудование Молдова',
  ].filter(Boolean).join(', ');
}

function buildProductJsonLd(product, url, image, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name_ro,
    image: [image],
    description,
    sku: product.sku || undefined,
    url,
    brand: { '@type': 'Brand', name: product.brand || 'Sporto' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MDL',
      price: String(product.sale_price ?? product.price ?? 0),
      availability: (product.qty ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

function injectMeta(template, { title, description, image, url, keywords, jsonLd }) {
  let html = template;

  const replaceOrInsert = (pattern, replacement) => {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
      return;
    }
    html = html.replace('</head>', `${replacement}\n</head>`);
  };

  replaceOrInsert(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  replaceOrInsert(/<meta\s+name=["']description["'][^>]*?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  replaceOrInsert(/<meta\s+name=["']keywords["'][^>]*?>/i, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:title["'][^>]*?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:description["'][^>]*?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:image["'][^>]*?>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:url["'][^>]*?>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:type["'][^>]*?>/i, `<meta property="og:type" content="product" />`);
  replaceOrInsert(/<meta\s+name=["']twitter:title["'][^>]*?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  replaceOrInsert(/<meta\s+name=["']twitter:description["'][^>]*?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  replaceOrInsert(/<meta\s+name=["']twitter:image["'][^>]*?>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:image:secure_url["'][^>]*?>/i, `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`);
  replaceOrInsert(/<meta\s+property=["']og:image:alt["'][^>]*?>/i, `<meta property="og:image:alt" content="${escapeHtml(title)}" />`);
  replaceOrInsert(/<link\s+rel=["']canonical["'][^>]*?>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`);

  return html;
}

async function loadTemplate() {
  return fs.readFile(DIST_TEMPLATE_PATH, 'utf8');
}

async function findProduct(supabase, key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) return null;

  const bySku = await supabase
    .from('products')
    .select('id, sku, name_ro, name_ru, description_ro, description_ru, image_url, images, brand, price, sale_price, qty, active')
    .eq('sku', normalizedKey)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (bySku.error) throw bySku.error;
  if (bySku.data) return bySku.data;

  const byId = await supabase
    .from('products')
    .select('id, sku, name_ro, name_ru, description_ro, description_ru, image_url, images, brand, price, sale_price, qty, active')
    .eq('id', normalizedKey)
    .eq('active', true)
    .maybeSingle();

  if (byId.error) throw byId.error;
  return byId.data || null;
}

export default async function handler(req, res) {
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host || 'www.sporto.md'}`;
  const requestedSlug = normalizeKey(req.query.slug);
  const lookupKey = requestedSlug.includes('--')
    ? normalizeKey(requestedSlug.split('--').pop())
    : decodePathSegment(requestedSlug);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const [template, product] = await Promise.all([
      loadTemplate(),
      findProduct(supabase, lookupKey),
    ]);

    if (!product) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.status(404).send(template);
      return;
    }

    const canonicalPath = buildProductPath(product);
    const canonicalUrl = new URL(canonicalPath, origin).toString();
    const title = `${product.name_ro} | SPORTOSFERA`;
    const description = buildDescription(product);
    const image = normalizeImageUrl(product.image_url || product.images?.[0], origin);
    const html = injectMeta(template, {
      title,
      description,
      image,
      url: canonicalUrl,
      keywords: buildKeywords(product),
      jsonLd: buildProductJsonLd(product, canonicalUrl, image, description),
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
    res.status(200).send(html);
  } catch (error) {
    console.error('[product] failed to render product metadata', error);
    res.status(500).send('Internal Server Error');
  }
}

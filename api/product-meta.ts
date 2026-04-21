const SITE_URL = 'https://www.sporto.md';
const SITE_NAME = 'Sporto';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

type ProductRow = {
  id: string | number;
  name_ro: string | null;
  name_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  image_url: string | null;
  images: string[] | null;
  price: number | string | null;
  sale_price: number | string | null;
  sku: string | null;
  brand: string | null;
  qty: number | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeJsonForHtml(value: string): string {
  return value
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractProductIdFromParam(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const decoded = decodePathSegment(value).trim();
  if (!decoded) return undefined;
  const legacyParts = decoded.split('--');
  return legacyParts[legacyParts.length - 1] || decoded;
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function sanitizeMetaText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImageUrl(value: string | null | undefined): string {
  if (!value) return DEFAULT_OG_IMAGE;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${SITE_URL}${value}`;
  return DEFAULT_OG_IMAGE;
}

function getPrice(product: ProductRow): number | null {
  const price = product.sale_price ?? product.price;
  if (price == null) return null;
  const numeric = Number(price);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildDescription(product: ProductRow): string {
  const cleanDescription = sanitizeMetaText(product.description_ro || product.description_ru);
  const price = getPrice(product);
  const parts = [
    cleanDescription,
    product.brand ? `Brand: ${sanitizeMetaText(product.brand)}.` : '',
    price != null ? `Preț: ${price.toLocaleString('ro-RO')} MDL.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return truncateText(
    parts || 'Echipament sportiv disponibil la comandă prin Sporto în Moldova.',
    180,
  );
}

async function fetchProductBy(field: 'sku' | 'id', value: string): Promise<ProductRow | null> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
  url.searchParams.set('select', 'id,name_ro,name_ru,description_ro,description_ru,image_url,images,price,sale_price,sku,brand,qty');
  url.searchParams.set(field, `eq.${value}`);
  url.searchParams.set('active', 'eq.true');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const data = (await response.json()) as ProductRow[];
  return data[0] || null;
}

async function fetchProduct(slug: string): Promise<ProductRow | null> {
  const resolved = extractProductIdFromParam(slug);
  if (!resolved) return null;
  const bySku = await fetchProductBy('sku', resolved);
  if (bySku) return bySku;
  return fetchProductBy('id', resolved);
}

function renderHtml(slug: string, product: ProductRow | null): string {
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(slug)}`;

  if (!product) {
    const title = 'Produs | Sporto';
    const description = 'Echipament sportiv disponibil la comandă prin Sporto în Moldova.';
    return `<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
  </head>
  <body></body>
</html>`;
  }

  const name = sanitizeMetaText(product.name_ro || product.name_ru || 'Produs Sporto');
  const title = `${name} | Sporto`;
  const description = buildDescription(product);
  const imageUrl = normalizeImageUrl(product.images?.[0] || product.image_url);
  const price = getPrice(product);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    sku: product.sku || String(product.id),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      price: price ?? undefined,
      priceCurrency: 'MDL',
      availability:
        typeof product.qty === 'number' && product.qty > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  };

  return `<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    ${price != null ? `<meta property="product:price:amount" content="${price}" />` : ''}
    ${price != null ? '<meta property="product:price:currency" content="MDL" />' : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <script type="application/ld+json">${escapeJsonForHtml(JSON.stringify(structuredData))}</script>
  </head>
  <body></body>
</html>`;
}

export default async function handler(req: { query?: { slug?: string } }, res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const rawSlug = Array.isArray(req.query?.slug) ? req.query?.slug[0] : req.query?.slug;
  const slug = rawSlug ? String(rawSlug) : '';

  try {
    const product = await fetchProduct(slug);
    const html = renderHtml(slug, product);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.status(product ? 200 : 404).send(html);
  } catch {
    const html = renderHtml(slug, null);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    res.status(500).send(html);
  }
}

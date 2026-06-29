const SITE_URL = 'https://www.sporto.md';
const SITE_NAME = 'Sporto';
const LEGAL_NAME = 'SPORTOSFERA S.R.L.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-site.png`;
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

type ProductLanguage = 'ro' | 'ru';

type ProductRow = {
  id: string | number;
  name_ro: string | null;
  name_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  seo_description_ro?: string | null;
  seo_description_ru?: string | null;
  seo_keywords_ro?: string | null;
  seo_keywords_ru?: string | null;
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

function transliterateRuToLatin(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return value.replace(/[А-Яа-яЁё]/g, (char) => {
    const lower = char.toLowerCase();
    const mapped = map[lower] ?? lower;
    return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  });
}

function slugify(value: string): string {
  return transliterateRuToLatin(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' si ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function sanitizeMetaText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLocalizedProductSlug(product: ProductRow, language: ProductLanguage): string {
  const rawName = sanitizeMetaText(language === 'ru' ? (product.name_ru || product.name_ro) : (product.name_ro || product.name_ru));
  return slugify(rawName) || 'produs';
}

function inferProductLanguage(product: ProductRow, slug: string | undefined, queryLang: string | undefined): ProductLanguage {
  if (queryLang === 'ru' || queryLang === 'ro') return queryLang;
  if (slug) {
    const normalizedSlug = slugify(decodePathSegment(slug));
    if (normalizedSlug === getLocalizedProductSlug(product, 'ru')) return 'ru';
  }
  return 'ro';
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

function buildDescription(product: ProductRow, language: ProductLanguage): string {
  const cleanDescription = sanitizeMetaText(
    language === 'ru'
      ? (product.seo_description_ru || product.seo_description_ro || product.description_ru || product.description_ro)
      : (product.seo_description_ro || product.seo_description_ru || product.description_ro || product.description_ru),
  );
  const fallbackDescription = sanitizeMetaText(
    language === 'ru'
      ? (product.description_ru || product.description_ro)
      : (product.description_ro || product.description_ru),
  );
  const price = getPrice(product);
  const parts = [
    cleanDescription || fallbackDescription,
    product.brand ? `Brand: ${sanitizeMetaText(product.brand)}.` : '',
    price != null ? `${language === 'ru' ? 'Цена' : 'Preț'}: ${price.toLocaleString('ro-RO')} MDL.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return truncateText(
    parts || 'Echipament sportiv disponibil la comandă prin Sporto în Moldova.',
    180,
  );
}

function buildKeywords(product: ProductRow, language: ProductLanguage): string {
  const localizedKeywords = sanitizeMetaText(
    language === 'ru'
      ? (product.seo_keywords_ru || product.seo_keywords_ro)
      : (product.seo_keywords_ro || product.seo_keywords_ru),
  );
  if (localizedKeywords) return localizedKeywords;

  const names = [
    sanitizeMetaText(product.name_ro),
    sanitizeMetaText(product.name_ru),
    sanitizeMetaText(product.brand),
    sanitizeMetaText(product.sku),
  ].filter(Boolean);

  return [...names, 'echipament sportiv Moldova', 'спортивное оборудование Молдова'].join(', ');
}

async function fetchProductBy(field: 'sku' | 'id', value: string): Promise<ProductRow | null> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
  url.searchParams.set('select', '*');
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
  const byId = await fetchProductBy('id', resolved);
  if (byId) return byId;
  return fetchProductBy('sku', resolved);
}

function renderHtml(path: string, slug: string | undefined, language: ProductLanguage, product: ProductRow | null): string {
  const requestedUrl = `${SITE_URL}${path}`;

  if (!product) {
    const title = 'Produs | Sporto';
    const description = 'Echipament sportiv disponibil la comandă prin Sporto în Moldova.';
    return `<!DOCTYPE html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${escapeHtml(requestedUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:url" content="${escapeHtml(requestedUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
  </head>
  <body>
    <main>
      <h1>${language === 'ru' ? 'Товар не найден' : 'Produsul nu a fost găsit'}</h1>
      <p>${escapeHtml(description)}</p>
      <a href="${SITE_URL}/catalog">${language === 'ru' ? 'Открыть каталог' : 'Vezi catalogul'}</a>
    </main>
  </body>
</html>`;
  }

  const name = sanitizeMetaText(
    language === 'ru'
      ? (product.name_ru || product.name_ro || 'Produs Sporto')
      : (product.name_ro || product.name_ru || 'Produs Sporto'),
  );
  const title = `${name} | Sporto`;
  const description = buildDescription(product, language);
  const keywords = buildKeywords(product, language);
  const imageUrl = normalizeImageUrl(product.images?.[0] || product.image_url);
  const price = getPrice(product);
  const routeKey = String(product.id);
  const roUrl = `${SITE_URL}/product/${encodeURIComponent(getLocalizedProductSlug(product, 'ro'))}/${encodeURIComponent(routeKey)}`;
  const ruUrl = `${SITE_URL}/product/${encodeURIComponent(getLocalizedProductSlug(product, 'ru'))}/${encodeURIComponent(routeKey)}`;
  const canonicalUrl = language === 'ru' ? ruUrl : roUrl;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: [imageUrl],
    sku: product.sku || String(product.id),
    mpn: product.sku || String(product.id),
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
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'MD',
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'MDL',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'MD',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      seller: {
        '@type': 'Organization',
        name: LEGAL_NAME,
        alternateName: SITE_NAME,
      },
    },
  };

  return `<!DOCTYPE html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" hreflang="ro" href="${escapeHtml(roUrl)}" />
    <link rel="alternate" hreflang="ru" href="${escapeHtml(ruUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(roUrl)}" />
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
  <body>
    <main>
      <nav><a href="${SITE_URL}/">${language === 'ru' ? 'Главная' : 'Acasă'}</a> / <a href="${SITE_URL}/catalog">${language === 'ru' ? 'Каталог' : 'Catalog'}</a></nav>
      <article>
        <h1>${escapeHtml(name)}</h1>
        <p>${escapeHtml(description)}</p>
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" />
        ${product.brand ? `<p>${language === 'ru' ? 'Бренд' : 'Brand'}: ${escapeHtml(product.brand)}</p>` : ''}
        ${product.sku ? `<p>SKU: ${escapeHtml(product.sku)}</p>` : ''}
        ${price != null ? `<p>${language === 'ru' ? 'Цена' : 'Preț'}: ${price} MDL</p>` : ''}
      </article>
    </main>
  </body>
</html>`;
}

export default async function handler(req: { query?: { slug?: string } }, res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const rawSlug = Array.isArray(req.query?.slug) ? req.query?.slug[0] : req.query?.slug;
  const rawSku = Array.isArray((req.query as { sku?: string | string[] } | undefined)?.sku)
    ? (req.query as { sku?: string[] }).sku?.[0]
    : (req.query as { sku?: string } | undefined)?.sku;
  const rawId = Array.isArray((req.query as { id?: string | string[] } | undefined)?.id)
    ? (req.query as { id?: string[] }).id?.[0]
    : (req.query as { id?: string } | undefined)?.id;
  const rawLang = Array.isArray((req.query as { lang?: string | string[] } | undefined)?.lang)
    ? (req.query as { lang?: string[] }).lang?.[0]
    : (req.query as { lang?: string } | undefined)?.lang;
  const slug = rawSlug ? String(rawSlug) : undefined;
  const sku = rawSku ? String(rawSku) : '';
  const id = rawId ? String(rawId) : '';
  const routeKey = sku || id;
  const path = slug ? `/product/${encodeURIComponent(slug)}/${encodeURIComponent(routeKey)}` : `/product/${encodeURIComponent(routeKey)}`;

  try {
    const product = await fetchProduct(routeKey || slug || '');
    const language = product ? inferProductLanguage(product, slug, rawLang) : (rawLang === 'ru' ? 'ru' : 'ro');
    const html = renderHtml(path, slug, language, product);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Vary', 'User-Agent');
    res.status(product ? 200 : 404).send(html);
  } catch {
    const html = renderHtml(path, slug, 'ro', null);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    res.setHeader('Vary', 'User-Agent');
    res.status(500).send(html);
  }
}

const SITE_URL = 'https://www.sporto.md';
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

type SitemapEntry = {
  loc: string;
  lastmod?: string | null;
  changefreq?: string;
  priority?: string;
  alternates?: Array<{ hreflang: 'ro' | 'ru' | 'x-default'; href: string }>;
};

type ProductRow = {
  id: string | number;
  name_ro: string | null;
  name_ru: string | null;
  sku: string | null;
  updated_at: string | null;
};

type CategoryRow = {
  slug: string;
  active?: boolean;
  created_at: string | null;
};

type SubcategoryRow = {
  category_slug: string;
  slug: string;
  created_at: string | null;
};

type BrandRow = {
  slug: string;
  active?: boolean;
  created_at: string | null;
};

const STATIC_PAGES = [
  { path: '/', ruPath: '/ru', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/turnkey-solutions', changefreq: 'monthly', priority: '0.8' },
  { path: '/maintenance-service', changefreq: 'monthly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/contacts', changefreq: 'monthly', priority: '0.8' },
  { path: '/terms-of-cooperation', changefreq: 'yearly', priority: '0.4' },
  { path: '/delivery-terms', changefreq: 'yearly', priority: '0.4' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function transliterateRuToLatin(value: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return value.replace(/[А-Яа-яЁё]/g, (char) => map[char.toLowerCase()] ?? char);
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

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

function localizedUrl(path: string, language: 'ro' | 'ru'): string {
  const url = new URL(path, SITE_URL);
  if (language === 'ru' && path !== '/ru') url.searchParams.set('lang', 'ru');
  return url.toString();
}

function catalogUrl(category: string, subcategory?: string, language: 'ro' | 'ru' = 'ro'): string {
  const url = new URL('/catalog', SITE_URL);
  url.searchParams.set('category', category);
  if (subcategory) url.searchParams.set('subcategory', subcategory);
  if (language === 'ru') url.searchParams.set('lang', 'ru');
  return url.toString();
}

function localizedEntries(
  roLoc: string,
  ruLoc: string,
  metadata: Omit<SitemapEntry, 'loc' | 'alternates'>,
): SitemapEntry[] {
  if (roLoc === ruLoc) return [{ ...metadata, loc: roLoc }];

  const alternates: SitemapEntry['alternates'] = [
    { hreflang: 'ro', href: roLoc },
    { hreflang: 'ru', href: ruLoc },
    { hreflang: 'x-default', href: roLoc },
  ];
  return [
    { ...metadata, loc: roLoc, alternates },
    { ...metadata, loc: ruLoc, alternates },
  ];
}

async function fetchAllRows<T>(table: string, select: string, filters: Record<string, string> = {}): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(from));
    Object.entries(filters).forEach(([key, value]) => url.searchParams.set(key, value));

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`${table} query failed: ${response.status}`);
    const page = await response.json() as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function renderEntry(entry: SitemapEntry): string {
  const lines = ['  <url>', `    <loc>${escapeXml(entry.loc)}</loc>`];
  entry.alternates?.forEach((alternate) => {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}" />`);
  });
  if (entry.lastmod) lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
  if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

export default async function handler(_req: unknown, res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  let dynamicEntries: SitemapEntry[] = [];

  try {
    const [products, categories, subcategories, brands] = await Promise.all([
      fetchAllRows<ProductRow>('products', 'id,name_ro,name_ru,sku,updated_at', { active: 'eq.true' }),
      fetchAllRows<CategoryRow>('categories', 'slug,active,created_at'),
      fetchAllRows<SubcategoryRow>('subcategories', 'category_slug,slug,created_at'),
      fetchAllRows<BrandRow>('brands', 'slug,active,created_at'),
    ]);

    const activeCategories = categories.filter((category) => category.slug && category.active !== false);
    const activeCategorySlugs = new Set(activeCategories.map((category) => category.slug));

    dynamicEntries = [
      ...activeCategories.flatMap((category) => localizedEntries(
        catalogUrl(category.slug, undefined, 'ro'),
        catalogUrl(category.slug, undefined, 'ru'),
        {
          lastmod: category.created_at,
          changefreq: 'weekly',
          priority: '0.8',
        },
      )),
      ...subcategories
        .filter((subcategory) => subcategory.slug && activeCategorySlugs.has(subcategory.category_slug))
        .flatMap((subcategory) => localizedEntries(
          catalogUrl(subcategory.category_slug, subcategory.slug, 'ro'),
          catalogUrl(subcategory.category_slug, subcategory.slug, 'ru'),
          {
            lastmod: subcategory.created_at,
            changefreq: 'weekly',
            priority: '0.7',
          },
        )),
      ...products
        .filter((product) => product.id && product.name_ro)
        .flatMap((product) => {
          const routeKey = String(product.id);
          const roSlug = slugify(product.name_ro || '') || 'produs';
          const ruSlug = slugify(product.name_ru || product.name_ro || '') || 'produs';
          return localizedEntries(
            absoluteUrl(`/product/${encodeURIComponent(roSlug)}/${encodeURIComponent(routeKey)}`),
            absoluteUrl(`/product/${encodeURIComponent(ruSlug)}/${encodeURIComponent(routeKey)}`),
            {
            lastmod: product.updated_at,
            changefreq: 'weekly',
            priority: '0.7',
            },
          );
        }),
      ...brands
        .filter((brand) => brand.slug && brand.active !== false)
        .flatMap((brand) => localizedEntries(
          localizedUrl(`/brands/${encodeURIComponent(brand.slug)}`, 'ro'),
          localizedUrl(`/brands/${encodeURIComponent(brand.slug)}`, 'ru'),
          {
            lastmod: brand.created_at,
            changefreq: 'weekly',
            priority: '0.6',
          },
        )),
    ];
  } catch (error) {
    console.error('[sitemap] failed to load dynamic entries', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).send('Failed to generate sitemap');
    return;
  }

  const entriesWithDuplicates = [
    ...STATIC_PAGES.flatMap((entry) => localizedEntries(
      localizedUrl(entry.path, 'ro'),
      entry.ruPath ? absoluteUrl(entry.ruPath) : localizedUrl(entry.path, 'ru'),
      { changefreq: entry.changefreq, priority: entry.priority },
    )),
    ...dynamicEntries,
  ];
  const entries = [...new Map(entriesWithDuplicates.map((entry) => [entry.loc, entry])).values()];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(renderEntry),
    '</urlset>',
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(body);
}

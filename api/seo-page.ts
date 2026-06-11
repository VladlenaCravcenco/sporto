const SITE_URL = 'https://www.sporto.md';
const SITE_NAME = 'Sporto';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-site.png`;
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

type Language = 'ro' | 'ru';
type QueryValue = string | string[] | undefined;
type ProductRow = {
  id: string;
  name_ro: string | null;
  name_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  sku: string | null;
  category: string;
  subcategory: string | null;
  brand: string | null;
  image_url: string | null;
};
type CategoryRow = {
  slug: string;
  name_ro: string;
  name_ru: string;
  description_ro: string | null;
  description_ru: string | null;
  active?: boolean;
};
type SubcategoryRow = {
  category_slug: string;
  slug: string;
  name_ro: string;
  name_ru: string;
};
type BrandRow = {
  slug: string;
  name: string;
  description_ro: string | null;
  description_ru: string | null;
  hero_image_url: string | null;
  banner_desktop_url: string | null;
  active?: boolean;
};

const STATIC_PAGES: Record<string, Record<Language, { title: string; description: string; heading: string }>> = {
  home: {
    ro: {
      title: 'Sporto — Echipamente Sportive Italiene & Fitness | Chișinău, Moldova',
      description: 'Sporto distribuie echipamente sportive și fitness profesionale din Italia și Europa pentru companii, instituții și clienți din Moldova.',
      heading: 'Echipamente sportive și fitness profesionale în Moldova',
    },
    ru: {
      title: 'Sporto — Итальянское спортивное оборудование | Кишинёв, Молдова',
      description: 'Sporto поставляет профессиональное спортивное и фитнес-оборудование из Италии и Европы компаниям, учреждениям и клиентам в Молдове.',
      heading: 'Профессиональное спортивное и фитнес-оборудование в Молдове',
    },
  },
  about: {
    ro: { title: 'Despre Sporto | Echipamente Sportive în Moldova', description: 'Aflați despre Sporto și soluțiile noastre pentru echiparea sălilor, cluburilor și instituțiilor din Moldova.', heading: 'Despre Sporto' },
    ru: { title: 'О компании Sporto | Спортивное оборудование в Молдове', description: 'Узнайте о Sporto и наших решениях для оснащения залов, клубов и учреждений в Молдове.', heading: 'О компании Sporto' },
  },
  contacts: {
    ro: { title: 'Contacte Sporto | Chișinău, Moldova', description: 'Contactați Sporto pentru echipamente sportive, oferte și consultanță profesională în Moldova.', heading: 'Contacte Sporto' },
    ru: { title: 'Контакты Sporto | Кишинёв, Молдова', description: 'Свяжитесь со Sporto по вопросам спортивного оборудования, предложений и профессиональных консультаций в Молдове.', heading: 'Контакты Sporto' },
  },
  'turnkey-solutions': {
    ro: { title: 'Soluții la Cheie pentru Săli Fitness | Sporto Moldova', description: 'Proiectare, selecție, livrare și instalare de echipamente pentru săli fitness și spații sportive.', heading: 'Soluții la cheie pentru săli fitness' },
    ru: { title: 'Оснащение фитнес-клубов под ключ | Sporto Молдова', description: 'Проектирование, подбор, доставка и установка оборудования для фитнес-клубов и спортивных пространств.', heading: 'Оснащение фитнес-клубов под ключ' },
  },
  'maintenance-service': {
    ro: { title: 'Service Echipamente Fitness | Sporto Moldova', description: 'Mentenanță și reparație profesională pentru echipamente sportive și fitness în Moldova.', heading: 'Service și mentenanță echipamente fitness' },
    ru: { title: 'Сервис фитнес-оборудования | Sporto Молдова', description: 'Профессиональное обслуживание и ремонт спортивного и фитнес-оборудования в Молдове.', heading: 'Сервис и обслуживание фитнес-оборудования' },
  },
  'terms-of-cooperation': {
    ro: { title: 'Condiții de Colaborare | Sporto', description: 'Condițiile de colaborare cu Sporto pentru clienți și parteneri.', heading: 'Condiții de colaborare' },
    ru: { title: 'Условия сотрудничества | Sporto', description: 'Условия сотрудничества со Sporto для клиентов и партнёров.', heading: 'Условия сотрудничества' },
  },
  'delivery-terms': {
    ro: { title: 'Condiții de Livrare | Sporto', description: 'Informații despre livrarea echipamentelor Sporto în Moldova.', heading: 'Condiții de livrare' },
    ru: { title: 'Условия доставки | Sporto', description: 'Информация о доставке оборудования Sporto по Молдове.', heading: 'Условия доставки' },
  },
  'privacy-policy': {
    ro: { title: 'Politica de Confidențialitate | Sporto', description: 'Politica de confidențialitate și prelucrare a datelor personale Sporto.', heading: 'Politica de confidențialitate' },
    ru: { title: 'Политика конфиденциальности | Sporto', description: 'Политика конфиденциальности и обработки персональных данных Sporto.', heading: 'Политика конфиденциальности' },
  },
};

function first(value: QueryValue): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeJsonForHtml(value: string): string {
  return value.replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function cleanText(value: string | null | undefined): string {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

function productPath(product: ProductRow, lang: Language): string {
  const name = lang === 'ru' ? product.name_ru || product.name_ro : product.name_ro || product.name_ru;
  return `/product/${encodeURIComponent(slugify(name || '') || 'produs')}/${encodeURIComponent(product.sku?.trim() || product.id)}`;
}

async function fetchRows<T>(table: string, select: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`${table} query failed: ${response.status}`);
  return response.json() as Promise<T[]>;
}

function localizedUrl(path: string, lang: Language): string {
  if (path === '/') return `${SITE_URL}${lang === 'ru' ? '/ru' : '/'}`;
  const url = new URL(path, SITE_URL);
  if (lang === 'ru') url.searchParams.set('lang', 'ru');
  else url.searchParams.delete('lang');
  return url.toString();
}

function renderHtml(input: {
  lang: Language;
  canonicalPath: string;
  title: string;
  description: string;
  heading: string;
  image?: string | null;
  body?: string;
  jsonLd?: object | object[];
}): string {
  const canonicalUrl = localizedUrl(input.canonicalPath, input.lang);
  const alternateRo = localizedUrl(input.canonicalPath, 'ro');
  const alternateRu = localizedUrl(input.canonicalPath, 'ru');
  const image = input.image || DEFAULT_OG_IMAGE;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SPORTOSFERA S.R.L.',
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_OG_IMAGE,
    },
    ...(input.jsonLd ? (Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd]) : []),
  ];

  return `<!DOCTYPE html>
<html lang="${input.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
    <meta name="description" content="${escapeHtml(input.description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" hreflang="ro" href="${escapeHtml(alternateRo)}" />
    <link rel="alternate" hreflang="ru" href="${escapeHtml(alternateRu)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(alternateRo)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(input.title)}" />
    <meta property="og:description" content="${escapeHtml(input.description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(input.title)}" />
    <meta name="twitter:description" content="${escapeHtml(input.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${escapeJsonForHtml(JSON.stringify(schemas))}</script>
  </head>
  <body>
    <header><a href="${SITE_URL}/">Sporto</a></header>
    <main>
      <h1>${escapeHtml(input.heading)}</h1>
      <p>${escapeHtml(input.description)}</p>
      ${input.body || ''}
    </main>
  </body>
</html>`;
}

async function buildCatalog(query: Record<string, QueryValue>, lang: Language) {
  const categorySlug = first(query.category);
  const subcategorySlug = first(query.subcategory);
  const brand = first(query.brand);
  const [categories, subcategories, products] = await Promise.all([
    categorySlug
      ? fetchRows<CategoryRow>('categories', 'slug,name_ro,name_ru,description_ro,description_ru,active', { slug: `eq.${categorySlug}`, limit: '1' })
      : Promise.resolve([]),
    categorySlug && subcategorySlug
      ? fetchRows<SubcategoryRow>('subcategories', 'category_slug,slug,name_ro,name_ru', { category_slug: `eq.${categorySlug}`, slug: `eq.${subcategorySlug}`, limit: '1' })
      : Promise.resolve([]),
    fetchRows<ProductRow>('products', 'id,name_ro,name_ru,description_ro,description_ru,sku,category,subcategory,brand,image_url', {
      active: 'eq.true',
      ...(categorySlug ? { category: `eq.${categorySlug}` } : {}),
      ...(subcategorySlug ? { subcategory: `eq.${subcategorySlug}` } : {}),
      ...(brand ? { brand: `eq.${brand}` } : {}),
      limit: '100',
      order: 'name_ro.asc',
    }),
  ]);

  const category = categories[0];
  const subcategory = subcategories[0];
  const categoryName = category ? (lang === 'ru' ? category.name_ru : category.name_ro) : '';
  const subcategoryName = subcategory ? (lang === 'ru' ? subcategory.name_ru : subcategory.name_ro) : '';
  const heading = subcategoryName || categoryName || (lang === 'ru' ? 'Каталог спортивного оборудования' : 'Catalog echipamente sportive');
  const description = cleanText(
    category && (lang === 'ru' ? category.description_ru || category.description_ro : category.description_ro || category.description_ru),
  ) || (lang === 'ru'
    ? `${heading}: товары, цены и профессиональные решения Sporto в Молдове.`
    : `${heading}: produse, prețuri și soluții profesionale Sporto în Moldova.`);
  const canonical = new URL('/catalog', SITE_URL);
  if (categorySlug) canonical.searchParams.set('category', categorySlug);
  if (subcategorySlug) canonical.searchParams.set('subcategory', subcategorySlug);
  if (brand) canonical.searchParams.set('brand', brand);
  const canonicalPath = `${canonical.pathname}${canonical.search}`;
  const productLinks = products.map((product) => {
    const name = cleanText(lang === 'ru' ? product.name_ru || product.name_ro : product.name_ro || product.name_ru);
    return `<li><a href="${escapeHtml(productPath(product, lang))}">${escapeHtml(name)}</a></li>`;
  }).join('');

  return renderHtml({
    lang,
    canonicalPath,
    title: `${heading} | Sporto Moldova`,
    description,
    heading,
    body: productLinks ? `<section><h2>${lang === 'ru' ? 'Товары' : 'Produse'}</h2><ul>${productLinks}</ul></section>` : '',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description,
      url: localizedUrl(canonicalPath, lang),
    },
  });
}

async function buildBrand(query: Record<string, QueryValue>, lang: Language) {
  const slug = first(query.brand);
  const brands = await fetchRows<BrandRow>('brands', '*', {
    slug: `eq.${slug}`,
    limit: '1',
  });
  const brand = brands.find((row) => row.active !== false);
  if (!brand) return null;
  const products = await fetchRows<ProductRow>('products', 'id,name_ro,name_ru,description_ro,description_ru,sku,category,subcategory,brand,image_url', {
    active: 'eq.true',
    brand: `eq.${brand.name}`,
    limit: '100',
    order: 'name_ro.asc',
  });
  const heading = `${brand.name} — ${lang === 'ru' ? 'спортивное оборудование' : 'echipamente sportive'}`;
  const description = cleanText(lang === 'ru' ? brand.description_ru || brand.description_ro : brand.description_ro || brand.description_ru)
    || (lang === 'ru' ? `Продукция ${brand.name} в Молдове от Sporto.` : `Produse ${brand.name} disponibile în Moldova prin Sporto.`);
  const links = products.map((product) => {
    const name = cleanText(lang === 'ru' ? product.name_ru || product.name_ro : product.name_ro || product.name_ru);
    return `<li><a href="${escapeHtml(productPath(product, lang))}">${escapeHtml(name)}</a></li>`;
  }).join('');

  return renderHtml({
    lang,
    canonicalPath: `/brands/${encodeURIComponent(brand.slug)}`,
    title: `${heading} | Sporto Moldova`,
    description,
    heading,
    image: brand.hero_image_url || brand.banner_desktop_url,
    body: links ? `<section><h2>${lang === 'ru' ? 'Товары бренда' : 'Produsele brandului'}</h2><ul>${links}</ul></section>` : '',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Brand',
      name: brand.name,
      description,
      url: localizedUrl(`/brands/${encodeURIComponent(brand.slug)}`, lang),
    },
  });
}

export default async function handler(req: { query?: Record<string, QueryValue> }, res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const query = req.query || {};
  const page = first(query.page) || 'home';
  const lang: Language = first(query.lang) === 'ru' ? 'ru' : 'ro';

  try {
    let html: string | null;
    if (page === 'catalog') html = await buildCatalog(query, lang);
    else if (page === 'brand') html = await buildBrand(query, lang);
    else {
      const meta = STATIC_PAGES[page]?.[lang] || STATIC_PAGES.home[lang];
      const canonicalPath = page === 'home' ? '/' : `/${page}`;
      html = renderHtml({
        lang,
        canonicalPath,
        ...meta,
        body: `<nav><a href="/catalog">${lang === 'ru' ? 'Каталог' : 'Catalog'}</a> <a href="/about">${lang === 'ru' ? 'О компании' : 'Despre noi'}</a> <a href="/contacts">${lang === 'ru' ? 'Контакты' : 'Contacte'}</a></nav>`,
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Vary', 'User-Agent');
    res.status(html ? 200 : 404).send(html || renderHtml({
      lang,
      canonicalPath: '/',
      title: '404 | Sporto',
      description: lang === 'ru' ? 'Страница не найдена.' : 'Pagina nu a fost găsită.',
      heading: '404',
    }));
  } catch (error) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).send(error instanceof Error ? error.message : 'SEO page generation failed');
  }
}

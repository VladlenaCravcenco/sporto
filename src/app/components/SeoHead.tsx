import { useEffect } from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  lang?: 'ro' | 'ru';
  noIndex?: boolean;
  /** Extra JSON-LD schema objects to inject alongside the base Organization/WebSite schemas */
  jsonLd?: object | object[];
}

const SITE_NAME    = 'Sporto';               // городское / торговое название
const LEGAL_NAME   = 'SPORTOSFERA S.R.L.';   // юридическое название
const SITE_URL     = 'https://www.sporto.md';
const DEFAULT_OG   = `${SITE_URL}/og-image.jpg`;

// ── Base JSON-LD schemas injected on every page ───────────────────────────────
const BASE_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: LEGAL_NAME,
    alternateName: SITE_NAME,           // «Sporto» — по этому имени знают в городе
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    foundingDate: '2023',
    description:
      'Sporto (SPORTOSFERA S.R.L.) — distribuitor B2B/B2C/B2G de echipamente sportive și fitness din Italia și Europa în Moldova. Fondată în 2023, Chișinău.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chișinău',
      addressCountry: 'MD',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      areaServed: 'MD',
      availableLanguage: ['Romanian', 'Russian'],
    },
    knowsAbout: [
      'Echipamente sportive italiene',
      'Aparate fitness profesionale',
      'Echipamente pentru săli de sport',
      'Тренажёры итальянские',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${SITE_NAME} — ${LEGAL_NAME}`,
    url: SITE_URL,
    inLanguage: ['ro', 'ru'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
];

const DEFAULT_SEO: Record<'ro' | 'ru', { title: string; description: string; keywords: string }> = {
  ro: {
    title: 'Sporto — Echipamente Sportive Italiene & Fitness | Chișinău, Moldova',
    description:
      'Sporto (SPORTOSFERA S.R.L.) — distribuitor B2B, B2C și B2G de echipamente sportive și fitness din Italia și Europa în Moldova. Fondată în 2023 în Chișinău. Aparate cardio, forță, greutăți, echipamente profesionale pentru cluburi și instituții.',
    keywords:
      'Sporto, Sporto Chisinau, echipament sportiv italian Moldova, aparate fitness italiene Chisinau, SPORTOSFERA, distribuitor sport angro Moldova, echipament fitness profesional, aparate sala fitness, echipament sport B2B, echipamente sportive angro, fitness club echipament italian',
  },
  ru: {
    title: 'Sporto — Итальянское спортивное оборудование & Fitness | Кишинёв, Молдова',
    description:
      'Sporto (SPORTOSFERA S.R.L.) — дистрибьютор B2B, B2C и B2G итальянского и европейского спортивного и фитнес-оборудования в Молдове. Основана в 2023 году в Кишинёве. Кардио, силовые тренажёры, гантели, профессиональное оборудование для клубов и учреждений.',
    keywords:
      'Sporto, Sporto Кишинёв, итальянское спортивное оборудование Молдова, тренажёры итальянские Кишинёв, SPORTOSFERA, спортивный инвентарь оптом, фитнес оборудование из Италии, тренажёры для фитнес клуба, Sporto Moldova',
  },
};

export function SeoHead({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  lang = 'ro',
  noIndex = false,
  jsonLd,
}: SeoHeadProps) {
  const defaults   = DEFAULT_SEO[lang];
  const finalTitle = title       || defaults.title;
  const finalDesc  = description || defaults.description;
  const finalKw    = keywords    || defaults.keywords;
  const finalOg    = ogImage     || DEFAULT_OG;
  const pageUrl    = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────────
    document.title = finalTitle;
    document.documentElement.lang = lang;

    // ── Helper: upsert <meta> ──────────────────────────────────────────────
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.includes('[name')     ? 'name'
                   : selector.includes('[property') ? 'property'
                   : 'name';
        const val = selector.match(/["']([^"']+)["']/)?.[1] || '';
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ── Helper: upsert <link> ──────────────────────────────────────────────
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // ── Standard meta ──────────────────────────────────────────────────────
    setMeta('meta[name="description"]',   finalDesc);
    setMeta('meta[name="keywords"]',      finalKw);
    setMeta('meta[name="robots"]',        noIndex ? 'noindex,nofollow' : 'index,follow');
    setMeta('meta[name="author"]',        `${SITE_NAME} / ${LEGAL_NAME}`);
    setMeta('meta[name="geo.region"]',    'MD');
    setMeta('meta[name="geo.placename"]', 'Chișinău, Moldova');

    // ── Open Graph ─────────────────────────────────────────────────────────
    setMeta('meta[property="og:title"]',         finalTitle);
    setMeta('meta[property="og:description"]',   finalDesc);
    setMeta('meta[property="og:image"]',         finalOg);
    setMeta('meta[property="og:url"]',           pageUrl);
    setMeta('meta[property="og:type"]',          'website');
    setMeta('meta[property="og:site_name"]',     SITE_NAME);
    setMeta('meta[property="og:locale"]',        lang === 'ro' ? 'ro_MD' : 'ru_MD');
    setMeta('meta[property="og:locale:alternate"]', lang === 'ro' ? 'ru_MD' : 'ro_MD');

    // ── Twitter / X Card ───────────────────────────────────────────────────
    setMeta('meta[name="twitter:card"]',        'summary_large_image');
    setMeta('meta[name="twitter:title"]',       finalTitle);
    setMeta('meta[name="twitter:description"]', finalDesc);
    setMeta('meta[name="twitter:image"]',       finalOg);

    // ── Canonical ──────────────────────────────────────────────────────────
    if (canonical) setLink('canonical', pageUrl);

    // ── JSON-LD Structured Data ────────────────────────────────────────────
    // Remove existing injected scripts to avoid duplicates on navigation
    document.querySelectorAll('script[data-seohead]').forEach(el => el.remove());

    const schemas = [
      ...BASE_JSON_LD,
      ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
    ];

    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seohead', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seohead]').forEach(el => el.remove());
    };
  }, [finalTitle, finalDesc, finalKw, canonical, finalOg, lang, noIndex, pageUrl, jsonLd]);

  return null;
}

// ── Page-specific SEO configs ─────────────────────────────────────────────────

export const SEO_PAGES = {
  home: {
    ro: {
      title: 'Sporto — Echipamente Sportive Italiene & Fitness | Chișinău Moldova',
      description:
        'Sporto (SPORTOSFERA S.R.L.) — distribuitor B2B, B2C și B2G de echipamente sportive și fitness din Italia și Europa. Fondată în 2023 în Chișinău. Aparate cardio, forță, greutăți, soluții la cheie pentru cluburi, școli și instituții. Prețuri wholesale, livrare în toată Moldova.',
      keywords:
        'Sporto, Sporto Chisinau, echipament sportiv italian Moldova, aparate fitness italiene, SPORTOSFERA, distribuitor sport angro, aparate sala fitness Chisinau, echipament club fitness, sport B2B Moldova, aparate cardio italian, greutati profesionale, sala de sport utilaj Chisinau 2023',
    },
    ru: {
      title: 'Sporto — Итальянское спортивное оборудование & Fitness | Кишинёв Молдова',
      description:
        'Sporto (SPORTOSFERA S.R.L.) — дистрибьютор B2B, B2C и B2G итальянского и европейского спортивного и фитнес-оборудования. Основана в 2023 году в Кишинёве. Кардио, силовые тренажёры, гантели, решения под ключ для клубов, школ и учреждений. Оптовые цены, доставка по всей Молдове.',
      keywords:
        'Sporto, Sporto Кишинёв, итальянские тренажёры Молдова, спортивное оборудование из Италии, SPORTOSFERA, оптом спорт Молдова, фитнес клуб оборудование итальянское, кардио тренажёры итальянские, силовые тренажёры Кишинёв',
    },
  },
  catalog: {
    ro: {
      title: 'Catalog Echipamente Sportive Italiene & Fitness | Sporto Moldova',
      description:
        'Catalog complet Sporto — echipamente sportive și fitness din Italia și Europa în Moldova. Aparate cardio, forță, greutăți, arte marțiale, sport colectiv, înot. Prețuri angro B2B/B2C/B2G pentru companii și instituții.',
      keywords:
        'catalog echipament sportiv italian, aparate fitness italiene catalog Moldova, Sporto catalog, achizitii echipament sport, sport angro catalog Chisinau, aparate cardio italiene lista, echipamente fitness profesionale italiene',
    },
    ru: {
      title: 'Каталог итальянского спортивного оборудования | Sporto Молдова',
      description:
        'Полный каталог Sporto — итальянское и европейское спортивное и фитнес-оборудование в Молдове. Кардио и силовые тренажёры, гантели, единоборства, командный спорт, плавание. Оптовые цены B2B/B2C/B2G для компаний и учреждений.',
      keywords:
        'каталог итальянское спортивное оборудование, тренажёры из Италии Молдова, Sporto каталог, купить фитнес оборудование итальянское, спорт оптом Молдова',
    },
  },
  turnkey: {
    ro: {
      title: 'Soluții Cheie în Mână Săli Fitness cu Echipament Italian | Sporto Moldova',
      description:
        'Sporto proiectează și echipează la cheie cluburi fitness, săli de sport, hoteluri și instituții din Moldova cu echipamente italiene și europene. Consultanță, selecție, instalare, instruire personal. Solicită proiect gratuit.',
      keywords:
        'sala fitness la cheie Moldova echipament italian, echipare club fitness italiana, Sporto turnkey, proiectare sala sport Moldova, solutii fitness complete italiene, amenajare sala fitness Chisinau',
    },
    ru: {
      title: 'Оснащение фитнес-клубов под ключ итальянским оборудованием | Sporto Молдова',
      description:
        'Sporto проектирует и оснащает фитнес-клубы, спортзалы, гостиницы и учреждения в Молдове итальянским и европейским оборудованием. Консультация, подбор, монтаж, обучение. Запросите бесплатный проект.',
      keywords:
        'фитнес клуб под ключ итальянское оборудование Молдова, Sporto оснащение спортзала, проектирование фитнес центра итальянское, комплексное оснащение Кишинёв',
    },
  },
  maintenance: {
    ro: {
      title: 'Service & Mentenanță Echipamente Fitness Italiene | Sporto Moldova',
      description:
        'Sporto oferă servicii profesionale de mentenanță și reparație echipamente fitness și sportive italiene în Moldova. Contracte de service, inspecții periodice, piese originale. Timp de răspuns sub 4 ore în Chișinău.',
      keywords:
        'service echipament fitness italian Moldova, reparatii aparate fitness italiene Chisinau, Sporto mentenanta, mentenanta sala sport, contract service fitness italian',
    },
    ru: {
      title: 'Сервис и обслуживание итальянского фитнес-оборудования | Sporto Молдова',
      description:
        'Sporto — профессиональное техническое обслуживание и ремонт итальянского спортивного и фитнес-оборудования в Молдове. Сервисные контракты, осмотры, оригинальные запчасти. Время отклика менее 4 часов в Кишинёве.',
      keywords:
        'сервис итальянское фитнес оборудование Молдова, ремонт тренажёров итальянских Кишинёв, Sporto сервис, обслуживание спортзал, сервисный контракт тренажёры итальянские',
    },
  },
  contacts: {
    ro: {
      title: 'Contacte Sporto (SPORTOSFERA S.R.L.) | Chișinău, Moldova',
      description:
        'Contactați Sporto (SPORTOSFERA S.R.L.) — distribuitor B2B/B2C/B2G echipamente sportive italiene în Moldova. Sediu: Chișinău. Program: Lun–Vin 9:00–18:00. Solicitați ofertă personalizată.',
      keywords:
        'Sporto contacte Chisinau, SPORTOSFERA contacte, distribuitor echipament sportiv italian Moldova adresa, echipament fitness contact Chisinau, Sporto program',
    },
    ru: {
      title: 'Контакты Sporto (SPORTOSFERA S.R.L.) | Кишинёв, Молдова',
      description:
        'Свяжитесь со Sporto (SPORTOSFERA S.R.L.) — дистрибьютор B2B/B2C/B2G итальянского спортивного оборудования в Молдове. Офис: Кишинёв. Режим работы: Пн–Пт 9:00–18:00. Запросите персональное предложение.',
      keywords:
        'Sporto контакты Кишинёв, SPORTOSFERA контакты, дистрибьютор итальянское спортивное оборудование Молдова, фитнес оборудование контакт Кишинёв, Sporto режим работы',
    },
  },
  about: {
    ro: {
      title: 'Despre Sporto (SPORTOSFERA S.R.L.) | Echipamente Italiene, Moldova 2023',
      description:
        'Sporto (SPORTOSFERA S.R.L.) fondată în 2023 în Chișinău. Distribuitor B2C, B2B și B2G de echipamente sportive și fitness din Italia și Europa. Abordare individuală, prețuri competitive, soluții pentru cluburi, școli și instituții din Moldova.',
      keywords:
        'despre Sporto, SPORTOSFERA despre noi, distribuitor sport italian Moldova 2023, companie echipament fitness italian Chisinau, B2B B2C B2G sport Moldova',
    },
    ru: {
      title: 'О Sporto (SPORTOSFERA S.R.L.) | Итальянское оборудование, Молдова 2023',
      description:
        'Sporto (SPORTOSFERA S.R.L.) основана в 2023 году в Кишинёве. Дистрибьютор B2C, B2B и B2G итальянского и европейского спортивного и фитнес-оборудования. Индивидуальный подход, конкурентные цены, решения для клубов, школ и учреждений Молдовы.',
      keywords:
        'о компании Sporto, SPORTOSFERA о нас, дистрибьютор итальянское спорт Молдова 2023, компания фитнес оборудование итальянское Кишинёв, B2B B2C B2G спорт Молдова',
    },
  },
  delivery: {
    ro: {
      title: 'Condiții de Livrare | Sporto (SPORTOSFERA S.R.L.) Moldova',
      description:
        'Condiții și termeni de livrare a echipamentelor sportive italiene și europene în Republica Moldova. Livrare în toată țara, ambalaj protector, asamblare la fața locului.',
      keywords:
        'livrare echipament sportiv italian Moldova, termeni livrare Sporto, transport utilaj fitness Chisinau, SPORTOSFERA livrare',
    },
    ru: {
      title: 'Условия доставки | Sporto (SPORTOSFERA S.R.L.) Молдова',
      description:
        'Условия и сроки доставки итальянского и европейского спортивного оборудования по Республике Молдова. Доставка по всей стране, защитная упаковка, сборка на месте.',
      keywords:
        'доставка итальянское спортивное оборудование Молдова, условия доставки Sporto, транспорт фитнес оборудование Кишинёв, SPORTOSFERA доставка',
    },
  },
  terms: {
    ro: {
      title: 'Condiții de Colaborare B2B/B2C/B2G | Sporto (SPORTOSFERA S.R.L.)',
      description:
        'Termeni și condiții de colaborare B2B, B2C și B2G cu Sporto (SPORTOSFERA S.R.L.). Prețuri wholesale, plată, returnare și garanție pentru companii, magazine și instituții.',
      keywords:
        'conditii colaborare B2B Sporto Moldova, termeni angro echipament fitness italian, parteneriat SPORTOSFERA, conditii B2C B2G Sporto',
    },
    ru: {
      title: 'Условия сотрудничества B2B/B2C/B2G | Sporto (SPORTOSFERA S.R.L.)',
      description:
        'Условия сотрудничества B2B, B2C и B2G со Sporto (SPORTOSFERA S.R.L.). Оптовые цены, оплата, возврат и гарантия для компаний, магазинов и учреждений.',
      keywords:
        'условия сотрудничества B2B Sporto Молдова, оптовые условия итальянское фитнес оборудование, партнёрство SPORTOSFERA, условия B2C B2G Sporto',
    },
  },
  privacy: {
    ro: {
      title: 'Politica de Confidențialitate | Sporto (SPORTOSFERA S.R.L.)',
      description:
        'Politica de confidențialitate și prelucrare a datelor cu caracter personal pe platforma B2B/B2C Sporto (SPORTOSFERA S.R.L.), Chișinău, Moldova.',
      keywords:
        'politica confidentialitate Sporto, SPORTOSFERA GDPR Moldova, date personale sport Moldova',
    },
    ru: {
      title: 'Политика конфиденциальности | Sporto (SPORTOSFERA S.R.L.)',
      description:
        'Политика конфиденциальности и обработки персональных данных на платформе B2B/B2C Sporto (SPORTOSFERA S.R.L.), Кишинёв, Молдова.',
      keywords:
        'политика конфиденциальности Sporto, SPORTOSFERA GDPR Молдова, персональные данные спорт Молдова',
    },
  },
};

// ── Product page JSON-LD builder ──────────────────────────────────────────────
export function buildProductJsonLd(product: {
  id: string;
  name: { ro: string; ru: string };
  description: { ro: string; ru: string };
  price: number;
  image: string;
  sku?: string;
  brand?: string;
  availability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.ro,
    description: product.description.ro || product.description.ru,
    image: product.image || DEFAULT_OG,
    sku: product.sku,
    url: `${SITE_URL}/product/${product.id}`,
    ...(product.brand && {
      brand: { '@type': 'Brand', name: product.brand },
    }),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MDL',
      availability: product.availability || 'https://schema.org/InStock',
      url: `${SITE_URL}/product/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: LEGAL_NAME,
        alternateName: SITE_NAME,
      },
    },
  };
}

// ── Breadcrumb JSON-LD builder ────────────────────────────────────────────────
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── LocalBusiness JSON-LD (for Contacts page) ─────────────────────────────────
export const LOCAL_BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: LEGAL_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  image: DEFAULT_OG,
  foundingDate: '2023',
  description:
    'Sporto (SPORTOSFERA S.R.L.) — distribuitor B2B, B2C și B2G de echipamente sportive și fitness din Italia și Europa în Moldova.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Chișinău',
    addressCountry: 'MD',
    addressRegion: 'Chișinău',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 47.0105,
    longitude: 28.8638,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Moldova',
  },
  priceRange: '$$',
  knowsAbout: [
    'Echipamente sportive italiene',
    'Aparate fitness profesionale din Italia',
    'Итальянские тренажёры',
    'B2B sport wholesale Moldova',
  ],
};

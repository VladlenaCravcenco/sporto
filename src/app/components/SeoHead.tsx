import { Helmet } from 'react-helmet-async';

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

function withLangQuery(path: string, lang: 'ro' | 'ru') {
  const url = new URL(`${SITE_URL}${path}`);
  url.searchParams.set('lang', lang);
  return url.toString();
}

function buildCanonicalUrl(path: string) {
  const url = new URL(path, SITE_URL);
  url.search = '';
  url.hash = '';
  return url.toString();
}

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
  const pagePath   = canonical || '/';
  const canonicalUrl = buildCanonicalUrl(pagePath);
  const pageUrl    = withLangQuery(pagePath, lang);
  const alternateRo = withLangQuery(pagePath, 'ro');
  const alternateRu = withLangQuery(pagePath, 'ru');

  // Combine base schemas with any additional ones
  const allJsonLd = [...BASE_JSON_LD];
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      allJsonLd.push(...jsonLd);
    } else {
      allJsonLd.push(jsonLd);
    }
  }

  return (
    <Helmet
      htmlAttributes={{ lang }}
      title={finalTitle}
      meta={[
        { name: 'description', content: finalDesc },
        { name: 'keywords', content: finalKw },
        { name: 'robots', content: noIndex ? 'noindex,nofollow' : 'index,follow' },

        // Open Graph
        { property: 'og:title', content: finalTitle },
        { property: 'og:description', content: finalDesc },
        { property: 'og:image', content: finalOg },
        { property: 'og:url', content: pageUrl },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: SITE_NAME },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: finalTitle },
        { name: 'twitter:description', content: finalDesc },
        { name: 'twitter:image', content: finalOg },
      ]}
      link={[
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', href: alternateRo, hrefLang: 'ro' },
        { rel: 'alternate', href: alternateRu, hrefLang: 'ru' },
      ]}
      script={[
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(allJsonLd),
        },
      ]}
    />
  );
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
  image?: string;
  images?: string[];
  sku?: string;
  brand?: string;
  availability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  url?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  review?: Array<{
    author: string;
    reviewBody: string;
    reviewRating?: {
      ratingValue: number;
      bestRating?: number;
      worstRating?: number;
    };
    datePublished?: string;
  }>;
}) {
  const productUrl = buildCanonicalUrl(product.url || `/product/${product.id}`);
  const productDescription =
    product.description.ro ||
    product.description.ru ||
    `Echipament sportiv disponibil la comandă prin ${SITE_NAME}.`;
  const productBrand = product.brand || SITE_NAME;
  const productImages = [...new Set([...(product.images || []), product.image || DEFAULT_OG].filter(Boolean))];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.ro,
    image: productImages,
    description: productDescription,
    sku: product.sku,
    url: productUrl,
    brand: { '@type': 'Brand', name: productBrand },
    ...(product.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.reviewCount,
        ...(product.aggregateRating.bestRating && { bestRating: product.aggregateRating.bestRating }),
        ...(product.aggregateRating.worstRating && { worstRating: product.aggregateRating.worstRating }),
      },
    }),
    ...(product.review?.length && {
      review: product.review.map((item) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: item.author,
        },
        reviewBody: item.reviewBody,
        ...(item.datePublished && { datePublished: item.datePublished }),
        ...(item.reviewRating && {
          reviewRating: {
            '@type': 'Rating',
            ratingValue: item.reviewRating.ratingValue,
            ...(item.reviewRating.bestRating && { bestRating: item.reviewRating.bestRating }),
            ...(item.reviewRating.worstRating && { worstRating: item.reviewRating.worstRating }),
          },
        }),
      })),
    }),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MDL',
      availability: product.availability || 'https://schema.org/InStock',
      url: productUrl,
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

export function buildFaqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
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

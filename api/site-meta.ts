const SITE_URL = 'https://www.sporto.md';
const SITE_NAME = 'Sporto';
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`;

type SiteLanguage = 'ro' | 'ru';

const SITE_META: Record<SiteLanguage, { title: string; description: string }> = {
  ro: {
    title: 'Sporto — Echipamente Sportive Italiene & Fitness | Chișinău, Moldova',
    description:
      'Sporto (SPORTOSFERA S.R.L.) fondată în 2023 în Chișinău. Distribuitor B2C, B2B și B2G de echipamente sportive și fitness din Italia și Europa.',
  },
  ru: {
    title: 'Sporto — Итальянское спортивное оборудование & Fitness | Кишинёв, Молдова',
    description:
      'Sporto (SPORTOSFERA S.R.L.) основана в 2023 году в Кишинёве. Дистрибьютор B2C, B2B и B2G итальянского и европейского спортивного и фитнес-оборудования.',
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveLanguage(rawLang: string | undefined): SiteLanguage {
  return rawLang === 'ru' ? 'ru' : 'ro';
}

export default function handler(req: { query?: { lang?: string | string[] } }, res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (body: string) => void };
}) {
  const rawLang = Array.isArray(req.query?.lang) ? req.query?.lang[0] : req.query?.lang;
  const lang = resolveLanguage(rawLang);
  const meta = SITE_META[lang];
  const pageUrl = new URL(SITE_URL);
  pageUrl.searchParams.set('lang', lang);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <link rel="canonical" href="${SITE_URL}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:url" content="${escapeHtml(pageUrl.toString())}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
  </head>
  <body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(html);
}

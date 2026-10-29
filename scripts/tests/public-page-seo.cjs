const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText)(exports, name => {
    if (!(name in deps)) throw Error('Unexpected dependency ' + name);
    return deps[name];
  });
  return exports;
}
const navigation = {
  notFound() { throw Error('404'); },
  redirect(url) { throw Error('307:' + url); },
  permanentRedirect(url) { throw Error('308:' + url); },
};
const pageSeo = load('app/_lib/page-seo.ts');
const content = load('app/[lang]/[...slug]/page.tsx', {
  'react/jsx-runtime': {}, 'next/navigation': navigation, '../../_components/PublicContentPage': {},
  '../../_lib/page-seo': pageSeo, '../../_lib/public-page-data': {},
});
let catalogStatus = 'ready', requests = [];
const getBrand = async slug => slug === 'hms' ? { name: 'HMS', slug } : null;
const getFilteredCatalog = async (query, page, sort, lang) => {
  requests.push({ query, page, sort, lang });
  return { status: page > 2 ? 'out-of-range' : catalogStatus, totalProducts: 25, totalPages: 2, products: [] };
};
const preflight = load('app/_lib/public-route-preflight.ts', {
  'next/navigation': navigation, './brand-data': { getBrand },
  './catalog-seo': { getCategoryLanding: async query => ({ invalid: query.category === 'unknown' }) },
  './catalog-filter-data': { getFilteredCatalog }, './public-page-data': { getPublicPageData: async () => ({ content: {} }) },
  './product-data': { getProductDetail: async id => id === 'missing' ? null : {product:{id:'product-id'}} },
  './product-url': { productPath: (p,lang) => `/${lang}/product/canonical/${p.id}`, productSlug: () => 'canonical' },
});
(async () => {
  for (const route of Object.keys(pageSeo.contentSeo)) for (const lang of ['ro', 'ru']) {
    const meta = await content.generateMetadata({ params: Promise.resolve({ lang, slug: [route] }) });
    assert.equal(meta.alternates.canonical, `${pageSeo.siteUrl}/${lang}/${route}`);
    assert.equal(meta.alternates.languages.ro, `${pageSeo.siteUrl}/ro/${route}`);
    assert.equal(meta.alternates.languages.ru, `${pageSeo.siteUrl}/ru/${route}`);
    assert.ok(meta.title.length > 10 && meta.description.length > 30);
    assert.equal(meta.openGraph.url, meta.alternates.canonical);
  }
  assert.equal((await content.generateMetadata({ params: Promise.resolve({ lang: 'ru', slug: ['order-request'] }) })).robots.index, false);
  await assert.rejects(preflight.validatePublicRoute('/ru/product/old/9918', '', 'ru'), /308:\/ru\/product\/canonical\/product-id/);
  await assert.rejects(preflight.validatePublicRoute('/ru/product/product-id', '', 'ru'), /308:/);
  await assert.rejects(preflight.validatePublicRoute('/ro/product/old/missing', '', 'ro'), /404/);
  await preflight.validatePublicRoute('/ru/product/canonical/product-id', '', 'ru');
  await assert.rejects(preflight.validatePublicRoute('/ru/brands/missing', '', 'ru'), /404/);
  assert.equal(requests.length, 0, 'Unknown brands must not request a product listing');
  await assert.rejects(preflight.validatePublicRoute('/ru/catalog', '?category=unknown', 'ru'), /404/);
  await assert.rejects(preflight.validatePublicRoute('/ru/brands/hms', '?page=3', 'ru'), /404/);
  await preflight.validatePublicRoute('/ru/brands/hms', '?page=2&brand=other', 'ru');
  assert.equal(requests.at(-1).query.brand, 'HMS', 'Brand query must not override route identity');
  await assert.rejects(preflight.validatePublicRoute('/ru/catalog', '?page=1&category=cardio', 'ru'), /308:\/ru\/catalog\?category=cardio/);
  await assert.rejects(preflight.validatePublicRoute('/ru/catalog', '?page=0', 'ru'), /307:/);
  catalogStatus = 'error';
  await assert.rejects(preflight.validatePublicRoute('/ru/catalog', '', 'ru'), /unavailable/);

  // The initial published content must win over global caches and must not trigger a client fetch.
  let initial = { content: { turnkey: { hero_title: { ru: 'Опубликованный заголовок' } }, maintenance: { hero_title: { ru: 'Опубликованный сервис' } }, 'legal:terms': { title_ro: 'Termeni', title_ru: 'Условия', content_ro: '<p>RO</p>', content_ru: '<p>RU</p>' } } };
  const effects = [];
  const react = { useState: value => [typeof value === 'function' ? value() : value, () => {}], useEffect: fn => effects.push(fn) };
  const hookDeps = { react, '../../lib/supabase': { supabase: { from() { throw Error('Unexpected browser fetch'); } } }, '../contexts/PublicPageData': { usePublicPageData: () => initial } };
  const turnkey = load('src/app/pages/turnkeyContent.ts', hookDeps);
  turnkey.invalidateCache({ hero_title: { ru: 'STALE' } });
  assert.equal(turnkey.useTurnkeyContent().hero_title.ru, 'Опубликованный заголовок');
  assert.ok(turnkey.useTurnkeyContent().hero_title.ro, 'Partial translations preserve defaults');
  initial.content.turnkey.hero_sub = { ru: 'Ответим в течение 24 часов' };
  initial.content.turnkey.services = [{ num: '03', title: { ro: 'Test', ru: 'Тест' }, body: { ru: 'Подбор из каталога 8 000+ товаров, оптовые цены, прямая доставка со склада.' } }];
  initial.content.turnkey.stats = [{ n: { ru: '15+' }, label: { ru: 'Поставщиков' } }];
  assert.equal(turnkey.useTurnkeyContent().hero_sub.ru, 'Детали обсудим индивидуально');
  assert.ok(!turnkey.useTurnkeyContent().services[0].body.ru.includes('8 000'));
  const maintenance = load('src/app/pages/maintenanceContent.ts', hookDeps);
  assert.equal(maintenance.useMaintenanceContent().hero_title.ru, 'Опубликованный сервис');
  const legal = load('src/app/hooks/usePageContent.ts', hookDeps);
  assert.equal(legal.usePageContent('terms').content_ru, '<p>RU</p>');
  for (const effect of effects) effect();
  console.log('PASS: localized content metadata, noindex cart, early 404/308, route-bound brand identity, database failures, request-scoped published content and translation defaults.');
})().catch(error => { console.error(error); process.exitCode = 1; });

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('exports', 'require', js)(exports, name => {
    if (!(name in deps)) throw Error('Unexpected dependency ' + name);
    return deps[name];
  });
  return exports;
}
const urls = load('app/_lib/product-url.ts', { '../../src/app/lib/product-url': load('src/app/lib/product-url.ts') });
assert.equal(urls.productPath({ id: '42', name_ro: 'Forță & Sport', name_ru: 'Мяч для игры' }, 'ru'), '/ru/product/myach-dlya-igry/42');
assert.equal(urls.productPath({ id: '42', name_ro: 'Forță & Sport', name_ru: null }, 'ro'), '/ro/product/forta-si-sport/42');
const metadata = load('app/[lang]/catalog/page.tsx', {
  'react/jsx-runtime': {}, '../../_components/CategoryGuide': {}, '../../_components/CatalogScrollRestoration': {}, '../../_lib/product-url': urls, '../../_components/CatalogLink': {},
  '../../_components/CatalogSortControl': {}, '../../_components/CatalogFilters': {}, '../../_lib/catalog-filter-data': { getFilteredCatalog: async () => ({status:'ready', totalProducts: 42}) },
  '../../_lib/page-seo': load('app/_lib/page-seo.ts'),
  '../../_lib/catalog-seo': load('app/_lib/catalog-seo.ts', { './category-guides': load('app/_lib/category-guides.ts'), react: {cache: fn => fn}, './catalog-data': {getCatalogNavigationForSeo: async () => [{id:'cardio',name:{ro:'Cardio',ru:'Кардио'},description:{ro:'',ru:''},subcategories:[{id:'treadmills',name:{ro:'Benzi',ru:'Дорожки'}}]}]} }),
  '../../../src/app/components/ProductCardView': {}, 'lucide-react': {}, 'next/navigation': {},
});
(async () => {
  const get = query => metadata.generateMetadata({ params: Promise.resolve({ lang: 'ru' }), searchParams: Promise.resolve(query) });
  const paged = await get({ page: '2' });
  assert.match(paged.alternates.canonical, /\/ru\/catalog\?page=2$/);
  assert.equal(paged.robots.index, true);
  assert.ok(!paged.title.includes('SPORTO'));
  const filtered = await get({ category: 'cardio', page: '2', sort: 'price-asc' });
  assert.equal(filtered.robots.index, true);
  assert.match(filtered.title, /Кардио/);
  assert.equal((await get({category:'cardio', brand:'HMS'})).robots.index, false);
  assert.equal((await get({category:['cardio','other']})).robots.index, false);
  assert.equal((await get({category:'cardio',subcategory:'unknown'})).robots.index, false);
  assert.equal((await get({search:'gantere'})).robots.index, false);
  assert.match((await get({category:'cardio',subcategory:'treadmills'})).title,/Дорожки/);
  assert.match(filtered.alternates.canonical, /category=cardio&page=2$/);
  assert.match(filtered.alternates.languages.ro, /\/ro\/catalog\?category=cardio&page=2$/);
  let ranges = [];
  const fixture = index => ({ id: String(index), name_ro: 'Forță & Sport', name_ru: 'Мяч', updated_at: '2026-10-08T00:00:00Z', category:'cardio',subcategory:'treadmills',brand:'HMS' });
  const chain = { select() { return this; }, eq() { return this; }, order() { return this; }, async range(from, to) {
    ranges.push([from, to]); return { error: null, data: from === 0 ? Array.from({ length: 1000 }, (_, i) => fixture(i)) : [fixture(1000)] };
  } };
  let placementRows = [];
  const sitemap = load('app/_lib/sitemap-data.ts', {
    '@supabase/supabase-js': { createClient: () => ({ from: table => table === 'products' ? chain : {select(){return this},eq(){return this},order(){return this},async range(){return {error:null,data:table==='categories'?[{slug:'cardio'},{slug:'empty'}]:table==='subcategories'?[{category_slug:'cardio',slug:'treadmills'},{category_slug:'cardio',slug:'empty'}]:[{name:'HMS',slug:'hms'},{name:'Empty',slug:'empty'}]}}} }) },
    './product-category-links': { readProductCategoryLinks: async () => placementRows },
    './supabase-env': { getSupabasePublicConfig: () => ({ url: 'fixture', key: 'fixture' }) },
    './product-url': urls,
    './public-rows': load('app/_lib/public-rows.ts'),
  });
  const entries = await sitemap.default();
  const xml = load('app/_lib/sitemap-xml.ts').sitemapXml(entries);
  assert.ok(xml.includes('category=cardio&amp;subcategory=treadmills'));
  assert.ok(!xml.includes('category=cardio&subcategory=treadmills'));
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  assert.match(load('app/_lib/sitemap-xml.ts').sitemapXml([{url:'https://example.com/?q=<x>"',alternates:{languages:{ro:'https://example.com/?a=1&b=2'}}}]), /&lt;x&gt;&quot;/);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  assert.equal(entries.length, 18 + 2002 + 6);
  assert.ok(entries.some(entry => entry.url.endsWith('/ru/brands/hms')));
  assert.ok(entries.some(entry => entry.url.endsWith('/ro/catalog?category=cardio&subcategory=treadmills')));
  assert.ok(!entries.some(entry => entry.url.includes('empty')));
  assert.ok(entries.some(entry => entry.url.endsWith('/ru/product/myach/1000')));
  assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length);
  placementRows = [{product_id:'0',category:'empty',subcategory:''}];
  const linkedEntries = await sitemap.default();
  assert.equal(linkedEntries.length,entries.length+2);
  assert.ok(linkedEntries.some(entry=>entry.url.endsWith('/ru/catalog?category=empty')));
  assert.equal(linkedEntries.filter(entry=>entry.url.includes('/product/')).length,2002);
  // The layout must receive the locale on the request, including after cookie refresh.
  let forwarded;
  const proxy = load('proxy.ts', {
    './app/_lib/legacy-redirects': load('app/_lib/legacy-redirects.ts'),
    'next/server': { NextResponse: { next: options => { forwarded = options.request.headers; return { headers: new Headers(), cookies: { set() {} } }; } } },
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: { getUser: async () => { options.cookies.setAll([{ name: 'session', value: 'fresh', options: {} }]); } } }) },
  });
  for (const lang of ['ru', 'ro']) {
    const headers = new Headers();
    await proxy.proxy({ headers, nextUrl: { pathname: `/${lang}/catalog` }, cookies: { getAll: () => [], set: () => headers.set('cookie', 'session=fresh') } });
    assert.equal(forwarded.get('x-sporto-locale'), lang);
  }
  console.log('PASS: localized product URLs, pagination canonical, filtered noindex, title, forwarded HTML locale, sitemap pagination beyond 1000 products.');
})().catch(error => { console.error(error); process.exitCode = 1; });

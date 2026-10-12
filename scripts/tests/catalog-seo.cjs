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
  'react/jsx-runtime': {}, '../../_lib/product-url': urls, '../../_components/CatalogLink': {},
  '../../_components/CatalogSortControl': {}, '../../_components/CatalogFilters': {}, '../../_lib/catalog-filter-data': {},
  '../../../src/app/components/ProductCardView': {}, 'lucide-react': {}, 'next/navigation': {},
});
(async () => {
  const get = query => metadata.generateMetadata({ params: Promise.resolve({ lang: 'ru' }), searchParams: Promise.resolve(query) });
  const paged = await get({ page: '2' });
  assert.match(paged.alternates.canonical, /\/ru\/catalog\?page=2$/);
  assert.equal(paged.robots, undefined);
  assert.ok(!paged.title.includes('SPORTO'));
  const filtered = await get({ category: 'cardio', page: '2', sort: 'price-asc' });
  assert.equal(filtered.robots.index, false);
  assert.match(filtered.alternates.canonical, /category=cardio&page=2$/);
  assert.match(filtered.alternates.languages.ro, /\/ro\/catalog\?category=cardio&page=2$/);
  let ranges = [];
  const fixture = index => ({ id: String(index), name_ro: 'Forță & Sport', name_ru: 'Мяч', updated_at: '2026-10-08T00:00:00Z' });
  const chain = { select() { return this; }, eq() { return this; }, order() { return this; }, async range(from, to) {
    ranges.push([from, to]); return { error: null, data: from === 0 ? Array.from({ length: 1000 }, (_, i) => fixture(i)) : [fixture(1000)] };
  } };
  const sitemap = load('app/sitemap.ts', {
    '@supabase/supabase-js': { createClient: () => ({ from: () => chain }) },
    './_lib/supabase-env': { getSupabasePublicConfig: () => ({ url: 'fixture', key: 'fixture' }) },
    './_lib/product-url': urls,
  });
  const entries = await sitemap.default();
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  assert.equal(entries.length, 18 + 2002);
  assert.ok(entries.some(entry => entry.url.endsWith('/ru/product/myach/1000')));
  assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length);
  // The layout must receive the locale on the request, including after cookie refresh.
  let forwarded;
  const proxy = load('proxy.ts', {
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

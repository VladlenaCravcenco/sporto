const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies, clock = Date) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('exports', 'require', 'Date', source)(exports, name => {
    assert.ok(name in dependencies, 'Unexpected dependency: ' + name);
    return dependencies[name];
  }, clock);
  return exports;
}
function fixture() {
  let now = 0;
  const requests = [];
  const state = {
    configured: true, error: '',
    categories: [{ slug: 'live-category', name_ro: 'Categorie', name_ru: null, description_ro: 'Descriere' }],
    subcategories: [{ category_slug: 'live-category', slug: 'live-child', name_ro: 'Subcategorie', name_ru: null }],
  };
  const publicCache = load('app/_lib/public-cache.ts', {}, { now: () => now });
  const data = load('app/_lib/catalog-data.ts', {
    './public-cache': publicCache,
    '@supabase/supabase-js': { createClient: () => ({ from(table) {
      return { table, select() { return this; }, eq() { return this; }, order() { return this; } };
    } }) },
    '../../src/app/data/products': { categories: [{ id: 'fallback', name: { ro: 'Fallback', ru: 'Fallback' }, description: {}, subcategories: [] }] },
    './product-category-links': { readProductCategoryLinks: async () => [] },
    './supabase-env': { getSupabasePublicConfig: () => state.configured ? { url: 'mock', key: 'mock' } : null },
    './public-rows': { readPublicRows: async query => {
      requests.push(query.table);
      await Promise.resolve();
      if (state.error === query.table) throw Error('Database unavailable');
      return state[query.table];
    } },
  });
  return { data, state, requests, expire() { now += 30_001; } };
}
(async () => {
  const f = fixture();
  const [seo, menu] = await Promise.all([f.data.getCatalogNavigationForSeo(), f.data.getCatalogNavigation(), f.data.getCatalogNavigation()]);
  assert.deepEqual(f.requests, ['categories', 'subcategories'], 'Concurrent consumers share one database load');
  assert.strictEqual(seo, menu);
  assert.equal(seo[0].name.ru, 'Categorie');
  assert.equal(seo[0].subcategories[0].name.ru, 'Subcategorie');
  await f.data.getCatalogNavigationForSeo();
  await f.data.getCatalogNavigation();
  assert.equal(f.requests.length, 2, 'Both consumers reuse the successful cache');
  f.expire();
  f.state.categories = [];
  const [empty, fallback] = await Promise.all([f.data.getCatalogNavigationForSeo(), f.data.getCatalogNavigation()]);
  assert.deepEqual(empty, [], 'Empty published categories must stay empty for SEO');
  assert.equal(fallback[0].id, 'fallback');
  assert.equal(f.requests.length, 4, 'Expired cache refreshes only once');
  for (const table of ['categories', 'subcategories']) {
    const failed = fixture();
    failed.state.error = table;
    const result = await Promise.allSettled([failed.data.getCatalogNavigationForSeo(), failed.data.getCatalogNavigation()]);
    assert.equal(result[0].status, 'rejected', 'SEO must reject incomplete database snapshots');
    assert.equal(result[1].status, 'fulfilled');
    assert.equal(result[1].value[0].id, table === 'categories' ? 'fallback' : 'live-category');
    if (table === 'subcategories') assert.deepEqual(result[1].value[0].subcategories, []);
    assert.equal(failed.requests.length, 2);
    failed.state.error = '';
    assert.equal((await failed.data.getCatalogNavigationForSeo())[0].id, 'live-category');
    assert.equal(failed.requests.length, 4, 'Failure/fallback is not cached; recovery is immediate');
  }
  const missing = fixture();
  missing.state.configured = false;
  await assert.rejects(missing.data.getCatalogNavigationForSeo());
  assert.equal((await missing.data.getCatalogNavigation())[0].id, 'fallback');
  assert.equal(missing.requests.length, 0);
  console.log('PASS: shared in-flight load and TTL, translations, empty categories, strict SEO errors, menu fallback, immediate recovery and missing configuration. Database mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let product;
const exportsObject = {};
const source = ts.transpileModule(fs.readFileSync('app/[lang]/product/[slug]/[sku]/page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
new Function('exports', 'require', source)(exportsObject, name => {
  if (name.endsWith('/product-data')) return { getProductDetail: async () => product ? { product } : null };
  if (name.endsWith('/product-url')) return { productPath: (p, lang) => `/${lang}/product/test/${p.id}` };
  return {};
});
(async () => {
  for (const lang of ['ro', 'ru']) {
    const get = () => exportsObject.generateMetadata({ params: Promise.resolve({ lang, slug: 'test', sku: '42' }) });
    product = { id: '42', name_ro: 'Produs', name_ru: 'Товар', seo_description_ro: ' ', seo_description_ru: '', description_ro: null, description_ru: null };
    const fallback = await get();
    assert.ok(fallback.description.includes(lang === 'ro' ? 'Produs' : 'Товар'));
    assert.ok(fallback.description.length > 20 && fallback.description.length <= 160);
    assert.equal(fallback.openGraph.description, fallback.description);
    assert.match(fallback.alternates.canonical, new RegExp(`/${lang}/product/test/42$`));
    product.seo_description_ro = 'Descriere SEO'; product.seo_description_ru = 'Описание SEO';
    assert.equal((await get()).description, lang === 'ro' ? 'Descriere SEO' : 'Описание SEO');
    product.seo_description_ro = null; product.seo_description_ru = null;
    product.description_ro = 'Descriere produs'; product.description_ru = 'Описание товара';
    assert.equal((await get()).description, lang === 'ro' ? 'Descriere produs' : 'Описание товара');
    product = null; assert.deepEqual(await get(), {});
  }
  console.log('PASS: RO/RU empty product descriptions receive metadata fallback; explicit SEO/product copy preserved, canonical and Open Graph retained; absent products remain absent.');
})().catch(error => { console.error(error); process.exitCode = 1; });

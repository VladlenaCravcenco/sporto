const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('exports', 'require', source)(exports, name => name in dependencies ? dependencies[name] : require(name));
  return exports;
}
const legacy = load('src/app/lib/category-icons.tsx', {
  '../components/icons/YinYang': load('src/app/components/icons/YinYang.tsx'),
  '../components/icons/TableTennis': load('src/app/components/icons/TableTennis.tsx'),
});
const { getCategoryIconData } = load('app/_lib/category-icon-data.ts', {
  'server-only': {}, '../../src/app/lib/category-icons': legacy,
});
const categories = ['LucideDumbbell', 'LucideTowerControl', 'yinYang', 'tableTennis', 'sporto', 'unknown', undefined]
  .map((icon, i) => ({ id: 'category-' + i, icon }));
const icons = getCategoryIconData(categories);
assert.deepEqual(Object.keys(icons), categories.map(c => c.id));
for (const category of categories) {
  const expected = legacy.getCategoryIcon(category.icon);
  assert.equal(renderToStaticMarkup(React.createElement('span', null, icons[category.id])),
    renderToStaticMarkup(React.createElement('span', null, expected)), 'Chosen icons retain their exact SVG, including uncommon admin choices');
}
assert.equal(icons['category-5'], null);
assert.equal(icons['category-6'], null);
const { ServicesBentoView } = load('src/app/components/ServicesBentoView.tsx');
for (const language of ['ro', 'ru']) {
  const html = renderToStaticMarkup(React.createElement(ServicesBentoView, { language, basePath: '/' + language }));
  const images = html.match(/<img[^>]*>/g);
  assert.equal(images.length, 2);
  for (const image of images) {
    assert.match(image, /loading="lazy"/);
    assert.match(image, /decoding="async"/);
    assert.match(image, /srcSet="/);
    assert.match(image, /auto=format/);
    assert.ok(!image.includes('fm=jpg'));
    assert.match(image, /sizes="/);
    assert.match(image, /width="1080"/);
  }
  assert.ok(html.includes('/' + language + '/maintenance-service'));
  assert.ok(html.includes('/' + language + '/turnkey-solutions'));
}
console.log('PASS: server-rendered category SVG parity, arbitrary admin icon choices and unknown fallback; lazy responsive service images and RO/RU links.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const calls = [];
const router = { push: url => calls.push(['push', url]), replace: url => calls.push(['replace', url]) };
const jsx = (type, props) => ({ type, props });
function load(file, deps) {
  const exports = {};
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText)(exports, name => {
    if (!(name in deps)) throw Error(name); return deps[name];
  });
  return exports;
}
const deps = {
  react: { useMemo: fn => fn() }, 'react/jsx-runtime': { jsx, jsxs: jsx },
  'next/navigation': { useRouter: () => router },
  'react-router': { Router: 'Router', createPath: to => to.pathname + (to.search || '') },
  '../../src/app/components/SearchDropdown': { SearchDropdown: 'Dropdown' },
  '../../src/app/contexts/LanguageContext': { LanguageProvider: 'Language' },
  '../../src/app/contexts/CategoriesContext': { CategoriesProvider: 'Categories' },
  '../../src/app/contexts/CartContext': { CartProvider: 'Cart' },
};
const Panel = load('app/_components/SearchPanel.tsx', deps).default;
function find(tree, type) {
  if (!tree) return;
  if (tree.type === type) return tree;
  for (const child of [tree.props?.children].flat()) { const result = find(child, type); if (result) return result; }
}
const nav = find(Panel({ language: 'ru', query: '999', onQueryChange() {}, onSelect() {} }), 'Router').props.navigator;
nav.push('/catalog?search=999');
nav.replace({ pathname: '/product/test/42' });
nav.push('/ro/catalog');
assert.deepEqual(calls, [['push', '/ru/catalog?search=999'], ['replace', '/ru/product/test/42'], ['push', '/ro/catalog']]);
const Link = load('app/_components/CatalogLink.tsx', { 'react/jsx-runtime': { jsx }, 'next/link': { default: 'NextLink' }, './catalog-scroll': { saveCatalogPosition() {} } }).CatalogLink;
const link = Link({ href: '/ru/catalog', children: 'Catalog' });
assert.equal(link.props.href, '/ru/catalog');
assert.equal(link.props.prefetch, false);
console.log('PASS: search selection uses Next router, keeps locale/query; catalog links disable bulk prefetch.');

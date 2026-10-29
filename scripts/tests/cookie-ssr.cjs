const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const out = {};
new Function('require', 'exports', ts.transpileModule(fs.readFileSync('app/_components/CookieConsent.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 }
}).outputText)(require, out);
for (const language of ['ro', 'ru']) {
  const render = initialConsent => renderToStaticMarkup(React.createElement(out.CookieConsent, { language, initialConsent }));
  assert.ok(render(null).includes('role="dialog"'));
  assert.ok(render(null).includes(language === 'ru' ? 'Мы используем' : 'Folosim cookie'));
  assert.equal(render('accepted'), '');
  assert.equal(render('declined'), '');
}
console.log('PASS: cookie notice rendered server-side in both languages; saved accept/decline respected without browser globals.');

const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
let language = 'ru';
const exportsObject = {};
const source = fs.readFileSync('src/app/components/AdminEditorSection.tsx', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
new Function('exports','require', code)(exportsObject, name => {
  if (name === 'react') return { ...React, useId: () => 'field-id' };
  if (name === './AdminEditorWorkspace') return { useContentLanguage: () => language };
  return require(name);
});
const value = { ru: 'Русский текст', ro: 'Text român' };
let changed;
for (const lang of ['ru','ro']) {
  language = lang;
  const rendered = exportsObject.AdminBilingualField({ label:'Заголовок', value, onChange: next => { changed = next; } });
  const [label, input] = rendered.props.children;
  assert.equal(input.props.value, value[lang]);
  assert.equal(label.props.htmlFor, input.props.id);
  input.props.onChange({ target: { value: 'Updated' } });
  assert.equal(changed[lang], 'Updated');
  assert.equal(changed[lang === 'ru' ? 'ro' : 'ru'], value[lang === 'ru' ? 'ro' : 'ru']);
}
assert.deepEqual(value, {ru:'Русский текст',ro:'Text român'});
const context = {};
vm.runInNewContext(fs.readFileSync('.next/server/app/admin/(protected)/[section]/page_client-reference-manifest.js','utf8'), context);
const manifest = Object.values(context.__RSC_MANIFEST)[0];
const css = Object.entries(manifest.entryCSSFiles).find(([key]) => key.endsWith('/app/admin/layout'))?.[1];
assert.ok(css?.length, 'admin CSS must be attached to server layout, not just a dynamic client chunk');
const contents = css.map(entry => fs.readFileSync('.next/' + entry.path, 'utf8')).join('\n');
assert.ok(contents.includes('.admin-edit-section') && contents.includes('.admin-theme-switch'));
console.log('PASS: language-specific edits preserve the other translation; controls have labels; admin CSS is present in the route manifest.');

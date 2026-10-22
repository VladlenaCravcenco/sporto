const fs = require('node:fs'), ts = require('typescript'), assert = require('node:assert/strict');
let state = 0;
const ref = { current: null };
const out = {};
new Function('require', 'exports', ts.transpileModule(fs.readFileSync('app/_components/ProductGallery.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
}).outputText)(name => {
  if (name === 'react') return { useState: () => [state, value => { state = value; }], useRef: () => ref };
  if (name === 'lucide-react') return { ChevronLeft: 'left', ChevronRight: 'right', Package: 'empty' };
  if (name.endsWith('StoreImage')) return { StoreImage: 'image' };
  return require(name);
}, out);
const images = Array.from({ length: 8 }, (_, i) => `/photo-${i}.jpg`);
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
const render = (photos = images) => out.ProductGallery({ images: photos, name: 'Товар', language: 'ru' });
const find = (tree, label) => nodes(tree).find(n => n.props?.['aria-label'] === label);
assert.equal(nodes(render()).filter(n => n.props?.['aria-pressed'] !== undefined).length, 8);
find(render(), 'Фото 8').props.onClick(); assert.equal(state, 7);
assert.equal(nodes(render()).find(n => n.props?.variant === 'detail').props.src, images[7]);
find(render(), 'Следующее фото').props.onClick(); assert.equal(state, 0);
find(render(), 'Предыдущее фото').props.onClick(); assert.equal(state, 7);
render().props.onKeyDown({ key: 'ArrowLeft', preventDefault() {} }); assert.equal(state, 6);
let area = nodes(render()).find(n => n.props?.onTouchStart);
area.props.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
area.props.onTouchEnd({ changedTouches: [{ clientX: 20, clientY: 105 }] }); assert.equal(state, 7);
area = nodes(render()).find(n => n.props?.onTouchStart);
area.props.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] });
area.props.onTouchEnd({ changedTouches: [{ clientX: 90, clientY: 200 }] }); assert.equal(state, 7);
assert.equal(nodes(render([])).filter(n => n.type === 'button').length, 0);
assert.equal(nodes(render([images[0]])).filter(n => n.type === 'button').length, 0);
console.log('PASS: all 8 images, selection, arrow wrap, keyboard, horizontal swipe, vertical scrolling, empty/single gallery. Handler tests; not browser rendering.');

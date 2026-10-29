const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('app/(auth)/callback/page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

async function callback(values, signedIn = true, repeatEffect = false) {
  const stored = new Map(Object.entries(values));
  const destinations = [];
  const errors = [];
  let effect;
  const exports = {};
  const dependencies = {
    'react/jsx-runtime': { jsx() {} },
    react: { useRef(initial) { return { current: initial }; }, useEffect(fn) { effect = fn; }, useState(initial) { return [initial, value => { if (typeof value === 'string') errors.push(value); }]; } },
    'next/navigation': { useRouter: () => ({ replace: path => destinations.push(path) }) },
    '@/lib/supabase/client': { createClient: () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'test-user' } : null }, error: signedIn ? null : new Error('Invalid session') }) } }) },
  };
  const storage = { getItem: key => stored.get(key), removeItem: key => stored.delete(key) };
  new Function('exports', 'require', 'sessionStorage', source)(exports, name => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  }, storage);
  exports.default();
  effect();
  if (repeatEffect) effect();
  await new Promise(resolve => setImmediate(resolve));
  return { destinations, errors, stored };
}

(async () => {
  let result = await callback({ 'sporto:auth-return': '/ru/about?section=faq#questions' });
  assert.deepEqual(result.destinations, ['/ru/about?section=faq#questions']);
  assert.equal(result.stored.has('sporto:auth-return'), false);
  assert.deepEqual((await callback({ 'sporto:auth-return': '/ru/about' }, true, true)).destinations, ['/ru/about'], 'Repeated effect must redirect once to the original page');
  for (const unsafe of ['https://evil.example', '//evil.example', '/ru\\evil.example', 'javascript:alert(1)']) {
    assert.deepEqual((await callback({ 'sporto:auth-return': unsafe })).destinations, ['/ro/order-request']);
  }
  result = await callback({ 'sporto:checkout-return': '/ru/order-request', 'sporto:auth-return': '/ru/about', 'sporto:checkout-draft': '{"name":"test"}' });
  assert.deepEqual(result.destinations, ['/ru/order-request']);
  assert.equal(result.stored.get('sporto:checkout-draft'), '{"name":"test"}');
  assert.deepEqual((await callback({ 'sporto:checkout-return': '/ro/order-request' }, false)).destinations, ['/ro/order-request?auth_error=1']);
  result = await callback({ 'sporto:auth-return': '/ru/about' }, false);
  assert.deepEqual(result.destinations, []);
  assert.ok(result.errors.length);
  console.log('PASS: OAuth return page, unsafe destinations rejected, checkout priority and draft retained, failed login handled. Auth calls mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });

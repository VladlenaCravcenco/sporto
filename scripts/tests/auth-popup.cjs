const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('app/_components/AccountPopup.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
async function signIn({ blockedStorage = false, failedOAuth = false } = {}) {
  const exports = {};
  const updates = [];
  const requests = [];
  let stateIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: {
      useEffect() {}, useRef: () => ({ current: null }),
      useState(initial) { const index = stateIndex++; return [index === 0 ? false : initial, value => updates.push({ index, value })]; },
    },
    '../../src/app/hooks/useCustomerSession': { useCustomerSession: () => ({ user: null, name: '', loading: false }) },
    '../../lib/supabase/client': { createClient: () => ({ auth: {
      signInWithOAuth: async options => { requests.push(options); return { error: failedOAuth ? new Error('Provider unavailable') : null }; },
    } }) },
  };
  const storage = {
    removeItem() { if (blockedStorage) throw Error('Storage blocked'); },
    setItem() { if (blockedStorage) throw Error('Storage blocked'); },
  };
  const window = { location: { origin: 'https://www.sporto.md', pathname: '/ru/about', search: '', hash: '' }, dispatchEvent() {} };
  new Function('exports', 'require', 'sessionStorage', 'window', source)(exports, name => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  }, storage, window);
  const root = exports.default({ language: 'ru', onClose() {} });
  function find(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (node.type === 'button' && node.props.children === 'Продолжить с Google') return node;
    return find(node.props?.children);
  }
  const button = find(root);
  assert.ok(button, 'Google login remains available');
  await button.props.onClick();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].provider, 'google');
  assert.equal(requests[0].options.redirectTo, 'https://www.sporto.md/callback');
  return updates;
}
(async () => {
  await signIn();
  await signIn({ blockedStorage: true });
  const updates = await signIn({ failedOAuth: true });
  assert.ok(updates.some(update => update.index === 0 && update.value === false), 'Failed OAuth enables retry');
  assert.ok(updates.some(update => update.index === 1 && update.value.includes('Google')), 'Failure is shown to the user');
  console.log('PASS: Google popup starts OAuth, blocked optional storage does not prevent login, provider failure enables retry. Auth mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });

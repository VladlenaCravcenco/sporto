const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(file, dependencies, globals = {}) {
  const output = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('exports', 'require', ...Object.keys(globals), js)(output, name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }, ...Object.values(globals));
  return output;
}
let user = null;
let upstreamCalls = [];
let signedIn = 0;
const env = { NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key', ADMIN_EMAIL: ' ADMIN@example.test ' };
const client = { auth: {
  getUser: async () => ({ data: { user } }),
  getSession: async () => ({ data: { session: user ? { access_token: 'verified-user-token' } : null } }),
  signInWithPassword: async ({ email }) => { signedIn++; return { data: { user: { email }, session: {} }, error: null }; },
  signOut: async () => {},
} };
const server = load('lib/auth/server.ts', { '../supabase/server': { createClient: async () => client } }, { process: { env } });
const route = load('app/api/admin/supabase/[...path]/route.ts', {
  '@/lib/auth/server': server,
  '@/lib/supabase/server': { createClient: async () => client },
}, { process: { env }, fetch: async (url, init) => {
  upstreamCalls.push({ url: String(url), ...init });
  return new Response('[{"id":"saved"}]', { status: 200, headers: { 'content-type': 'application/json', 'content-range': '0-0/1' } });
} });
const action = load('lib/admin/auth-actions.ts', {
  '@/lib/auth/server': server,
  '@/lib/supabase/server': { createClient: async () => client },
});
const context = path => ({ params: Promise.resolve({ path: path || ['rest', 'v1', 'products'] }) });
const request = (method = 'GET', origin = 'http://217.26.149.55', body) => new Request('http://217.26.149.55/api/admin/supabase/rest/v1/products?id=eq.test', {
  method, headers: { origin, 'content-type': 'application/json', authorization: 'Bearer attacker', apikey: 'attacker', prefer: 'return=representation' }, body,
});
(async () => {
  assert.equal(await server.getAdminUser(), null);
  assert.equal((await route.GET(request(), context())).status, 403);
  user = { email: 'customer@example.test' };
  assert.equal((await route.PATCH(request('PATCH', undefined, '{}'), context())).status, 403);
  assert.equal(upstreamCalls.length, 0);
  assert.ok((await action.signInAdmin('customer@example.test', 'test')).error);
  assert.equal(signedIn, 0);
  user = { email: 'ADMIN@example.test' };
  assert.ok(await server.getAdminUser());
  assert.equal((await route.POST(request('POST', 'https://evil.example', '{}'), context())).status, 403);
  assert.equal((await route.GET(request(), context(['rest', 'v1', '..']))).status, 400);
  assert.equal((await route.GET(request(), context(['auth', 'v1', 'admin']))).status, 400);
  assert.equal(upstreamCalls.length, 0);
  const response = await route.PATCH(request('PATCH', undefined, '{"price":10}'), context());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-range'), '0-0/1');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const call = upstreamCalls[0];
  assert.equal(call.url, 'https://db.example.test/rest/v1/products?id=eq.test');
  assert.equal(call.headers.get('authorization'), 'Bearer verified-user-token');
  assert.equal(call.headers.get('apikey'), 'public-key');
  assert.equal(new TextDecoder().decode(call.body), '{"price":10}');
  const upload = new Request('http://217.26.149.55/api/admin/supabase/storage/v1/object/product-images/test.webp', { method:'POST', headers:{origin:'http://217.26.149.55','content-type':'image/webp','x-upsert':'true'},body:new Uint8Array([1,2,3]) });
  assert.equal((await route.POST(upload, context(['storage','v1','object','product-images','test.webp']))).status, 200);
  assert.deepEqual([...upstreamCalls[1].body], [1,2,3]);
  assert.equal(upstreamCalls[1].headers.get('x-upsert'), 'true');
  assert.ok((await action.signInAdmin(' admin@example.test ', 'test')).success);
  assert.equal(signedIn, 1);
  delete env.ADMIN_EMAIL;
  assert.equal(await server.getAdminUser(), null);
  assert.ok((await action.signInAdmin('admin@example.test', 'test')).error);
  assert.equal(signedIn, 1);
  console.log('PASS: anonymous/customer denied; missing admin identity fails closed; admin login; cross-origin writes denied; path validation; user-token RLS; JSON and upload forwarding. No live writes.');
})().catch(e => { console.error(e); process.exitCode = 1; });

// The reused editors must send data calls through the gateway while keeping
// public reads and OAuth on their original endpoints.
(async () => {
  const calls = [];
  const window = { location: { pathname: '/admin/products', origin: 'http://217.26.149.55' } };
  const { adminTransport } = load('src/lib/admin-transport.ts', {}, {
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.test' } }, window,
    fetch: async (url, init) => { calls.push({ url, init }); return new Response('{}'); },
  });
  await adminTransport('https://db.example.test/rest/v1/products?select=*', { headers: { authorization: 'Bearer browser', apikey: 'public', prefer: 'count=exact' } });
  assert.equal(calls[0].url, '/api/admin/supabase/rest/v1/products?select=*');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.headers.has('authorization'), false);
  assert.equal(calls[0].init.headers.get('prefer'), 'count=exact');
  await adminTransport('https://db.example.test/auth/v1/user');
  assert.equal(calls[1].url, 'https://db.example.test/auth/v1/user');
  window.location.pathname = '/ru/catalog';
  await adminTransport('https://db.example.test/rest/v1/products');
  assert.equal(calls[2].url, 'https://db.example.test/rest/v1/products');
  console.log('PASS: admin transport uses same-origin cookies; public reads and Auth endpoints preserved.');
})().catch(e => { console.error(e); process.exitCode = 1; });

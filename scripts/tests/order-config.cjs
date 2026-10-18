const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sporto-order-config-'));
const command = path.resolve('scripts/check-order-config.cjs');
function run(values, args = []) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/SUPABASE|EMAILJS|ADMIN_EMAIL|ORDER_EMAIL|RESEND/.test(key)) delete env[key];
  Object.assign(env, values);
  const result = spawnSync(process.execPath, [command, ...args], { cwd: directory, env, encoding: 'utf8' });
  assert.ok(result.stdout);return { ...result, report: JSON.parse(result.stdout) };
}
try {
  assert.equal(run({}).status, 1);
  const secret = 'TEST_SERVER_KEY_NOT_FOR_OUTPUT';
  const base = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: secret };
  const ready = run(base);assert.equal(ready.status, 0);assert.equal(ready.report.orderStorageConfigured, true);
  assert.equal(ready.report.emailConfigured, false);assert.ok(!ready.stdout.includes(secret));
  assert.equal(run(base, ['--require-email']).status, 1);
  const resend = run({...base, ORDER_EMAIL_PROVIDER:'resend',RESEND_API_KEY:'re_TEST_SECRET',ORDER_EMAIL_FROM:'orders@example.invalid',ORDER_ADMIN_EMAIL:'admin@example.invalid'},['--require-email']);
  assert.equal(resend.status,0);assert.equal(resend.report.emailConfigured,true);assert.ok(!resend.stdout.includes('re_TEST_SECRET'));assert.ok(!resend.stdout.includes('orders@example.invalid'));
  assert.equal(run({ SUPABASE_URL: 'https://example.invalid', SUPABASE_SECRET_KEY: 'sb_secret_TEST_NOT_FOR_OUTPUT' }).status, 0);
  assert.equal(run({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_test' }).status, 1);
  const anon = 'header.' + Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url') + '.signature';
  assert.equal(run({ ...base, SUPABASE_SERVICE_ROLE_KEY: anon }).status, 1);
  const email = { VITE_EMAILJS_SERVICE_ID: 'service', VITE_EMAILJS_PUBLIC_KEY: 'public', EMAILJS_TEMPLATE_ORDER_CONFIRMATION: 'client', VITE_EMAILJS_TEMPLATE_ADMIN: 'admin', VITE_ADMIN_EMAIL: 'test@example.invalid' };
  const complete = run({ ...base, ...email }, ['--require-email']);assert.equal(complete.status, 0);assert.equal(complete.report.emailConfigured, true);assert.ok(!complete.stdout.includes('test@example.invalid'));
  fs.writeFileSync(path.join(directory, '.env.local'), 'NEXT_PUBLIC_SUPABASE_URL=https://example.invalid\nSUPABASE_SERVICE_ROLE_KEY='+secret+'\n');
  assert.equal(run({}).report.orderStorageConfigured, true);
  console.log('PASS: missing configuration blocks deploy, server secret is not printed, public/anon keys rejected, email fallbacks and strict email mode, dotenv loading.');
} finally { fs.rmSync(directory, { recursive: true, force: true }); }

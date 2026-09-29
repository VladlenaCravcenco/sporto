// Read-only deploy preflight. Runs with the same public key as the application.
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
(async () => {
  if (!url || !key) throw Error('Supabase public configuration is missing');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const spec = { raw: ['insportline'], synonyms: [], concepts: [] };
  const requests = [
    ['sporto_search_v1', { spec, locale: 'ro' }, 8],
    ['sporto_catalog_search_v1', { filters: { searchSpec: spec }, page_number: 1, sort_order: 'recommended', locale: 'ru' }, 24],
  ];
  for (const [name, args, limit] of requests) {
    const { data, error } = await db.rpc(name, args).abortSignal(AbortSignal.timeout(30000));
    if (error) throw Error(`${name}: ${error.message}`);
    if (!data || !Array.isArray(data.products) || data.products.length > limit || !Number.isFinite(data.total ?? data.totalProducts))
      throw Error(`${name}: invalid response`);
    console.log(`${name}: OK (${data.products.length} rows)`);
  }
})().catch(error => {
  console.error('Search database check failed:', error.message);
  console.error('Apply src/database/2026-09-28_search_rpc.sql in Supabase SQL Editor before deploying.');
  process.exitCode = 1;
});

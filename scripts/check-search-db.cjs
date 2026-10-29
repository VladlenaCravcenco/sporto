// Read-only deploy preflight. Runs with the same public key as the application.
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
(async () => {
  if (!url || !key) throw Error('Supabase public configuration is missing');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const requests = [
    ['sporto_home_sales_v1', {}, 20],
    ['sporto_catalog_v1', { filters: {}, page_number: 1, sort_order: 'recommended', locale: 'ro' }, 24],
  ];
  const search = await db.from('products').select('id,name_ro,name_ru,sku,brand,price,sale_price,qty').eq('active', true).or('name_ro.ilike.%minge%,name_ru.ilike.%minge%,sku.ilike.%minge%,brand.ilike.%minge%').order('id').limit(8).abortSignal(AbortSignal.timeout(30000));
  if (search.error) throw Error(`Direct search: ${search.error.message}`);
  console.log(`Direct product search: OK (${search.data.length} rows)`);
  for (const [name, args, limit] of requests) {
    const { data, error } = await db.rpc(name, args).abortSignal(AbortSignal.timeout(30000));
    if (error) throw Error(`${name}: ${error.message}`);
    if (!data || !Array.isArray(data.products) || data.products.length > limit || !Number.isFinite(data.total ?? data.totalProducts))
      throw Error(`${name}: invalid response`);
    console.log(`${name}: OK (${data.products.length} rows)`);
  }
})().catch(error => {
  console.error('Database preflight failed:', error.message);
  console.error('Check public product access and the home/catalog database functions before deploying.');
  process.exitCode = 1;
});

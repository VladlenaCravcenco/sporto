import { createBrowserClient } from '@supabase/ssr';
import { adminTransport } from '../../src/lib/admin-transport';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: adminTransport } },
  );
}

import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import type { BrandRow } from '../../src/lib/supabase';

export const getBrand = cache(async (slug: string): Promise<BrandRow | null> => {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error('Brand configuration missing');
  const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from('brands').select('*').eq('slug', slug).eq('active', true).maybeSingle();
  if (error) throw new Error('Brand unavailable');
  return data as BrandRow | null;
});

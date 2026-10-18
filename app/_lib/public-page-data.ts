import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import type { PublicPageInitialData } from '../../src/app/contexts/PublicPageData';
import type { FaqItem } from '../../src/lib/faq';

export const getPublicPageData = cache(async (route: string): Promise<PublicPageInitialData> => {
  const page = ({ 'turnkey-solutions': 'turnkey', 'maintenance-service': 'maintenance',
    'terms-of-cooperation': 'legal:terms', 'delivery-terms': 'legal:delivery', 'privacy-policy': 'legal:privacy' } as Record<string, string>)[route];
  const result: PublicPageInitialData = { content: page ? { [page]: null } : {} };
  const config = getSupabasePublicConfig();
  if (!config) throw new Error('Public content configuration missing');
  const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  if (page) {
    const { data, error } = await db.from('page_content').select('value').eq('page', page).eq('key', 'data').maybeSingle();
    if (error) throw new Error(`Public content unavailable: ${page}`);
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`Invalid public content: ${page}`);
      result.content[page] = parsed;
    }
  }
  if (route === 'turnkey-solutions') {
    const { count, error } = await db.from('products').select('id', { count: 'exact', head: true }).eq('active', true);
    result.catalogCount = error ? null : count;
  }
  if (route === 'about') {
    const { data, error } = await db.from('faq_items').select('*').eq('active', true).order('sort_order');
    if (error) throw new Error('FAQ unavailable');
    result.faq = data as FaqItem[];
  }
  if (route === 'contacts') {
    const contactKeys = ['phone', 'phoneDisplay', 'phone_2', 'email', 'address_ro', 'address_ru', 'hours_ro', 'hours_ru', 'legal_name', 'legal_idno', 'mapsDirectionsUrl', 'mapsEmbedUrl', 'telegram', 'whatsapp', 'viber', 'socials'];
    const { data, error } = await db.from('site_settings').select('key,value').in('key', contactKeys);
    if (error) throw new Error('Contacts unavailable');
    result.settings = Object.fromEntries((data || []).filter(row => contactKeys.includes(row.key)).map(row => [row.key, row.value || '']));
  }
  return result;
});

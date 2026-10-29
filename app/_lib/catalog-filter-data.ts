import { getRpcCatalog } from './catalog-rpc';
import { getSupabasePublicConfig } from './supabase-env';
import type { CatalogSort, CatalogLanguage } from './catalog-data';
import type { CatalogQuery } from './catalog-filters';
import { cache } from 'react';

const load = cache(async (serializedQuery: string, page: number, sort: CatalogSort, language: CatalogLanguage) => {
  const query = JSON.parse(serializedQuery) as CatalogQuery;
  if (!getSupabasePublicConfig()) return { status: 'unavailable' as const };
  try {
    return await getRpcCatalog(query, page, sort, language);
  } catch (error) {
    console.error('[catalog filters] Could not load catalog', error);
    return { status: 'error' as const };
  }
});

export function getFilteredCatalog(query: CatalogQuery, page: number, sort: CatalogSort, language: CatalogLanguage) {
  const normalized = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined).sort(([a], [b]) => a.localeCompare(b)));
  return load(JSON.stringify(normalized), page, sort, language);
}

import { getRpcCatalog } from './catalog-rpc';
import { getSupabasePublicConfig } from './supabase-env';
import type { CatalogSort, CatalogLanguage } from './catalog-data';
import type { CatalogQuery } from './catalog-filters';

export async function getFilteredCatalog(query: CatalogQuery, page: number, sort: CatalogSort, language: CatalogLanguage) {
  if (!getSupabasePublicConfig()) return { status: 'unavailable' as const };
  try {
    return await getRpcCatalog(query, page, sort, language);
  } catch (error) {
    console.error('[catalog filters] Could not load catalog', error);
    return { status: 'error' as const };
  }
}

import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import { prepareSearchQuery } from './search-query';
import type { SearchResult, MatchType } from '../../src/lib/searchEngine';
import type { CatalogProduct } from './catalog-data';

interface SearchResponse {
  products: (CatalogProduct & { score: number; match_type: MatchType })[];
  total: number; brands: string[]; categories: string[];
  hasFuzzy: boolean; hasSynonym: boolean; hasConcept: boolean;
  suggestions: string[];
}
type SearchValue = { result: SearchResult; suggestions: string[] };
const results = new Map<string, { expires: number; value: SearchValue }>();
const pending = new Map<string, Promise<SearchValue>>();
const capacity = 32;

export async function getSmartSearch(query: string, language: 'ro' | 'ru'): Promise<SearchValue> {
  const spec = prepareSearchQuery(query);
  const key = language + ':' + JSON.stringify(spec);
  const now = Date.now();
  for (const [id, entry] of results) if (entry.expires <= now) results.delete(id);
  const cached = results.get(key);
  if (cached) return cached.value;
  const running = pending.get(key);
  if (running) return running;
  const request = (async () => {
    const config = getSupabasePublicConfig();
    if (!config) throw new Error('Search configuration missing');
    const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc('sporto_search_v1', { spec, locale: language });
    if (error) throw error;
    const response = data as SearchResponse;
    if (!response || !Array.isArray(response.products) || response.products.length > 8 || !Number.isFinite(response.total))
      throw new Error('Invalid search response');
    const value: SearchValue = {
      result: {
        hits: response.products.map(p => ({
          score: p.score, matchType: p.match_type,
          product: {
            id: p.id, name: { ro: p.name_ro, ru: p.name_ru || p.name_ro },
            description: { ro: '', ru: '' }, category: p.category || '', subcategory: p.subcategory || '',
            brand: p.brand || '', sku: p.sku || '', cod: p.sku || '', price: p.price,
            sale_price: p.sale_price ?? undefined, image: p.image_url || '', qty: p.qty ?? 0,
            inStock: (p.qty || 0) > 0, featured: false, specifications: { ro: {}, ru: {} },
          },
        })),
        total: response.total, rawTokens: spec.raw,
        expandedTokens: { raw: spec.raw, withSynonyms: spec.synonyms, conceptKeywords: spec.concepts },
        priceRange: spec.min !== undefined || spec.max !== undefined ? { min: spec.min, max: spec.max } : undefined,
        matchedBrands: (response.brands || []).slice(0, 6), matchedCategories: (response.categories || []).slice(0, 4),
        hasFuzzy: response.hasFuzzy, hasSynonym: response.hasSynonym, hasConcept: response.hasConcept,
      },
      suggestions: (response.suggestions || []).slice(0, 3),
    };
    if (results.size >= capacity) results.delete(results.keys().next().value!);
    results.set(key, { expires: Date.now() + 15_000, value });
    return value;
  })();
  // Bound both completed cache and deduplication bookkeeping under varied queries.
  const tracked = pending.size < capacity;
  if (tracked) pending.set(key, request);
  try { return await request; } finally { if (tracked) pending.delete(key); }
}

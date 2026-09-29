import { expandTokens, norm, parsePrice } from '../../src/lib/searchEngine';

/** Only query-sized data lives here; never a catalog snapshot. */
export function prepareSearchQuery(query: string) {
  const text = query.trim();
  if (!text || text.length > 160 || text.split(/\s+/).length > 16) throw new Error('Invalid search query');
  // Do not interpret a compound SKU (17-47-121, AB123-456) as a price range.
  const compoundCode = /^[\p{L}\d]+(?:[-_/][\p{L}\d]+)+$/u.test(text)
    && (/[\p{L}]/u.test(text) || (text.match(/[-_/]/g)?.length || 0) > 1);
  const { price, cleanQuery } = compoundCode ? { price: {} as { min?: number; max?: number }, cleanQuery: text } : parsePrice(text);
  const raw = [...new Set(norm(cleanQuery).split(/\s+/).filter(Boolean))];
  const expanded = expandTokens(raw, text);
  return {
    raw, synonyms: expanded.withSynonyms, concepts: expanded.conceptKeywords,
    min: price.min, max: price.max,
  };
}

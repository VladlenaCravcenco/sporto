export interface SimilarProduct {
  id: string; sku: string | null; name_ro: string; name_ru: string | null;
  brand: string | null; image_url: string | null; active: boolean;
}
export interface SimilarProductMatch extends SimilarProduct { reason: 'name' | 'sku' | 'model'; score: number }
const normalized = (value: string | null | undefined) => (value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const skuKey = (value: string | null | undefined) => normalized(value).replace(/^r\s+/, '').replace(/\s/g, '');
export function similarProducts(products: SimilarProduct[], draft: { id?: string | null; sku?: string | null; name_ro?: string | null; name_ru?: string | null }): SimilarProductMatch[] {
  const names = [draft.name_ro, draft.name_ru].map(normalized).filter(name => name.length >= 8);
  const sku = skuKey(draft.sku);
  return products.flatMap(product => {
    if (product.id === draft.id) return [];
    let score = 0; let reason: SimilarProductMatch['reason'] = 'model';
    if (sku.length >= 3 && sku === skuKey(product.sku)) { score = 95; reason = 'sku'; }
    for (const name of [product.name_ro, product.name_ru].map(normalized).filter(Boolean)) {
      for (const input of names) {
        if (name === input) { score = 100; reason = 'name'; continue; }
        const a = new Set(input.split(' ').filter(w => w.length >= 2));
        const b = new Set(name.split(' ').filter(w => w.length >= 2));
        const common = [...a].filter(w => b.has(w));
        const sharedModel = common.some(w => /\d/.test(w) && /\p{L}/u.test(w) && w.length >= 4);
        const overlap = common.length / Math.max(a.size, b.size, 1);
        if (common.length >= 3 && overlap >= 0.7 && (sharedModel || overlap >= 0.85) && score < 80) { score = 70 + overlap * 10; reason = 'model'; }
      }
    }
    return score ? [{ ...product, score, reason }] : [];
  }).sort((a, b) => b.score - a.score || Number(b.active) - Number(a.active) || a.id.localeCompare(b.id));
}
export async function loadSimilarityCatalog(db: any): Promise<SimilarProduct[]> {
  const products: SimilarProduct[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('products').select('id,sku,name_ro,name_ru,brand,image_url,active').order('id').range(from, from + 999);
    if (error) throw new Error('SIMILAR_PRODUCTS_UNAVAILABLE');
    products.push(...data || []);
    if (!data || data.length < 1000) break;
  }
  const archived = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('product_redirects').select('source_id').order('source_id').range(from, from + 999);
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') break;
      throw new Error('SIMILAR_PRODUCTS_UNAVAILABLE');
    }
    for (const row of data || []) archived.add(row.source_id);
    if (!data || data.length < 1000) break;
  }
  return products.filter(product => !archived.has(product.id));
}

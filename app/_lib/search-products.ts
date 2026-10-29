import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogProduct } from './catalog-data';
import type { prepareSearchQuery } from './search-query';

export async function readSearchProducts(db: SupabaseClient, spec: ReturnType<typeof prepareSearchQuery>) {
  const products: CatalogProduct[] = [];
  for (let from = 0; ; from += 1000) {
    let request = db.from('products').select('id,name_ro,name_ru,sku,brand,category,subcategory,price,sale_price,image_url,qty,has_warranty').eq('active', true);
    for (const token of spec.raw) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = JSON.stringify(escaped.replace(/[aistе]/g, letter => ({ a: '[aăâ]', i: '[iî]', s: '[sșş]', t: '[tțţ]', е: '[её]' })[letter]!));
      request = request.or(['name_ro', 'name_ru', 'sku', 'brand'].map(field => `${field}.imatch.${pattern}`).join(','));
    }
    const { data, error } = await request.order('id').range(from, from + 999);
    if (error) throw error;
    products.push(...(data || []));
    if (!data || data.length < 1000) return products;
  }
}

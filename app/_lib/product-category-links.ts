export interface ProductCategoryLink { product_id: string; category: string; subcategory: string }
export function missingMergeRelation(error: { code?: string } | null): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}
/** The app can be deployed before the additive merge migration. */
export async function readProductCategoryLinks(db: any, category?: string, subcategory?: string): Promise<ProductCategoryLink[]> {
  const rows: ProductCategoryLink[] = [];
  for (let from = 0; ; from += 1000) {
    let query = db.from('product_category_links').select('product_id,category,subcategory').order('product_id').order('category').order('subcategory');
    if (category !== undefined) query = query.eq('category', category);
    if (subcategory !== undefined) query = query.eq('subcategory', subcategory);
    const { data, error } = await query.range(from, from + 999);
    if (missingMergeRelation(error)) return [];
    if (error) throw new Error('Product category placements unavailable');
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

import type { CatalogProduct } from './catalog-data';

export type CatalogQuery = Record<string, string | string[] | undefined>;
export interface AttributeDefinition {
  id: string; name_ro: string; name_ru: string; value_type: string;
  unit: string | null; unit_ro: string | null; unit_ru: string | null;
  category_ids: string[];
}
export interface AttributeValue {
  product_id: string; attribute_id: string; numeric_value: number | null;
  boolean_value: boolean | null; text_value: string | null;
}
export interface FilterOption { value: string; label: string; count: number }
export interface FilterGroup { key: string; label: string; options: FilterOption[] }
export interface CatalogFacets {
  minPrice: number; maxPrice: number; groups: FilterGroup[];
}
export const valuesOf = (query: CatalogQuery, key: string): string[] => {
  const value = query[key];
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
};
export const effectivePrice = (p: CatalogProduct) => p.sale_price != null && p.sale_price > 0 && p.sale_price < p.price ? p.sale_price : p.price;
export function attributeKey(value: AttributeValue, type: string) {
  if (type === 'number') return value.numeric_value == null ? null : `num:${value.numeric_value}`;
  if (type === 'boolean') return value.boolean_value == null ? null : String(value.boolean_value);
  return value.text_value;
}
export function createProductMatcher(query: CatalogQuery, definitions: AttributeDefinition[], rows: AttributeValue[]) {
  const options = new Map<string, Map<string, Set<string>>>();
  const types = new Map(definitions.map(d => [d.id, d.value_type]));
  for (const row of rows) {
    const type = types.get(row.attribute_id);
    if (!type) continue;
    const key = attributeKey(row, type);
    if (key == null) continue;
    if (!options.has(row.attribute_id)) options.set(row.attribute_id, new Map());
    const map = options.get(row.attribute_id)!;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row.product_id);
  }
  return (product: CatalogProduct, exclude?: string) => {
    for (const key of ['category', 'subcategory', 'brand'] as const) {
      const selected = valuesOf(query, key);
      if (exclude !== key && selected.length && !selected.includes(product[key] || '')) return false;
    }
    const price = effectivePrice(product);
    if (exclude !== 'price') {
      for (const key of ['minPrice', 'maxPrice']) {
        const raw = valuesOf(query, key)[0];
        if (raw && Number.isFinite(Number(raw)) && (key === 'minPrice' ? price < Number(raw) : price > Number(raw))) return false;
      }
    }
    if (exclude !== 'sale' && valuesOf(query, 'sale').includes('true') && price === product.price) return false;
    if (exclude !== 'warranty' && valuesOf(query, 'warranty').includes('true') && !product.has_warranty) return false;
    const stock = valuesOf(query, 'stock');
    if (exclude !== 'stock' && stock.length && !stock.includes((product.qty ?? 0) > 0 ? 'inStock' : 'onOrder')) return false;
    const search = (valuesOf(query, 'search')[0] || '').trim().toLocaleLowerCase();
    if (search && !`${product.name_ro} ${product.name_ru || ''} ${product.sku || ''} ${product.brand || ''}`.toLocaleLowerCase().includes(search)) return false;
    for (const definition of definitions) {
      const key = `attr.${definition.id}`;
      const selected = valuesOf(query, key);
      if (key !== exclude && selected.length && !selected.some(value => options.get(definition.id)?.get(value)?.has(product.id))) return false;
    }
    return true;
  };
}

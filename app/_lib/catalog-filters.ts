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
export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/ё/g, 'е');
export function createProductMatcher(query: CatalogQuery, definitions: AttributeDefinition[], rows: AttributeValue[], categoryNames: Record<string, string> = {}) {
  const options = new Map<string, Map<string, Set<string>>>();
  const types = new Map(definitions.filter(d => valuesOf(query, `attr.${d.id}`).length).map(d => [d.id, d.value_type]));
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
  const dimensions = (['category', 'subcategory', 'brand'] as const)
    .map(key => ({ key, selected: new Set(valuesOf(query, key)) })).filter(d => d.selected.size);
  const attributes = definitions.map(d => {
    const key = 'attr.' + d.id;
    const selected = valuesOf(query, key);
    const ids = new Set<string>();
    for (const value of selected) for (const id of options.get(d.id)?.get(value) || []) ids.add(id);
    return { key, selected, ids };
  }).filter(d => d.selected.length);
  const minRaw = valuesOf(query, 'minPrice')[0];
  const maxRaw = valuesOf(query, 'maxPrice')[0];
  const min = minRaw && Number.isFinite(Number(minRaw)) ? Number(minRaw) : -Infinity;
  const max = maxRaw && Number.isFinite(Number(maxRaw)) ? Number(maxRaw) : Infinity;
  const sale = valuesOf(query, 'sale').includes('true');
  const warranty = valuesOf(query, 'warranty').includes('true');
  const stock = new Set(valuesOf(query, 'stock'));
  const terms = normalizeSearch(valuesOf(query, 'search')[0] || '').trim().split(/\s+/).filter(Boolean);
  return (product: CatalogProduct, exclude?: string) => {
    for (const { key, selected } of dimensions)
      if (exclude !== key && !selected.has(product[key] || '')) return false;
    const price = effectivePrice(product);
    if (exclude !== 'price' && (price < min || price > max)) return false;
    if (exclude !== 'sale' && sale && price === product.price) return false;
    if (exclude !== 'warranty' && warranty && !product.has_warranty) return false;
    if (exclude !== 'stock' && stock.size && !stock.has((product.qty ?? 0) > 0 ? 'inStock' : 'onOrder')) return false;
    if (terms.length) {
      const searchable = normalizeSearch([product.name_ro, product.name_ru, product.sku, product.brand,
        categoryNames[product.category || ''], categoryNames[product.subcategory || '']].filter(Boolean).join(' '));
      if (!terms.every(term => searchable.includes(term))) return false;
    }
    for (const attribute of attributes)
      if (attribute.key !== exclude && !attribute.ids.has(product.id)) return false;
    return true;
  };
}

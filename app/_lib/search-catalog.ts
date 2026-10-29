import type { SupabaseClient } from '@supabase/supabase-js';
import type { CatalogLanguage, CatalogSort, CatalogProduct } from './catalog-data';
import { readSearchProducts } from './search-products';
import { prepareSearchQuery } from './search-query';
import { attributeKey, createProductMatcher, effectivePrice, valuesOf, type AttributeDefinition, type AttributeValue, type CatalogQuery } from './catalog-filters';
import { missingMergeRelation, type ProductCategoryLink } from './product-category-links';

export async function searchCatalog(db: SupabaseClient, query: CatalogQuery, page: number, sort: CatalogSort, language: CatalogLanguage, definitions: AttributeDefinition[]) {
  const spec = prepareSearchQuery(valuesOf(query, 'search')[0]);
  const products = await readSearchProducts(db, spec);
  const attributes: AttributeValue[] = [], placements: ProductCategoryLink[] = [];
  for (let offset = 0; offset < products.length; offset += 200) {
    const ids = products.slice(offset, offset + 200).map(p => p.id);
    const tables = [
      { name: 'product_attribute_values', fields: 'product_id,attribute_id,numeric_value,boolean_value,text_value', target: attributes },
      { name: 'product_category_links', fields: 'product_id,category,subcategory', target: placements },
    ];
    for (const table of tables) {
      if (table.name === 'product_attribute_values' && !definitions.length) continue;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await db.from(table.name).select(table.fields).in('product_id', ids).order('product_id').order(table.name === 'product_category_links' ? 'category' : 'attribute_id').range(from, from + 999);
        if (table.name === 'product_category_links' && missingMergeRelation(error)) break;
        if (error) throw error;
        table.target.push(...(data || []) as never[]);
        if (!data || data.length < 1000) break;
      }
    }
  }
  const filters: CatalogQuery = { ...query, search: undefined, category: undefined, subcategory: undefined };
  if (spec.min !== undefined) filters.minPrice = String(Math.max(spec.min, Number(valuesOf(query, 'minPrice')[0]) || 0));
  if (spec.max !== undefined) filters.maxPrice = String(Math.min(spec.max, Number(valuesOf(query, 'maxPrice')[0]) || Infinity));
  const matcher = createProductMatcher(filters, definitions, attributes);
  const locations = new Map<string, ProductCategoryLink[]>();
  for (const p of products) locations.set(p.id, [{ product_id: p.id, category: p.category || '', subcategory: p.subcategory || '' }]);
  for (const link of placements) locations.get(link.product_id)?.push(link);
  const matches = (p: CatalogProduct, exclude?: string) => matcher(p, exclude) && locations.get(p.id)!.some(location =>
    (exclude === 'category' || !valuesOf(query, 'category').length || valuesOf(query, 'category').includes(location.category)) &&
    (exclude === 'subcategory' || !valuesOf(query, 'subcategory').length || valuesOf(query, 'subcategory').includes(location.subcategory)));
  const selected = products.filter(p => matches(p));
  const compareName = (a: CatalogProduct, b: CatalogProduct) => ((language === 'ru' ? a.name_ru || a.name_ro : a.name_ro) || '').localeCompare((language === 'ru' ? b.name_ru || b.name_ro : b.name_ro) || '', language) || a.id.localeCompare(b.id);
  selected.sort((a,b) => sort === 'price-asc' ? effectivePrice(a)-effectivePrice(b) || compareName(a,b) : sort === 'price-desc' ? effectivePrice(b)-effectivePrice(a) || compareName(a,b) : sort === 'name-asc' ? compareName(a,b) : Number((b.qty || 0)>0)-Number((a.qty || 0)>0) || compareName(a,b));
  const facets: {key:string;value:string;count:number}[] = [];
  const keys = ['category','subcategory','brand','stock','sale','warranty', ...definitions.map(d=>'attr.'+d.id)];
  const attributeValues = new Map<string, string[]>();
  for (const row of attributes) {
    const def = definitions.find(d=>d.id===row.attribute_id);
    const key = def && attributeKey(row, def.value_type);
    if (key != null) {
      const id = row.product_id+':attr.'+row.attribute_id;
      attributeValues.set(id, [...(attributeValues.get(id) || []), key]);
    }
  }
  for (const key of keys) {
    const counts = new Map<string,number>();
    for (const p of products) {
      if (!matches(p,key)) continue;
      const values = key === 'category' || key === 'subcategory' ? locations.get(p.id)!.map(l=>l[key]) : key === 'brand' ? [p.brand || ''] : key === 'stock' ? [(p.qty || 0)>0?'inStock':'onOrder'] : key === 'sale' ? effectivePrice(p)<p.price?['true']:[] : key === 'warranty' ? p.has_warranty?['true']:[] : attributeValues.get(p.id+':'+key) || [];
      for (const value of new Set(values.filter(Boolean))) counts.set(value,(counts.get(value)||0)+1);
    }
    for (const [value,count] of counts) facets.push({key,value,count});
  }
  const prices = products.filter(p=>matches(p,'price')).map(effectivePrice);
  return {products:selected.slice((page-1)*24,page*24),totalProducts:selected.length,page,facets,minPrice:prices.length?Math.min(...prices):0,maxPrice:prices.length?Math.max(...prices):0};
}

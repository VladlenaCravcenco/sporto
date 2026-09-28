import { searchProducts } from '../../src/lib/searchEngine';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import { getCatalogNavigation, type CatalogProduct, type CatalogSort, type CatalogLanguage } from './catalog-data';
import { attributeKey, createProductMatcher, effectivePrice, valuesOf, type AttributeDefinition, type AttributeValue, type CatalogQuery, type CatalogFacets, type FilterGroup } from './catalog-filters';

export async function getFilteredCatalog(query: CatalogQuery, page: number, sort: CatalogSort, language: CatalogLanguage) {
  const config = getSupabasePublicConfig();
  if (!config) return { status: 'unavailable' as const };
  const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  // Read every page: Supabase caps individual responses at 1000 rows.
  async function readAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<T[]> {
    const result: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await fetchPage(from, from + 999);
      if (error) throw error;
      result.push(...(data ?? []) as T[]);
      if (!data || data.length < 1000) return result;
    }
  }
  try {
    const [products, allDefinitions, categories] = await Promise.all([
      readAll<CatalogProduct & { description_ro: string | null; description_ru: string | null }>((from, to) => db.from('products').select('id,name_ro,name_ru,description_ro,description_ru,sku,brand,category,subcategory,price,sale_price,image_url,qty,has_warranty').eq('active', true).order('id').range(from, to)),
      readAll<AttributeDefinition>((from, to) => db.from('product_attributes').select('id,name_ro,name_ru,value_type,unit,unit_ro,unit_ru,category_ids').eq('active', true).eq('filter_enabled', true).neq('value_type', 'text').order('sort_order').order('id').range(from, to)),
      getCatalogNavigation(),
    ]);
    const chosenCategories = valuesOf(query, 'category');
    const definitions = allDefinitions.filter(d => !chosenCategories.length || !d.category_ids?.length || d.category_ids.some(id => chosenCategories.includes(id)));
    const rows = definitions.length ? await readAll<AttributeValue>((from, to) => db.from('product_attribute_values').select('product_id,attribute_id,numeric_value,text_value,boolean_value').in('attribute_id', definitions.map(d => d.id)).order('product_id').order('attribute_id').range(from, to)) : [];
    const categoryNames = Object.fromEntries(categories.flatMap(c => [
      [c.id, c.name.ro + ' ' + c.name.ru],
      ...c.subcategories.map(s => [s.id, s.name.ro + ' ' + s.name.ru]),
    ]));
    const search = (valuesOf(query, 'search')[0] || '').trim();
    const hits = search ? searchProducts(products.map(p => ({
      id: p.id, name: { ro: p.name_ro, ru: p.name_ru || p.name_ro },
      description: { ro: p.description_ro || '', ru: p.description_ru || p.description_ro || '' },
      category: p.category || '', subcategory: p.subcategory || '', brand: p.brand || '',
      sku: p.sku || '', cod: p.sku || '', price: p.price, image: p.image_url || '',
      featured: false, specifications: { ro: {}, ru: {} },
    })), search, language, products.length).hits : [];
    const ranks = new Map(hits.map((hit, index) => [hit.product.id, index]));
    const filterMatch = createProductMatcher({ ...query, search: undefined }, definitions, rows, categoryNames);
    const matches = (product: CatalogProduct, exclude?: string) =>
      (!search || ranks.has(product.id)) && filterMatch(product, exclude);
    const groups: FilterGroup[] = [];
    const group = (key: string, label: string, options: { value: string; label: string; test: (p: CatalogProduct) => boolean }[]) => {
      const eligible = products.filter(p => matches(p, key));
      groups.push({ key, label, options: options.map(o => ({ value: o.value, label: o.label, count: eligible.filter(o.test).length })) });
    };
    const ro = language === 'ro';
    group('category', ro ? 'Categorii' : 'Категории', categories.map(c => ({ value: c.id, label: c.name[language], test: p => p.category === c.id })));
    if (chosenCategories.length) group('subcategory', ro ? 'Subcategorii' : 'Подкатегории', categories.filter(c => chosenCategories.includes(c.id)).flatMap(c => c.subcategories.map(s => ({ value: s.id, label: s.name[language], test: (p: CatalogProduct) => p.subcategory === s.id }))));
    group('sale', ro ? 'Promoții' : 'Акции', [{ value: 'true', label: ro ? 'Doar produse la reducere' : 'Только со скидкой', test: p => effectivePrice(p) < p.price }]);
    group('stock', ro ? 'Disponibilitate' : 'Наличие', [
      { value: 'inStock', label: ro ? 'În stoc' : 'В наличии', test: p => (p.qty ?? 0) > 0 },
      { value: 'onOrder', label: ro ? 'La comandă' : 'Под заказ', test: p => (p.qty ?? 0) <= 0 },
    ]);
    group('brand', ro ? 'Brand' : 'Бренд', [...new Set(products.map(p => p.brand).filter((b): b is string => Boolean(b)))].sort().map(b => ({ value: b, label: b, test: p => p.brand === b })));
    group('warranty', ro ? 'Garanție' : 'Гарантия', [{ value: 'true', label: ro ? 'Cu garanție' : 'С гарантией', test: p => p.has_warranty }]);
    for (const definition of definitions) {
      const relevant = rows.filter(row => row.attribute_id === definition.id);
      const options = [...new Set(relevant.map(row => attributeKey(row, definition.value_type)).filter((v): v is string => v != null))].sort((a, b) => definition.value_type === 'number' ? Number(a.slice(4)) - Number(b.slice(4)) : a.localeCompare(b));
      const unit = (ro ? definition.unit_ro : definition.unit_ru) || definition.unit || '';
      if (!options.length) continue;
      group(`attr.${definition.id}`, (ro ? definition.name_ro : definition.name_ru) || definition.name_ro, options.map(value => {
        const ids = new Set(relevant.filter(row => attributeKey(row, definition.value_type) === value).map(row => row.product_id));
        return { value, label: definition.value_type === 'boolean' ? (value === 'true' ? (ro ? 'Da' : 'Да') : (ro ? 'Nu' : 'Нет')) : `${value.replace(/^num:/, '')}${unit ? ` ${unit}` : ''}`, test: p => ids.has(p.id) };
      }));
    }
    const prices = products.filter(p => matches(p, 'price')).map(effectivePrice);
    const facets: CatalogFacets = { minPrice: prices.length ? Math.min(...prices) : 0, maxPrice: prices.length ? Math.max(...prices) : 0, groups };
    const filtered = products.filter(p => matches(p));
    filtered.sort((a, b) => {
      if (sort === 'price-asc') return effectivePrice(a) - effectivePrice(b) || a.id.localeCompare(b.id);
      if (sort === 'price-desc') return effectivePrice(b) - effectivePrice(a) || a.id.localeCompare(b.id);
      if (sort === 'recommended') {
        if (search) return (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0);
        const priority = Number(b.brand?.toLowerCase() === 'insportline') - Number(a.brand?.toLowerCase() === 'insportline');
        if (priority) return priority;
      }
      return ((ro ? a.name_ro : a.name_ru) || a.name_ro).localeCompare((ro ? b.name_ro : b.name_ru) || b.name_ro, language) || a.id.localeCompare(b.id);
    });
    const totalPages = Math.ceil(filtered.length / 24);
    if (page > Math.max(totalPages, 1)) return { status: 'out-of-range' as const };
    return { status: 'ready' as const, products: filtered.slice((page - 1) * 24, page * 24), totalProducts: filtered.length, totalPages, page, facets };
  } catch (error) {
    console.error('[catalog filters] Could not load catalog', error);
    return { status: 'error' as const };
  }
}

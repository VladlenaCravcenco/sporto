import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';
import { getCatalogNavigation, type CatalogProduct, type CatalogSort, type CatalogLanguage } from './catalog-data';
import { prepareSearchQuery } from './search-query';
import { publicSnapshot } from './public-cache';
import { valuesOf, type AttributeDefinition, type CatalogQuery, type CatalogFacets, type FilterGroup } from './catalog-filters';

type FacetCount = { key: string; value: string; count: number };
interface CatalogResponse {
  products: CatalogProduct[]; totalProducts: number; page: number;
  facets: FacetCount[]; minPrice: number; maxPrice: number;
}
function database() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error('Missing public Supabase configuration');
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const definitions = publicSnapshot(async () => {
  const result: AttributeDefinition[] = [];
  const db = database();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('product_attributes')
      .select('id,name_ro,name_ru,value_type,unit,unit_ro,unit_ru,category_ids')
      .eq('active', true).eq('filter_enabled', true).neq('value_type', 'text')
      .order('sort_order').order('id').range(from, from + 999);
    if (error) throw error;
    result.push(...data);
    if (data.length < 1000) return result;
  }
});

export async function getRpcCatalog(query: CatalogQuery, page: number, sort: CatalogSort, language: CatalogLanguage) {
  const filters: Record<string, unknown> = Object.fromEntries(Object.entries(query).filter(([key, value]) =>
    value !== undefined && (['category','subcategory','brand','stock','sale','warranty','minPrice','maxPrice'].includes(key) || key.startsWith('attr.'))));
  for (const key of ['minPrice','maxPrice']) {
    const value = valuesOf(query,key)[0];
    if (!value || !Number.isFinite(Number(value))) delete filters[key];
  }
  const search = (valuesOf(query, 'search')[0] || '').trim();
  if (search) filters.searchSpec = prepareSearchQuery(search);
  const [response, categories, allDefinitions] = await Promise.all([
    database().rpc(search ? 'sporto_catalog_search_v1' : 'sporto_catalog_v1', { filters, page_number: page, sort_order: sort, locale: language }),
    getCatalogNavigation(), definitions(),
  ]);
  if (response.error) throw response.error;
  const data = response.data as CatalogResponse;
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.facets) || !Number.isFinite(data.totalProducts))
    throw new Error('Invalid catalog RPC response');
  const totalPages = Math.ceil(data.totalProducts / 24);
  if (page > Math.max(totalPages, 1)) return { status: 'out-of-range' as const };
  const counts = new Map<string, Map<string, number>>();
  for (const row of data.facets) {
    if (!counts.has(row.key)) counts.set(row.key, new Map());
    counts.get(row.key)!.set(row.value, Number(row.count));
  }
  const groups: FilterGroup[] = [];
  const group = (key: string, label: string, options: { value: string; label: string }[]) =>
    groups.push({ key, label, options: options.map(option => ({ ...option, count: counts.get(key)?.get(option.value) || 0 })) });
  const ro = language === 'ro';
  const cats = valuesOf(query, 'category');
  group('category', ro ? 'Categorii' : 'Категории', categories.map(c => ({ value: c.id, label: c.name[language] })));
  if (cats.length) group('subcategory', ro ? 'Subcategorii' : 'Подкатегории',
    categories.filter(c => cats.includes(c.id)).flatMap(c => c.subcategories.map(s => ({ value: s.id, label: s.name[language] }))));
  group('sale', ro ? 'Promoții' : 'Акции', [{ value: 'true', label: ro ? 'Doar produse la reducere' : 'Только со скидкой' }]);
  group('stock', ro ? 'Disponibilitate' : 'Наличие', [
    { value: 'inStock', label: ro ? 'În stoc' : 'В наличии' },
    { value: 'onOrder', label: ro ? 'La comandă' : 'Под заказ' },
  ]);
  group('brand', ro ? 'Brand' : 'Бренд', [...(counts.get('brand')?.keys() || [])].sort().map(value => ({value,label:value})));
  group('warranty', ro ? 'Garanție' : 'Гарантия', [{ value: 'true', label: ro ? 'Cu garanție' : 'С гарантией' }]);
  for (const def of allDefinitions) {
    if (cats.length && def.category_ids?.length && !def.category_ids.some(id => cats.includes(id))) continue;
    const key = 'attr.' + def.id;
    const options = [...(counts.get(key)?.keys() || [])].sort((a,b) =>
      def.value_type === 'number' ? Number(a.slice(4))-Number(b.slice(4)) : a.localeCompare(b));
    if (!options.length) continue;
    const unit = (ro ? def.unit_ro : def.unit_ru) || def.unit || '';
    group(key, (ro ? def.name_ro : def.name_ru) || def.name_ro, options.map(value => ({
      value, label: def.value_type === 'boolean'
        ? (value === 'true' ? (ro ? 'Da' : 'Да') : (ro ? 'Nu' : 'Нет'))
        : (def.value_type === 'number' ? value.slice(4) : value) + (unit ? ' ' + unit : ''),
    })));
  }
  const facets: CatalogFacets = { minPrice: data.minPrice, maxPrice: data.maxPrice, groups };
  return { status: 'ready' as const, products: data.products, totalProducts: data.totalProducts, totalPages, page, facets };
}

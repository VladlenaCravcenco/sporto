import { createClient } from '@supabase/supabase-js';
import { categories as fallbackCategories } from '../../src/app/data/products';

export interface CatalogNavigationSubcategory {
  id: string;
  name: { ro: string; ru: string };
}

export interface CatalogNavigationCategory {
  id: string;
  icon?: string;
  name: { ro: string; ru: string };
  description: { ro: string; ru: string };
  subcategories: CatalogNavigationSubcategory[];
}

export interface CatalogMenuProduct {
  id: string;
  name_ro: string;
  name_ru: string | null;
  sku: string | null;
  image_url: string | null;
}

export interface CatalogProduct {
  id: string;
  name_ro: string;
  name_ru: string | null;
  sku: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  qty: number | null;
  has_warranty: boolean;
}

export type CatalogSort = 'recommended' | 'price-asc' | 'price-desc' | 'name-asc';
export type CatalogLanguage = 'ro' | 'ru';

export type CatalogPageData =
  | {
      status: 'ready';
      products: CatalogProduct[];
      page: number;
      pageSize: number;
      totalProducts: number;
      totalPages: number;
    }
  | { status: 'out-of-range'; products: []; totalPages: number }
  | { status: 'unavailable'; products: [] }
  | { status: 'error'; products: []; message: string };

function createServerSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function navigationFallback(): CatalogNavigationCategory[] {
  return fallbackCategories.map(category => ({
    id: category.id,
    icon: category.icon,
    name: category.name,
    description: category.description,
    subcategories: category.subcategories,
  }));
}

export async function getCatalogNavigation(): Promise<CatalogNavigationCategory[]> {
  const supabase = createServerSupabase();
  if (!supabase) return navigationFallback();

  const [categoriesResult, subcategoriesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('slug,active,name_ro,name_ru,description_ro,description_ru,icon,sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('subcategories')
      .select('category_slug,slug,name_ro,name_ru,sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  if (categoriesResult.error || !categoriesResult.data?.length) return navigationFallback();

  const subcategories = subcategoriesResult.error ? [] : (subcategoriesResult.data ?? []);
  return categoriesResult.data.map(category => ({
    id: category.slug,
    icon: category.icon || undefined,
    name: { ro: category.name_ro, ru: category.name_ru || category.name_ro },
    description: {
      ro: category.description_ro || '',
      ru: category.description_ru || category.description_ro || '',
    },
    subcategories: subcategories
      .filter(subcategory => subcategory.category_slug === category.slug)
      .map(subcategory => ({
        id: subcategory.slug,
        name: { ro: subcategory.name_ro, ru: subcategory.name_ru || subcategory.name_ro },
      })),
  }));
}

export async function getCatalogMenuProducts(
  category: string,
  subcategory: string,
  limit = 60,
): Promise<CatalogMenuProduct[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 60);
  const { data, error } = await supabase
    .from('products')
    .select('id,name_ro,name_ru,sku,image_url')
    .eq('active', true)
    .eq('category', category)
    .eq('subcategory', subcategory)
    .order('featured', { ascending: false })
    .order('id', { ascending: true })
    .limit(safeLimit);

  return error ? [] : (data as CatalogMenuProduct[]);
}

export async function getCatalogPageData(
  page = 1,
  pageSize = 24,
  sort: CatalogSort = 'recommended',
  language: CatalogLanguage = 'ro',
): Promise<CatalogPageData> {
  const supabase = createServerSupabase();
  if (!supabase) return { status: 'unavailable', products: [] };

  const safePage = Math.max(Math.trunc(page), 1);
  const safePageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 48);
  const fields = 'id,name_ro,name_ru,sku,brand,category,subcategory,price,sale_price,image_url,qty,has_warranty';

  if (sort !== 'recommended') {
    const countResult = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    if (countResult.error) {
      return { status: 'error', products: [], message: countResult.error.message };
    }

    const totalProducts = countResult.count ?? 0;
    const totalPages = Math.ceil(totalProducts / safePageSize);
    if (totalPages > 0 && safePage > totalPages) {
      return { status: 'out-of-range', products: [], totalPages };
    }
    if (totalProducts === 0) {
      return {
        status: 'ready',
        products: [],
        page: 1,
        pageSize: safePageSize,
        totalProducts: 0,
        totalPages: 0,
      };
    }

    const from = (safePage - 1) * safePageSize;
    const to = Math.min(from + safePageSize - 1, totalProducts - 1);
    let productsQuery = supabase
      .from('products')
      .select(fields)
      .eq('active', true);

    if (sort === 'price-asc') {
      productsQuery = productsQuery.order('price', { ascending: true }).order('id', { ascending: true });
    } else if (sort === 'price-desc') {
      productsQuery = productsQuery.order('price', { ascending: false }).order('id', { ascending: true });
    } else {
      productsQuery = productsQuery
        .order(language === 'ru' ? 'name_ru' : 'name_ro', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });
    }

    const productsResult = await productsQuery.range(from, to);
    if (productsResult.error) {
      return { status: 'error', products: [], message: productsResult.error.message };
    }

    return {
      status: 'ready',
      products: productsResult.data as CatalogProduct[],
      page: safePage,
      pageSize: safePageSize,
      totalProducts,
      totalPages,
    };
  }

  const [preferredCountResult, remainingCountResult] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .ilike('brand', 'insportline'),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .or('brand.is.null,brand.not.ilike.insportline'),
  ]);

  if (preferredCountResult.error || remainingCountResult.error) {
    return {
      status: 'error',
      products: [],
      message: preferredCountResult.error?.message || remainingCountResult.error?.message || 'Catalog count failed',
    };
  }

  const preferredCount = preferredCountResult.count ?? 0;
  const remainingCount = remainingCountResult.count ?? 0;
  const totalProducts = preferredCount + remainingCount;
  const totalPages = Math.ceil(totalProducts / safePageSize);

  if (totalPages > 0 && safePage > totalPages) {
    return { status: 'out-of-range', products: [], totalPages };
  }

  if (totalProducts === 0) {
    return {
      status: 'ready',
      products: [],
      page: 1,
      pageSize: safePageSize,
      totalProducts: 0,
      totalPages: 0,
    };
  }

  const globalStart = (safePage - 1) * safePageSize;
  const globalEnd = Math.min(globalStart + safePageSize - 1, totalProducts - 1);
  const preferredStart = globalStart;
  const preferredEnd = Math.min(globalEnd, preferredCount - 1);
  const remainingStart = Math.max(0, globalStart - preferredCount);
  const remainingEnd = globalEnd - preferredCount;

  const preferredRequest = preferredStart <= preferredEnd
    ? supabase
        .from('products')
        .select(fields)
        .eq('active', true)
        .ilike('brand', 'insportline')
        .order('featured', { ascending: false })
        .order('id', { ascending: true })
        .range(preferredStart, preferredEnd)
    : Promise.resolve({ data: [], error: null });

  const remainingRequest = remainingStart <= remainingEnd
    ? supabase
        .from('products')
        .select(fields)
        .eq('active', true)
        .or('brand.is.null,brand.not.ilike.insportline')
        .order('featured', { ascending: false })
        .order('brand', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(remainingStart, remainingEnd)
    : Promise.resolve({ data: [], error: null });

  const [preferredResult, remainingResult] = await Promise.all([preferredRequest, remainingRequest]);

  if (preferredResult.error || remainingResult.error) {
    return {
      status: 'error',
      products: [],
      message: preferredResult.error?.message || remainingResult.error?.message || 'Catalog query failed',
    };
  }

  return {
    status: 'ready',
    products: [
      ...(preferredResult.data as CatalogProduct[]),
      ...(remainingResult.data as CatalogProduct[]),
    ],
    page: safePage,
    pageSize: safePageSize,
    totalProducts,
    totalPages,
  };
}

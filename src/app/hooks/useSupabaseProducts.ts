import { useEffect, useState } from 'react';
import { supabase, fetchAllSupabaseRows, type ProductRow } from '../../lib/supabase';
import { cacheGet, cacheSet, cacheInvalidate, TTL_DEFAULT } from '../../lib/queryCache';
import type { Product } from '../data/products';
import { extractProductIdFromParam } from '../lib/product-url';
import { useCategories } from '../contexts/CategoriesContext';

// Extract YouTube video ID from any YouTube URL
function extractYouTubeId(url: string | null): string | undefined {
  if (!url) return undefined;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1];
}

// Map a Supabase row → the Product interface used across the app
export function rowToProduct(row: ProductRow): Product {
  return {
    id: String(row.id),
    name: {
      ro: row.name_ro,
      ru: row.name_ru || row.name_ro,
    },
    description: {
      ro: row.description_ro || '',
      ru: row.description_ru || row.description_ro || '',
    },
    category: row.category,
    subcategory: row.subcategory || '',
    price: Number(row.price),
    sale_price: row.sale_price ? Number(row.sale_price) : null,
    image: row.image_url || '',
    images: row.images?.length ? row.images : (row.image_url ? [row.image_url] : []),
    youtubeId: extractYouTubeId(row.youtube_url),
    featured: row.featured ?? false,
    specifications: { ro: {}, ru: {} },
    sku: row.sku || undefined,
    cod: row.sku || undefined,
    qty: row.qty ?? 0,
    inStock: (row.qty ?? 0) > 0,
    brand: row.brand || undefined,
  };
}

type StockFilter = 'all' | 'inStock' | 'onOrder';
type CatalogSortOption = 'default' | 'price-asc' | 'price-desc';

interface CatalogProductsParams {
  page: number;
  pageSize: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  saleOnly?: boolean;
  stockFilter?: StockFilter;
  searchTerm?: string;
  sortBy?: CatalogSortOption;
}

function sanitizeSearchTerm(raw: string): string {
  return raw.trim().replace(/[,%()]/g, ' ');
}

function applyCatalogFilters(query: any, params: CatalogProductsParams) {
  let next = query.eq('active', true);

  if (params.category && params.category !== 'all') next = next.eq('category', params.category);
  if (params.subcategory && params.subcategory !== 'all') next = next.eq('subcategory', params.subcategory);
  if (params.brand) next = next.eq('brand', params.brand);
  if (params.saleOnly) next = next.not('sale_price', 'is', null);

  if (params.stockFilter === 'inStock') {
    next = next.gt('qty', 0);
  } else if (params.stockFilter === 'onOrder') {
    next = next.lte('qty', 0);
  }

  const searchTerm = sanitizeSearchTerm(params.searchTerm || '');
  if (searchTerm) {
    next = next.or(`sku.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
  }

  if (params.sortBy === 'price-asc') {
    next = next.order('price', { ascending: true }).order('id', { ascending: true });
  } else if (params.sortBy === 'price-desc') {
    next = next.order('price', { ascending: false }).order('id', { ascending: true });
  } else {
    next = next
      .order('qty', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true });
  }

  return next;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────
// Retries a Supabase query up to `maxAttempts` times with exponential backoff.
async function withRetry<T>(
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  maxAttempts = 3,
): Promise<{ data: T | null; error: { message: string } | null }> {
  let lastError: { message: string } | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await fn();
    if (!error) return { data, error: null };
    lastError = error;
    if (attempt < maxAttempts) {
      // Exponential back-off: 500ms, 1000ms …
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return { data: null, error: lastError };
}

interface UseSupabaseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  /** true = data came from Supabase (even if empty), false = DB unreachable */
  connected: boolean;
  refetch: () => void;
}

export function useSupabaseProducts(): UseSupabaseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const CACHE_KEY = 'products:all';

    // ── 1. Serve from cache immediately (no spinner for repeat visits) ──
    const cached = cacheGet<Product[]>(CACHE_KEY);
    if (cached) {
      setProducts(cached);
      setConnected(true);
      setLoading(false);
      return;
    }

    // ── 2. Fresh fetch with retry ────────────────────────────────────────
    setLoading(true);
    setError(null);

    (async () => {
      const fetchAllActiveProducts = async () => {
        try {
          const data = await fetchAllSupabaseRows<ProductRow>((from, to) =>
            withRetry<ProductRow[]>(() =>
              supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('id', { ascending: true })
                .range(from, to)
            )
          );
          return { data, error: null };
        } catch (error) {
          return {
            data: null,
            error: { message: error instanceof Error ? error.message : 'Failed to fetch products' },
          };
        }
      };

      const { data, error: err } = await fetchAllActiveProducts();

      if (cancelled) return;

      if (err) {
        console.error('[Supabase] products fetch error:', err.message);
        setError(err.message);
        setConnected(false);
        // Keep previously loaded products in state so UI doesn't blank out
      } else {
        const mapped = (data as ProductRow[]).map(rowToProduct);
        cacheSet(CACHE_KEY, mapped);
        setConnected(true);
        setProducts(mapped);
        if (mapped.length === 0) {
          console.warn('[Supabase] products: 0 rows returned. Check RLS policies or active=true filter.');
        }
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [tick]);

  return {
    products,
    loading,
    error,
    connected,
    refetch: () => {
      cacheInvalidate('products:');
      setTick(t => t + 1);
    },
  };
}

interface UsePaginatedCatalogProductsResult {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function usePaginatedCatalogProducts(params: CatalogProductsParams): UsePaginatedCatalogProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const from = Math.max(0, (params.page - 1) * params.pageSize);
      const to = from + params.pageSize - 1;

      const query = applyCatalogFilters(
        supabase.from('products').select('*', { count: 'exact' }),
        params,
      );
      const { data, error: err, count } = await query.range(from, to);

      if (cancelled) return;

      if (err) {
        setProducts([]);
        setTotal(0);
        setError(err.message);
        setConnected(false);
      } else {
        setProducts(((data as ProductRow[]) ?? []).map(rowToProduct));
        setTotal(count ?? 0);
        setConnected(true);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [
    params.page,
    params.pageSize,
    params.category,
    params.subcategory,
    params.brand,
    params.saleOnly,
    params.stockFilter,
    params.searchTerm,
    params.sortBy,
  ]);

  return { products, total, loading, error, connected };
}

// ─── Single product by ID ─────────────────────────────────────────────────────
export function useSupabaseProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedId = extractProductIdFromParam(id);

  useEffect(() => {
    if (!resolvedId) {
      setProduct(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const CACHE_KEY = `products:id:${resolvedId}`;
    const cached = cacheGet<Product>(CACHE_KEY);
    setError(null);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      return;
    }

    setProduct(null);
    setLoading(true);

    (async () => {
      const fetchBySku = () =>
        supabase
          .from('products')
          .select('*')
          .eq('sku', resolvedId)
          .eq('active', true)
          .limit(1)
          .maybeSingle();

      const fetchById = () =>
        supabase
          .from('products')
          .select('*')
          .eq('id', resolvedId)
          .eq('active', true)
          .maybeSingle();

      const { data: skuData, error: skuErr } = await withRetry<ProductRow>(fetchBySku);
      const { data, error: err } = skuData
        ? { data: skuData, error: null }
        : await withRetry<ProductRow>(fetchById);

      if (cancelled) return;
      if (skuErr && !skuData) {
        setError(skuErr.message);
        setProduct(null);
      } else if (err || !data) {
        setError(err?.message || 'Not found');
        setProduct(null);
      } else {
        const mapped = rowToProduct(data as ProductRow);
        cacheSet(CACHE_KEY, mapped);
        setProduct(mapped);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [resolvedId]);

  return { product, loading, error };
}

// ─── Featured products ────────────────────────────────────────────────────────
export function useSupabaseFeatured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const CACHE_KEY = 'products:featured';
    const cached = cacheGet<Product[]>(CACHE_KEY);
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    (async () => {
      // 1. Try featured products
      const { data: featured } = await withRetry<ProductRow[]>(() =>
        supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .eq('featured', true)
          .order('id', { ascending: true })
          .limit(20)
      );

      if (cancelled) return;

      if (featured && featured.length > 0) {
        const mapped = (featured as ProductRow[]).map(rowToProduct);
        cacheSet(CACHE_KEY, mapped);
        setProducts(mapped);
        setLoading(false);
        return;
      }

      // 2. Fallback: any 7 active products
      const { data: fallback } = await withRetry<ProductRow[]>(() =>
        supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('id', { ascending: true })
          .limit(7)
      );

      if (!cancelled) {
        const mapped = (fallback as ProductRow[] ?? []).map(rowToProduct);
        cacheSet(CACHE_KEY, mapped);
        setProducts(mapped);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { products, loading };
}

// ─── Products by brand (for product page carousel) ────────────────────────────
export function useBrandProducts(brand: string | undefined, excludeId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) return;
    let cancelled = false;

    const CACHE_KEY = `products:brand:${brand}`;
    const cached = cacheGet<Product[]>(CACHE_KEY);
    if (cached) {
      setProducts(cached.filter(p => p.id !== excludeId));
      return;
    }

    setLoading(true);
    (async () => {
      const { data } = await withRetry<ProductRow[]>(() =>
        supabase
          .from('products')
          .select('*')
          .eq('brand', brand)
          .eq('active', true)
          .limit(24)
      );
      if (!cancelled && data) {
        const mapped = (data as ProductRow[]).map(rowToProduct);
        cacheSet(CACHE_KEY, mapped);
        setProducts(mapped.filter(p => p.id !== excludeId));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [brand, excludeId]);

  return { products, loading };
}

// ─── Toggle featured flag ─────────────────────────────────────────────────────
export async function setProductFeatured(id: string, featured: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ featured })
    .eq('id', id);
  // Invalidate related caches
  cacheInvalidate('products:featured');
  cacheInvalidate(`products:id:${id}`);
  cacheInvalidate('products:all');
  return error;
}

// ─── Product count (for hero stats) ───────────────────────────────────────────
function roundFloor50(n: number): string {
  const rounded = Math.floor(n / 50) * 50;
  return `${rounded}+`;
}

export function useProductCount() {
  const [display, setDisplay] = useState<string>('...');

  useEffect(() => {
    const CACHE_KEY = 'products:count';
    const cached = cacheGet<string>(CACHE_KEY, 5 * 60 * 1000); // 5 min
    if (cached) { setDisplay(cached); return; }

    (async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (!error && count !== null) {
        const val = roundFloor50(count);
        cacheSet(CACHE_KEY, val);
        setDisplay(val);
      }
    })();
  }, []);

  return display;
}

// ─── Category count (from live categories context) ────────────────────────────
export function useCategoryCount(): string {
  const categories = useCategories();
  return String(categories.length);
}

// ─── Promo count (товары с акциями - sale_price задан) ─────────────────────────
function roundFloor5(n: number): string {
  if (n === 0) return '0';
  const rounded = Math.floor(n / 5) * 5;
  return rounded > 0 ? `${rounded}+` : String(n);
}

export function usePromoCount() {
  const [display, setDisplay] = useState<string>('...');

  useEffect(() => {
    const CACHE_KEY = 'products:promo_count';
    const cached = cacheGet<string>(CACHE_KEY, 5 * 60 * 1000); // 5 min
    if (cached) { setDisplay(cached); return; }

    (async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .not('sale_price', 'is', null);
      if (!error && count !== null) {
        const val = roundFloor5(count);
        cacheSet(CACHE_KEY, val);
        setDisplay(val);
      }
    })();
  }, []);

  return display;
}

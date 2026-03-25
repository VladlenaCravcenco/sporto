import { useEffect, useState } from 'react';
import { supabase, type ProductRow } from '../../lib/supabase';
import { cacheGet, cacheSet, cacheInvalidate, TTL_DEFAULT } from '../../lib/queryCache';
import type { Product } from '../data/products';
import { categories } from '../data/products';

// Extract YouTube video ID from any YouTube URL
function extractYouTubeId(url: string | null): string | undefined {
  if (!url) return undefined;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1];
}

// Map a Supabase row → the Product interface used across the app
function rowToProduct(row: ProductRow): Product {
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
    cod: String(row.id),
    qty: row.qty ?? 0,
    inStock: (row.qty ?? 0) > 0,
    brand: row.brand || undefined,
  };
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

// ─── Supabase row limit ───────────────────────────────────────────────────────
// PostgREST default is 1000 rows. We set an explicit high limit so
// the API never silently truncates results. At 8k products the catalog
// uses server-side pagination (see Catalog.tsx), but other hooks that
// need the full list use this constant.
const MAX_ROWS = 10_000;

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
      const { data, error: err } = await withRetry<ProductRow[]>(() =>
        supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('id', { ascending: true })
          .limit(MAX_ROWS)
      );

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

// ─── Single product by ID ─────────────────────────────────────────────────────
export function useSupabaseProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;

    const CACHE_KEY = `products:id:${id}`;
    const cached = cacheGet<Product>(CACHE_KEY);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const { data, error: err } = await withRetry<ProductRow>(() =>
        supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
      );

      if (cancelled) return;
      if (err || !data) {
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
  }, [id]);

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

// ─── Category count (from static categories array) ────────────────────────────
export function useCategoryCount(): string {
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

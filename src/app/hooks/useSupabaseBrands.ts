import { useEffect, useState, useCallback } from 'react';
import { supabase, type BrandRow } from '../../lib/supabase';
import { cacheGet, cacheSet, cacheInvalidate, TTL_LONG } from '../../lib/queryCache';

// ─── Retry helper (same pattern as products hook) ─────────────────────────────
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
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return { data: null, error: lastError };
}

// ─── All brands (for admin) ───────────────────────────────────────────────────
export function useSupabaseBrands() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const CACHE_KEY = 'brands:all';
    const cached = cacheGet<BrandRow[]>(CACHE_KEY);
    if (cached) {
      setBrands(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: err } = await withRetry<BrandRow[]>(() =>
        supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true })
      );

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setBrands([]);
      } else {
        const rows = (data as BrandRow[]) ?? [];
        cacheSet(CACHE_KEY, rows);
        setBrands(rows);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [tick]);

  return {
    brands,
    loading,
    error,
    refetch: () => {
      cacheInvalidate('brands:');
      setTick(t => t + 1);
    },
  };
}

// ─── Active brands (public site) ─────────────────────────────────────────────
// Gets distinct brand names from active products, then fetches matching brand rows.
// Cached for 10 minutes — this is the heaviest query on the home page.
export function useActiveBrands() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const CACHE_KEY = 'brands:active';

    // Serve from cache immediately — avoids 2 DB round-trips on every page load
    const cached = cacheGet<BrandRow[]>(CACHE_KEY, TTL_LONG);
    if (cached) {
      setBrands(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Step 1: distinct brand names from active products
    // Select only the 'brand' column to keep payload tiny
    const { data: productRows } = await withRetry<Array<{ brand: string | null }>>(() =>
      supabase
        .from('products')
        .select('brand')
        .eq('active', true)
        .not('brand', 'is', null)
        .limit(10_000) // explicit limit — never silently truncated
    );

    if (!productRows || productRows.length === 0) {
      setBrands([]);
      setLoading(false);
      return;
    }

    const brandNames = [...new Set(
      productRows.map((r: { brand: string | null }) => r.brand).filter(Boolean) as string[]
    )];

    if (brandNames.length === 0) {
      setBrands([]);
      setLoading(false);
      return;
    }

    // Step 2: fetch only brands whose name is in that list
    const { data: brandRows } = await withRetry<BrandRow[]>(() =>
      supabase
        .from('brands')
        .select('*')
        .in('name', brandNames)
        .order('name', { ascending: true })
    );

    const rows = (brandRows as BrandRow[]) ?? [];
    cacheSet(CACHE_KEY, rows);
    setBrands(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { brands, loading };
}

// ─── Brand count per name (for admin list) ────────────────────────────────────
export function useBrandProductCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const CACHE_KEY = 'brands:counts';
    const cached = cacheGet<Record<string, number>>(CACHE_KEY);
    if (cached) { setCounts(cached); return; }

    (async () => {
      const { data } = await withRetry<Array<{ brand: string | null }>>(() =>
        supabase
          .from('products')
          .select('brand')
          .eq('active', true)
          .not('brand', 'is', null)
          .limit(10_000)
      );

      if (!data) return;
      const c: Record<string, number> = {};
      data.forEach(r => {
        if (r.brand) c[r.brand] = (c[r.brand] ?? 0) + 1;
      });
      cacheSet(CACHE_KEY, c);
      setCounts(c);
    })();
  }, []);

  return counts;
}

// ─── Get brand by name (for product detail pages) ────────────────────────────
export function useBrandByName(brandName: string | null | undefined) {
  const [brand, setBrand] = useState<BrandRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandName) {
      setBrand(null);
      setLoading(false);
      return;
    }

    const CACHE_KEY = `brand:${brandName}`;
    const cached = cacheGet<BrandRow>(CACHE_KEY);
    if (cached) {
      setBrand(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      const { data } = await withRetry<BrandRow>(() =>
        supabase
          .from('brands')
          .select('*')
          .ilike('name', brandName)
          .limit(1)
          .single()
      );

      if (data) {
        cacheSet(CACHE_KEY, data as BrandRow);
        setBrand(data as BrandRow);
      } else {
        setBrand(null);
      }
      setLoading(false);
    })();
  }, [brandName]);

  return { brand, loading };
}

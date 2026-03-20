/**
 * Simple in-memory query cache for Supabase results.
 *
 * Lives at module level → survives React unmount/remount cycles.
 * This means navigating Home → Catalog → Back → Catalog
 * reuses the cached result instead of hitting Supabase again.
 *
 * TTL: 2 minutes for most queries, 10 minutes for slow/heavy ones.
 */

const TTL_DEFAULT = 2 * 60 * 1000;  // 2 min
const TTL_LONG    = 10 * 60 * 1000; // 10 min

interface CacheEntry<T> {
  data: T;
  at: number; // Date.now() when cached
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string, ttl = TTL_DEFAULT): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.at > ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, at: Date.now() });
}

export function cacheInvalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export { TTL_DEFAULT, TTL_LONG };

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { findProductSkuMatches, normalizeSku, type SkuMatch } from '../../lib/product-sku';

type SkuStatus = { key: string; status: 'idle' | 'checking' | 'available' | 'conflict' | 'legacy' | 'error'; matches: SkuMatch[] };
export function useProductSkuStatus(value: string, productId: string | null, enabled: boolean) {
  const sku = normalizeSku(value);
  const key = JSON.stringify([sku, productId]);
  const [result, setResult] = useState<SkuStatus>({ key: '', status: 'idle', matches: [] });
  useEffect(() => {
    if (!enabled || !sku) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const all = await findProductSkuMatches(supabase, sku);
        if (!current) return;
        const matches = all.filter(row => row.id !== productId);
        const unchanged = all.some(row => row.id === productId);
        setResult({ key, status: matches.length ? (unchanged ? 'legacy' : 'conflict') : 'available', matches });
      } catch {
        if (current) setResult({ key, status: 'error', matches: [] });
      }
    }, 350);
    return () => { current = false; clearTimeout(timer); };
  }, [sku, productId, enabled, key]);
  if (!enabled || !sku) return { key, status: 'idle', matches: [] } as SkuStatus;
  return result.key === key ? result : { key, status: 'checking', matches: [] } as SkuStatus;
}

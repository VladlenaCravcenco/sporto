import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadSimilarityCatalog, similarProducts, type SimilarProduct } from '../../lib/similar-products';
export function useSimilarProducts(draft: { id: string | null; sku?: string | null; name_ro?: string | null; name_ru?: string | null }, enabled: boolean) {
  const [catalog, setCatalog] = useState<SimilarProduct[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setStatus('loading');
    loadSimilarityCatalog(supabase).then(rows => { if (current) { setCatalog(rows); setStatus('ready'); } }).catch(() => { if (current) { setCatalog([]); setStatus('error'); } });
    return () => { current = false; };
  }, [enabled, attempt]);
  const matches = useMemo(() => enabled && status === 'ready' ? similarProducts(catalog, draft) : [], [catalog, draft.id, draft.sku, draft.name_ro, draft.name_ru, enabled, status]);
  return { matches, status, retry: () => setAttempt(value => value + 1) };
}

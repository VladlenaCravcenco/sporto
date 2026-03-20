import { useState, useEffect } from 'react';
import { supabase, type BannerRow } from '../../lib/supabase';

interface UseBannersResult {
  banners: BannerRow[];
  loading: boolean;
  error: string | null;
}

export function useSupabaseBanners(): UseBannersResult {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (err) {
        // Table might not exist yet — not a critical error
        setError(err.message);
      } else {
        setBanners((data as BannerRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  return { banners, loading, error };
}

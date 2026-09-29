import { publicSnapshot } from './public-cache';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';

export interface BannerRow {
  id: string;
  title_ro: string | null;
  title_ru: string | null;
  subtitle_ro: string | null;
  subtitle_ru: string | null;
  cta_text_ro: string | null;
  cta_text_ru: string | null;
  cta_link: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

function createSupabase() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface HomeHeroData {
  banners: BannerRow[];
  brands: BrandItem[];
  featuredProducts: FeaturedProduct[];
  saleProducts: FeaturedProduct[];
  promoCount: string;
}

export interface FeaturedProduct {
  id: string;
  name_ro: string;
  name_ru: string | null;
  sku: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  qty: number | null;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

async function getActiveBrands(supabase: NonNullable<ReturnType<typeof createSupabase>>): Promise<BrandItem[]> {
  const { data, error } = await supabase.rpc('sporto_active_brands_v1');
  if (error) {
    console.error('[brands] Could not load active brands', error);
    return [];
  }
  return (data || []) as BrandItem[];
}

async function getFeaturedProducts(supabase: NonNullable<ReturnType<typeof createSupabase>>): Promise<FeaturedProduct[]> {
  const fields = 'id,name_ro,name_ru,sku,brand,price,sale_price,image_url,qty';
  const featured = await supabase
    .from('products')
    .select(fields)
    .eq('active', true)
    .eq('featured', true)
    .order('id', { ascending: true })
    .limit(20);

  if (!featured.error && featured.data?.length) return featured.data as FeaturedProduct[];

  const fallback = await supabase
    .from('products')
    .select(fields)
    .eq('active', true)
    .order('id', { ascending: true })
    .limit(12);

  return fallback.error ? [] : (fallback.data ?? []) as FeaturedProduct[];
}

async function getSaleProducts(supabase: NonNullable<ReturnType<typeof createSupabase>>): Promise<FeaturedProduct[]> {
  const products: FeaturedProduct[] = [];
  for (let from = 0; products.length < 20; from += 100) {
    const { data, error } = await supabase.from('products')
      .select('id,name_ro,name_ru,sku,brand,price,sale_price,image_url,qty')
      .eq('active', true).gt('sale_price', 0).order('id').range(from, from + 99);
    if (error || !data?.length) break;
    products.push(...data.filter(item => item.sale_price < item.price));
    if (data.length < 100) break;
  }
  return products.slice(0, 20);
}

function promoDisplay(count: number) {
  if (count === 0) return '0';
  const rounded = Math.floor(count / 5) * 5;
  return rounded > 0 ? `${rounded}+` : String(count);
}

async function loadgetHomeHeroData(): Promise<HomeHeroData> {
  const supabase = createSupabase();
  if (!supabase) {
    return {
      banners: [],
      brands: [],
      featuredProducts: [],
      saleProducts: [],
      promoCount: '0',
    };
  }

  const [bannersResult, promosResult, brands, featuredProducts, saleProducts] = await Promise.all([
    supabase.from('banners').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true).not('sale_price', 'is', null),
    getActiveBrands(supabase),
    getFeaturedProducts(supabase),
    getSaleProducts(supabase),
  ]);

  return {
    banners: bannersResult.error ? [] : ((bannersResult.data ?? []) as BannerRow[]),
    brands,
    featuredProducts,
    saleProducts,
    promoCount: promosResult.error ? '...' : promoDisplay(promosResult.count ?? 0),
  };
}

export const getHomeHeroData = publicSnapshot(loadgetHomeHeroData);

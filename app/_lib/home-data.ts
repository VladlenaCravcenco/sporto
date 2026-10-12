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

async function getSaleProducts(supabase: NonNullable<ReturnType<typeof createSupabase>>) {
  const { data, error } = await supabase.rpc('sporto_home_sales_v1');
  if (error || !data || !Array.isArray(data.products) || data.products.length > 20
    || !Number.isSafeInteger(data.total) || data.total < data.products.length) {
    console.error('[home sales] Could not load promotions', error || 'Invalid RPC response');
    return { products: [] as FeaturedProduct[], total: null };
  }
  return { products: data.products as FeaturedProduct[], total: data.total as number };
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

  const [bannersResult, brands, featuredProducts, sales] = await Promise.all([
    supabase.from('banners').select('*').eq('active', true).order('sort_order', { ascending: true }),
    getActiveBrands(supabase),
    getFeaturedProducts(supabase),
    getSaleProducts(supabase),
  ]);

  return {
    banners: bannersResult.error ? [] : ((bannersResult.data ?? []) as BannerRow[]),
    brands,
    featuredProducts,
    saleProducts: sales.products,
    promoCount: sales.total === null ? '...' : promoDisplay(sales.total),
  };
}

export const getHomeHeroData = publicSnapshot(loadgetHomeHeroData);

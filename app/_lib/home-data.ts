import { createClient } from '@supabase/supabase-js';

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

const url = process.env.VITE_SUPABASE_URL || 'https://ruvhllbbytjkxkzvusyb.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

function createSupabase() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface HomeHeroData {
  banners: BannerRow[];
  brands: BrandItem[];
  featuredProducts: FeaturedProduct[];
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

async function getActiveBrands(supabase: ReturnType<typeof createSupabase>): Promise<BrandItem[]> {
  const productBrands: Array<{ brand: string | null }> = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('active', true)
      .not('brand', 'is', null)
      .range(from, from + 999);

    if (error || !data?.length) break;
    productBrands.push(...data);
    if (data.length < 1000) break;
  }

  const names = [...new Set(productBrands.map(item => item.brand).filter((name): name is string => Boolean(name)))];
  if (names.length === 0) return [];

  const { data, error } = await supabase
    .from('brands')
    .select('id,name,slug,logo_url,active')
    .in('name', names)
    .order('name', { ascending: true });

  if (error) return [];
  const rows = (data ?? []) as Array<BrandItem & { active: boolean | null }>;
  return rows.filter(item => item.active !== false).map(({ id, name, slug, logo_url }) => ({ id, name, slug, logo_url }));
}

async function getFeaturedProducts(supabase: ReturnType<typeof createSupabase>): Promise<FeaturedProduct[]> {
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

  return fallback.error ? [] : fallback.data as FeaturedProduct[];
}

function promoDisplay(count: number) {
  if (count === 0) return '0';
  const rounded = Math.floor(count / 5) * 5;
  return rounded > 0 ? `${rounded}+` : String(count);
}

export async function getHomeHeroData(): Promise<HomeHeroData> {
  const supabase = createSupabase();

  const [bannersResult, promosResult, brands, featuredProducts] = await Promise.all([
    supabase.from('banners').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true).not('sale_price', 'is', null),
    getActiveBrands(supabase),
    getFeaturedProducts(supabase),
  ]);

  return {
    banners: bannersResult.error ? [] : (bannersResult.data as BannerRow[]),
    brands,
    featuredProducts,
    promoCount: promosResult.error ? '...' : promoDisplay(promosResult.count ?? 0),
  };
}

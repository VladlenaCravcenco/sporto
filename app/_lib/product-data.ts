import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './supabase-env';

export interface ProductDetail {
  id: string;
  name_ro: string;
  name_ru: string | null;
  sku: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  sale_price: number | null;
  qty: number | null;
  description_ro: string | null;
  description_ru: string | null;
  seo_description_ro: string | null;
  seo_description_ru: string | null;
  seo_keywords_ro: string | null;
  seo_keywords_ru: string | null;
  image_url: string | null;
  images: string[] | null;
  youtube_url: string | null;
  has_warranty: boolean;
}

export interface ProductBrand {
  name: string;
  slug: string | null;
  catalog_pdf: string | null;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductDetailData {
  product: ProductDetail;
  brand: ProductBrand | null;
  specifications: ProductSpecification[];
}

function createServerSupabase() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function extractYoutubeId(value: string | null) {
  if (!value) return null;
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);
  return match?.[1] || null;
}

export function getProductYoutubeId(product: ProductDetail) {
  return extractYoutubeId(product.youtube_url);
}

export async function getProductDetail(identifier: string, sku?: string): Promise<ProductDetailData | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;

  const fields = 'id,name_ro,name_ru,sku,brand,category,subcategory,price,sale_price,qty,description_ro,description_ru,seo_description_ro,seo_description_ru,seo_keywords_ro,seo_keywords_ru,image_url,images,youtube_url,has_warranty';
  let product: ProductDetail | null = null;

  if (sku) {
    const result = await supabase
      .from('products')
      .select(fields)
      .eq('id', sku)
      .eq('active', true)
      .maybeSingle();
    product = result.data as ProductDetail | null;
  }

  if (!product) {
    const result = await supabase
      .from('products')
      .select(fields)
      .eq('id', identifier)
      .eq('active', true)
      .maybeSingle();
    product = result.data as ProductDetail | null;
  }

  if (!product) {
    const result = await supabase
      .from('products')
      .select(fields)
      .eq('sku', sku || identifier)
      .eq('active', true)
      .maybeSingle();
    product = result.data as ProductDetail | null;
  }

  if (!product) return null;

  const [brandResult, attributesResult] = await Promise.all([
    product.brand
      ? supabase.from('brands').select('name,slug,catalog_pdf').ilike('name', product.brand).eq('active', true).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('product_attribute_values')
      .select('attribute_id,numeric_value,text_value,text_value_ro,text_value_ru,boolean_value,product_attributes!inner(name_ro,name_ru,unit,unit_ro,unit_ru,specification_enabled,sort_order)')
      .eq('product_id', product.id),
  ]);

  const specifications = (attributesResult.data || [])
    .filter((row: any) => row.product_attributes?.specification_enabled)
    .sort((a: any, b: any) => (a.product_attributes.sort_order || 0) - (b.product_attributes.sort_order || 0))
    .flatMap((row: any) => {
      const attribute = row.product_attributes;
      const value = row.numeric_value != null
        ? String(row.numeric_value)
        : row.boolean_value != null
          ? (row.boolean_value ? 'Da / Да' : 'Nu / Нет')
          : row.text_value_ro || row.text_value_ru || row.text_value;
      if (!value) return [];
      const unit = attribute.unit_ro || attribute.unit_ru || attribute.unit || '';
      return [{ name: attribute.name_ro || attribute.name_ru, value: `${value}${unit ? ` ${unit}` : ''}` }];
    });

  return {
    product,
    brand: brandResult.data as ProductBrand | null,
    specifications,
  };
}
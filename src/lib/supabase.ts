import { createClient } from '@supabase/supabase-js';

// ─── Переменные окружения (Vite) ──────────────────────────────────────────────
// Локально: файл .env в корне проекта
// На Vercel: Settings → Environment Variables
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://ruvhllbbytjkxkzvusyb.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dmhsbGJieXRqa3hrenZ1c3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjcxNzMsImV4cCI6MjA4ODU0MzE3M30.eCoWdTSOe8E4xEH7vy9q9lKc6AJWx3G0UbpU0ev-DgE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Row shape from Supabase ──────────────────────────────────────────────────
export interface ProductRow {
  id: string;
  name_ro: string;
  name_ru: string | null;
  sku: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  sale_price: number | null; // Акционная цена — если задана, старая цена перечёркивается
  unit: string | null;
  qty: number | null;
  description_ro: string | null;
  description_ru: string | null;
  image_url: string | null;
  images: string[] | null;   // gallery (images[0] === image_url)
  youtube_url: string | null; // full YouTube URL, e.g. https://youtu.be/abc123
  featured: boolean;
  active: boolean;
}

// ─── Banner row ───────────────────────────────────────────────────────────────
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

// ─── Brand row ────────────────────────────────────────────────────────────────
export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description_ro: string | null;
  description_ru: string | null;
  country_ro: string | null;
  country_ru: string | null;
  country_flag: string | null;
  founded: number | null;
  segment_ro: string | null;
  segment_ru: string | null;
  tagline_ro: string | null;
  tagline_ru: string | null;
  website: string | null;
  website_url: string | null;
  hero_image_url: string | null;
  banner_desktop_url: string | null;
  banner_mobile_url: string | null;
  catalog_pdf: string | null;
  created_at: string;
}

// ─── Category / Subcategory rows ──────────────────────────────────────────────
export interface CategoryRow {
  id: string;
  slug: string;
  name_ro: string;
  name_ru: string;
  description_ro: string | null;
  description_ru: string | null;
  sort_order: number;
  created_at: string;
}

export interface SubcategoryRow {
  id: string;
  category_slug: string;
  slug: string;
  name_ro: string;
  name_ru: string;
  sort_order: number;
  created_at: string;
}

// ─── Client (registered user) row ─────────────────────────────────────────────
export interface ClientRow {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  client_type: 'individual' | 'company' | null;
  notes: string | null;
  created_at: string;
}

// ─── Order request row ────────────────────────────────────────────────────────
export interface OrderRequestRow {
  id: string;
  client_name: string;
  client_company: string | null;
  client_email: string;
  client_phone: string | null;
  client_type: 'individual' | 'company' | null;
  delivery_address: string | null;
  notes: string | null;
  admin_comment?: string | null;
  cart_items: Array<{
    id: string;
    name_ro: string;
    name_ru: string;
    sku: string | null;
    price: number;
    qty: number;
    image_url: string | null;
  }>;
  total_price: number;
  total_items: number;
  status: 'new' | 'in_progress' | 'done' | 'cancelled';
  created_at: string;
}

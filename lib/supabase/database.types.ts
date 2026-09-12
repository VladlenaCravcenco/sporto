/**
 * Database type definitions for Supabase
 * Auto-generated from Supabase schema
 * Update this file when database schema changes
 */

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name_ro: string;
          name_ru: string | null;
          sku: string | null;
          brand: string | null;
          category: string;
          subcategory: string | null;
          price: number;
          sale_price: number | null;
          unit: string;
          qty: number;
          description_ro: string;
          description_ru: string;
          seo_description_ro: string | null;
          seo_description_ru: string | null;
          seo_keywords_ro: string | null;
          seo_keywords_ru: string | null;
          image_url: string | null;
          images: string[];
          youtube_url: string | null;
          featured: boolean;
          has_warranty: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      brands: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          banner_url: string | null;
          catalog_pdf: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: Omit<Database['public']['Tables']['brands']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_ro: string;
          name_ru: string;
          icon: string | null;
          [key: string]: unknown;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name_ro: string;
          name_ru: string;
          [key: string]: unknown;
        };
        Insert: Omit<Database['public']['Tables']['subcategories']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['subcategories']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      order_requests: {
        Row: {
          id: string;
          client_id: string | null;
          product_ids: string[];
          status: 'pending' | 'processing' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
          [key: string]: unknown;
        };
        Insert: Omit<Database['public']['Tables']['order_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['order_requests']['Insert']>;
      };
      page_content: {
        Row: {
          key: string;
          content: Record<string, unknown>;
          [key: string]: unknown;
        };
        Insert: Database['public']['Tables']['page_content']['Row'];
        Update: Partial<Database['public']['Tables']['page_content']['Insert']>;
      };
      site_settings: {
        Row: {
          key: string;
          value: string;
          [key: string]: unknown;
        };
        Insert: Database['public']['Tables']['site_settings']['Row'];
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
      };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
};

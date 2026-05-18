-- Add localized SEO fields for product pages.
-- Run in Supabase SQL Editor.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seo_description_ro TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_ru TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords_ro TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords_ru TEXT;

COMMENT ON COLUMN products.seo_description_ro IS 'Meta description pentru pagina produsului in romana.';
COMMENT ON COLUMN products.seo_description_ru IS 'Meta description pentru pagina produsului in rusa.';
COMMENT ON COLUMN products.seo_keywords_ro IS 'SEO keywords pentru pagina produsului in romana, separate prin virgula.';
COMMENT ON COLUMN products.seo_keywords_ru IS 'SEO keywords pentru pagina produsului in rusa, separate prin virgula.';

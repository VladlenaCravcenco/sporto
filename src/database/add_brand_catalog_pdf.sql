-- Add catalog_pdf column to brands table
-- This column stores the URL of the brand's PDF catalog
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS catalog_pdf TEXT;

COMMENT ON COLUMN brands.catalog_pdf IS 'URL of the brand PDF catalog for download';

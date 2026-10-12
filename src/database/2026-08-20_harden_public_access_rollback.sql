-- Emergency staging rollback for 2026-08-20_harden_public_access.sql.
-- This deliberately restores the audited insecure access model. Never leave
-- production in this state; prefer fixing and reapplying the forward migration.

BEGIN;

DO $$
DECLARE
  table_name text;
  policy_row record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'banners', 'brands', 'categories', 'faq_items', 'page_content',
    'product_attribute_values', 'product_attributes', 'products',
    'site_settings', 'subcategories'
  ]
  LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, table_name);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      'Legacy permissive access ' || table_name,
      table_name
    );
    EXECUTE format(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated',
      table_name
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public reads audited media" ON storage.objects;
DROP POLICY IF EXISTS "Sporto admin inserts audited media" ON storage.objects;
DROP POLICY IF EXISTS "Sporto admin updates audited media" ON storage.objects;
DROP POLICY IF EXISTS "Sporto admin deletes audited media" ON storage.objects;

CREATE POLICY "Legacy public manages audited media"
  ON storage.objects FOR ALL TO anon, authenticated
  USING (bucket_id IN ('brand-logos', 'product-images'))
  WITH CHECK (bucket_id IN ('brand-logos', 'product-images'));

GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC, anon, authenticated;

COMMIT;


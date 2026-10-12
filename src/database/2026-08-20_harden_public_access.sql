-- SPORTO.MD security hardening.
-- Apply to a closed staging Supabase project first. Do not run directly in production.
-- The temporary admin identity matches the current browser admin implementation.
-- Replace it with server-side authorization during Phase 3.

BEGIN;

DO $$
DECLARE
  table_name text;
  policy_row record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'banners',
    'brands',
    'categories',
    'faq_items',
    'page_content',
    'product_attribute_values',
    'product_attributes',
    'products',
    'site_settings',
    'subcategories'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Expected table public.% is missing; migration aborted', table_name;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_row.policyname,
        table_name
      );
    END LOOP;

    -- anon only needs SELECT. authenticated keeps DML table privileges so the
    -- current authenticated admin can write; RLS below blocks regular users.
    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM anon',
      table_name
    );
    EXECUTE format(
      'REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM authenticated',
      table_name
    );
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', table_name);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);
  END LOOP;
END $$;

-- Public catalog reads expose only active products.
CREATE POLICY "Public reads active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (active IS TRUE);

CREATE POLICY "Sporto admin manages products"
  ON public.products FOR ALL TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com');

-- These tables already supplied public site content. Preserve reads while
-- separating them from admin-only mutations.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'banners',
    'brands',
    'categories',
    'faq_items',
    'page_content',
    'product_attribute_values',
    'product_attributes',
    'site_settings',
    'subcategories'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      'Public reads ' || table_name,
      table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (lower(coalesce(auth.jwt() ->> ''email'', '''')) = ''sporto-admin@gmail.com'') WITH CHECK (lower(coalesce(auth.jwt() ->> ''email'', '''')) = ''sporto-admin@gmail.com'')',
      'Sporto admin manages ' || table_name,
      table_name
    );
  END LOOP;
END $$;

-- Remove only policies that target the two audited buckets, leaving policies
-- for any subsequently-created bucket untouched.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        coalesce(qual, '') ~ '''(brand-logos|product-images)'''
        OR coalesce(with_check, '') ~ '''(brand-logos|product-images)'''
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_row.policyname);
  END LOOP;
END $$;

CREATE POLICY "Public reads audited media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('brand-logos', 'product-images'));

CREATE POLICY "Sporto admin inserts audited media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('brand-logos', 'product-images')
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com'
  );

CREATE POLICY "Sporto admin updates audited media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('brand-logos', 'product-images')
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com'
  )
  WITH CHECK (
    bucket_id IN ('brand-logos', 'product-images')
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com'
  );

CREATE POLICY "Sporto admin deletes audited media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('brand-logos', 'product-images')
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com'
  );

-- Event-trigger helpers are not application RPCs.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

COMMIT;


-- SPORTO: additive catalog optimization, version 1.
-- Run this entire file in Supabase SQL Editor.
-- Does not delete data or change RLS policies.
-- Search remains on the existing smart-search path until its rules are migrated.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE INDEX IF NOT EXISTS sporto_catalog_category_active_idx
  ON public.products (category, subcategory, id) WHERE active = true;
CREATE INDEX IF NOT EXISTS sporto_catalog_brand_active_idx
  ON public.products (brand, id) WHERE active = true;
CREATE INDEX IF NOT EXISTS sporto_catalog_price_active_idx
  ON public.products ((CASE WHEN sale_price > 0 AND sale_price < price THEN sale_price ELSE price END), id)
  WHERE active = true;
-- Attribute indexes already exist in add_dynamic_product_attributes.sql.
-- Keep the same names to avoid creating duplicate indexes.
CREATE INDEX IF NOT EXISTS product_attribute_values_number_idx
  ON public.product_attribute_values (attribute_id, numeric_value) WHERE numeric_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_attribute_values_text_idx
  ON public.product_attribute_values (attribute_id, text_value) WHERE text_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_attribute_values_boolean_idx
  ON public.product_attribute_values (attribute_id, boolean_value) WHERE boolean_value IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sporto_filter_values_v1(filters jsonb, filter_key text)
RETURNS text[] LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = ''
AS $function$
  SELECT COALESCE(array_agg(value), ARRAY[]::text[])
  FROM jsonb_array_elements_text(
    CASE jsonb_typeof(filters -> filter_key)
      WHEN 'array' THEN filters -> filter_key
      WHEN 'string' THEN jsonb_build_array(filters -> filter_key)
      ELSE '[]'::jsonb END
  ) AS entries(value)
  WHERE value <> '';
$function$;

CREATE OR REPLACE FUNCTION public.sporto_catalog_v1(
  filters jsonb DEFAULT '{}'::jsonb,
  page_number integer DEFAULT 1,
  sort_order text DEFAULT 'recommended',
  locale text DEFAULT 'ro'
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
AS $function$
DECLARE
  answer jsonb;
  cats text[] := public.sporto_filter_values_v1(filters, 'category');
  subs text[] := public.sporto_filter_values_v1(filters, 'subcategory');
  brands text[] := public.sporto_filter_values_v1(filters, 'brand');
  stock text[] := public.sporto_filter_values_v1(filters, 'stock');
  only_sale boolean := 'true' = ANY(public.sporto_filter_values_v1(filters, 'sale'));
  warranty boolean := 'true' = ANY(public.sporto_filter_values_v1(filters, 'warranty'));
  v_min_price numeric := NULLIF((public.sporto_filter_values_v1(filters, 'minPrice'))[1], '')::numeric;
  v_max_price numeric := NULLIF((public.sporto_filter_values_v1(filters, 'maxPrice'))[1], '')::numeric;
BEGIN
  IF filters IS NULL OR jsonb_typeof(filters) <> 'object' OR octet_length(filters::text) > 16000 THEN
    RAISE EXCEPTION 'Invalid filters' USING ERRCODE = '22023';
  END IF;
  IF page_number IS NULL OR page_number < 1 OR page_number > 100000
    OR sort_order IS NULL OR sort_order NOT IN ('recommended','price-asc','price-desc','name-asc')
    OR locale IS NULL OR locale NOT IN ('ro','ru') THEN
    RAISE EXCEPTION 'Invalid pagination, sort or locale' USING ERRCODE = '22023';
  END IF;
  IF cardinality(public.sporto_filter_values_v1(filters, 'search')) > 0 THEN
    RAISE EXCEPTION 'Smart search uses the existing search endpoint' USING ERRCODE = '22023';
  END IF;

  WITH definitions AS MATERIALIZED (
    SELECT a.* FROM public.product_attributes a
    WHERE a.active = true AND a.filter_enabled = true AND a.value_type <> 'text'
      AND (cardinality(cats) = 0 OR COALESCE(cardinality(a.category_ids),0) = 0 OR a.category_ids && cats)
  ), attribute_values AS MATERIALIZED (
    SELECT v.product_id, 'attr.' || a.id::text AS key,
      CASE a.value_type
        WHEN 'number' THEN 'num:' || trim_scale(v.numeric_value)::text
        WHEN 'boolean' THEN v.boolean_value::text
        ELSE v.text_value END AS value
    FROM public.product_attribute_values v
    JOIN definitions a ON a.id = v.attribute_id
  ), checked AS MATERIALIZED (
    SELECT p.id,p.name_ro,p.name_ru,p.sku,p.brand,p.category,p.subcategory,p.price,p.sale_price,p.image_url,p.qty,p.has_warranty, CASE WHEN p.sale_price > 0 AND p.sale_price < p.price THEN p.sale_price ELSE p.price END AS effective_price,
      array_remove(ARRAY[
        CASE WHEN cardinality(cats)>0 AND NOT COALESCE(p.category=ANY(cats),false) THEN 'category' END,
        CASE WHEN cardinality(subs)>0 AND NOT COALESCE(p.subcategory=ANY(subs),false) THEN 'subcategory' END,
        CASE WHEN cardinality(brands)>0 AND NOT COALESCE(p.brand=ANY(brands),false) THEN 'brand' END,
        CASE WHEN cardinality(stock)>0 AND NOT ((CASE WHEN COALESCE(p.qty,0)>0 THEN 'inStock' ELSE 'onOrder' END)=ANY(stock)) THEN 'stock' END,
        CASE WHEN only_sale AND NOT COALESCE(p.sale_price>0 AND p.sale_price<p.price,false) THEN 'sale' END,
        CASE WHEN warranty AND NOT COALESCE(p.has_warranty,false) THEN 'warranty' END,
        CASE WHEN (CASE WHEN p.sale_price>0 AND p.sale_price<p.price THEN p.sale_price ELSE p.price END)<v_min_price
               OR (CASE WHEN p.sale_price>0 AND p.sale_price<p.price THEN p.sale_price ELSE p.price END)>v_max_price THEN 'price' END
      ], NULL) || ARRAY(
        SELECT 'attr.' || a.id::text FROM definitions a
        WHERE cardinality(public.sporto_filter_values_v1(filters,'attr.' || a.id::text)) > 0
          AND NOT EXISTS (
            SELECT 1 FROM attribute_values v WHERE v.product_id=p.id AND v.key='attr.' || a.id::text
              AND v.value=ANY(public.sporto_filter_values_v1(filters,'attr.' || a.id::text))
          )
      ) AS failed
    FROM public.products p WHERE p.active = true
  ), matching AS MATERIALIZED (
    SELECT * FROM checked WHERE cardinality(failed)=0
  ), page_rows AS (
    SELECT id,name_ro,name_ru,sku,brand,category,subcategory,price,sale_price,image_url,qty,has_warranty
    FROM matching
    ORDER BY
      CASE WHEN sort_order='price-asc' THEN effective_price END ASC,
      CASE WHEN sort_order='price-desc' THEN effective_price END DESC,
      CASE WHEN sort_order='recommended' THEN CASE WHEN lower(brand)='insportline' THEN 0 ELSE 1 END END ASC,
      CASE WHEN sort_order IN ('recommended','name-asc') THEN CASE WHEN locale='ru' THEN COALESCE(NULLIF(name_ru,''),name_ro) ELSE name_ro END END ASC,
      id ASC
    LIMIT 24 OFFSET ((page_number-1)::bigint*24)
  ), facet_values AS (
    SELECT p.id, p.failed, v.key, v.value FROM checked p
    CROSS JOIN LATERAL (VALUES
      ('category',p.category),('subcategory',p.subcategory),('brand',p.brand),
      ('stock',CASE WHEN COALESCE(p.qty,0)>0 THEN 'inStock' ELSE 'onOrder' END),
      ('sale',CASE WHEN p.effective_price<p.price THEN 'true' END),
      ('warranty',CASE WHEN p.has_warranty THEN 'true' END)
    ) v(key,value)
    UNION ALL
    SELECT p.id,p.failed,v.key,v.value FROM checked p JOIN attribute_values v ON v.product_id=p.id
  ), counts AS (
    SELECT key,value,count(DISTINCT id) FILTER (WHERE cardinality(array_remove(failed,key))=0) AS count
    FROM facet_values WHERE value IS NOT NULL AND value<>'' GROUP BY key,value
  ), price_bounds AS (
    SELECT COALESCE(min(effective_price),0) AS minimum,COALESCE(max(effective_price),0) AS maximum
    FROM checked WHERE cardinality(array_remove(failed,'price'))=0
  )
  SELECT jsonb_build_object(
    'products',COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM page_rows r),'[]'::jsonb),
    'totalProducts',(SELECT count(*) FROM matching),
    'page',page_number,'pageSize',24,
    'facets',COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM counts c),'[]'::jsonb),
    'minPrice',(SELECT pb.minimum FROM price_bounds pb),'maxPrice',(SELECT pb.maximum FROM price_bounds pb)
  ) INTO answer;
  RETURN answer;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sporto_active_brands_v1()
RETURNS TABLE(id text,name text,slug text,logo_url text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $function$
  SELECT b.id::text,b.name,b.slug,b.logo_url FROM public.brands b
  WHERE b.active IS DISTINCT FROM false AND EXISTS (
    SELECT 1 FROM public.products p WHERE p.active=true AND p.brand=b.name
  ) ORDER BY b.name;
$function$;

REVOKE ALL ON FUNCTION public.sporto_filter_values_v1(jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_catalog_v1(jsonb,integer,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_active_brands_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sporto_filter_values_v1(jsonb,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.sporto_catalog_v1(jsonb,integer,text,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.sporto_active_brands_v1() TO anon,authenticated,service_role;
NOTIFY pgrst, 'reload schema';
-- Read-only smoke check before committing the migration. Expected: page_size <= 24 and a nonzero total for an active catalog.
SELECT result->>'totalProducts' AS total_products,
       jsonb_array_length(result->'products') AS page_size
FROM (SELECT public.sporto_catalog_v1() AS result) check_result;

COMMIT;

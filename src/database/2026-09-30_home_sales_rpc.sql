-- Run the entire file in Supabase SQL Editor before deploying.
-- Does not change products or RLS. Edits in admin automatically update the index.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE INDEX IF NOT EXISTS sporto_home_sales_active_idx
  ON public.products (id)
  WHERE active = true AND sale_price > 0 AND sale_price < price;

CREATE OR REPLACE FUNCTION public.sporto_home_sales_v1()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'products', COALESCE((
      SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id)
      FROM (
        SELECT id,name_ro,name_ru,sku,brand,price,sale_price,image_url,qty
        FROM public.products
        WHERE active = true AND sale_price > 0 AND sale_price < price
        ORDER BY id LIMIT 20
      ) p
    ), '[]'::jsonb),
    'total', (
      SELECT count(*) FROM public.products
      WHERE active = true AND sale_price > 0 AND sale_price < price
    )
  );
$function$;

REVOKE ALL ON FUNCTION public.sporto_home_sales_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sporto_home_sales_v1() TO anon,authenticated,service_role;
NOTIFY pgrst, 'reload schema';
-- Both fields use the same definition of a discount and the same database snapshot.
SELECT result->>'total' AS total_sales,
       jsonb_array_length(result->'products') AS displayed_products
FROM (SELECT public.sporto_home_sales_v1() AS result) check_result;
COMMIT;

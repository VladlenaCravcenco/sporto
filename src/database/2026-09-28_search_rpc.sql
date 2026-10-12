-- Run AFTER 2026-09-28_catalog_rpc.sql, before deploying the new application.
-- Additive: no product changes, no RLS changes, no new columns in SELECT *.
-- Indexes update automatically on product edits/imports.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.sporto_search_norm_v1(value text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SECURITY INVOKER SET search_path = ''
AS $fn$
  SELECT btrim(translate(regexp_replace(normalize(lower(COALESCE(value,'')), NFD),
    U&'[\0300-\036f]', '', 'g'), 'șşțţ', 'sstt'));
$fn$;

CREATE OR REPLACE FUNCTION public.sporto_search_document_v1(
  name_ro text, name_ru text, description_ro text, description_ru text,
  category text, subcategory text, brand text, sku text, id text
) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SECURITY INVOKER SET search_path = ''
AS $fn$
  SELECT public.sporto_search_norm_v1(COALESCE(name_ro,'') || ' ' || COALESCE(name_ru,'') || ' ' ||
    COALESCE(description_ro,'') || ' ' || COALESCE(description_ru,'') || ' ' ||
    COALESCE(category,'') || ' ' || COALESCE(subcategory,'') || ' ' || COALESCE(brand,'') || ' ' ||
    COALESCE(sku,'') || ' ' || COALESCE(id,''));
$fn$;

-- pg_trgm may already live in public or extensions. Use its actual namespace.
DO $migration$
DECLARE trgm_schema text;
BEGIN
  SELECT n.nspname INTO STRICT trgm_schema FROM pg_extension e
    JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm';
  EXECUTE format('CREATE INDEX IF NOT EXISTS sporto_search_document_trgm_idx ON public.products USING gin
    (public.sporto_search_document_v1(name_ro,name_ru,description_ro,description_ru,category,subcategory,brand,sku,id) %I.gin_trgm_ops)
    WHERE active=true', trgm_schema);
  EXECUTE format('CREATE INDEX IF NOT EXISTS sporto_search_title_trgm_idx ON public.products USING gin
    (public.sporto_search_norm_v1(COALESCE(name_ro,'''') || '' '' || COALESCE(name_ru,'''') || '' '' || COALESCE(brand,'''')) %I.gin_trgm_ops)
    WHERE active=true', trgm_schema);

  EXECUTE replace($ddl$
CREATE OR REPLACE FUNCTION public.sporto_search_score_v1(p public.products, spec jsonb, locale text)
RETURNS TABLE(score integer, match_type text)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
SET pg_trgm.word_similarity_threshold = '0.4'
AS $fn$
DECLARE
  token text;
  name text := public.sporto_search_norm_v1(CASE WHEN locale='ru' THEN COALESCE(NULLIF(p.name_ru,''),p.name_ro) ELSE p.name_ro END);
  other_name text := public.sporto_search_norm_v1(CASE WHEN locale='ru' THEN p.name_ro ELSE p.name_ru END);
  brand text := public.sporto_search_norm_v1(p.brand);
  sku text := public.sporto_search_norm_v1(p.sku);
  description text := public.sporto_search_norm_v1(COALESCE(p.description_ro,'') || ' ' || COALESCE(p.description_ru,''));
  category text := public.sporto_search_norm_v1(COALESCE(p.category,'') || ' ' || COALESCE(p.subcategory,''));
  document text := public.sporto_search_document_v1(p.name_ro,p.name_ru,p.description_ro,p.description_ru,p.category,p.subcategory,p.brand,p.sku,p.id);
BEGIN
  score := 0; match_type := 'exact';
  FOR token IN SELECT value FROM jsonb_array_elements_text(spec->'raw') LOOP
    IF token=sku OR token=public.sporto_search_norm_v1(p.id) THEN
      score := 1000; match_type := 'exact'; RETURN NEXT; RETURN;
    ELSIF strpos(sku,token)>0 THEN score := score+80;
    ELSIF brand=token THEN score := score+60;
    ELSIF starts_with(brand,token) THEN score := score+45;
    ELSIF strpos(brand,token)>0 THEN score := score+30;
    ELSIF starts_with(name,token) THEN score := score+20;
    ELSIF strpos(name,token)>0 THEN score := score+12;
    ELSIF starts_with(other_name,token) THEN score := score+16;
    ELSIF strpos(other_name,token)>0 THEN score := score+8;
    ELSIF strpos(description,token)>0 THEN score := score+4;
    ELSIF strpos(category,token)>0 THEN score := score+6;
    ELSIF length(token)>=4 AND token !~ '^[0-9]+$' AND
      (name OPERATOR(__TRGM_SCHEMA__.%>) token OR other_name OPERATOR(__TRGM_SCHEMA__.%>) token OR brand OPERATOR(__TRGM_SCHEMA__.%>) token)
      THEN score := score+4; match_type := 'fuzzy';
    ELSIF EXISTS (SELECT 1 FROM jsonb_array_elements_text(spec->'synonyms') s(value)
      WHERE s.value<>token AND strpos(document,s.value)>0)
      THEN score := score+5; IF match_type='exact' THEN match_type := 'synonym'; END IF;
    ELSIF EXISTS (SELECT 1 FROM jsonb_array_elements_text(spec->'concepts') s(value) WHERE strpos(document,s.value)>0)
      THEN score := score+3; IF match_type='exact' THEN match_type := 'concept'; END IF;
    ELSE RETURN;
    END IF;
  END LOOP;
  score := greatest(score,1);
  RETURN NEXT;
END;
$fn$;
$ddl$, '__TRGM_SCHEMA__', quote_ident(trgm_schema));

  EXECUTE replace($ddl$
CREATE OR REPLACE FUNCTION public.sporto_search_matches_v1(spec jsonb, locale text DEFAULT 'ro')
RETURNS TABLE(product_id text, score integer, match_type text)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
SET pg_trgm.word_similarity_threshold = '0.4'
AS $fn$
DECLARE
  raw_tokens text[];
  terms text[];
  min_price numeric;
  max_price numeric;
  exact_count integer;
BEGIN
  IF spec IS NULL OR jsonb_typeof(spec)<>'object' OR octet_length(spec::text)>16000
    OR jsonb_typeof(spec->'raw') IS DISTINCT FROM 'array'
    OR jsonb_typeof(spec->'synonyms') IS DISTINCT FROM 'array'
    OR jsonb_typeof(spec->'concepts') IS DISTINCT FROM 'array'
    OR locale IS NULL OR locale NOT IN ('ro','ru') THEN
    RAISE EXCEPTION 'Invalid search specification' USING ERRCODE='22023';
  END IF;
  raw_tokens := public.sporto_filter_values_v1(spec,'raw');
  terms := ARRAY(SELECT DISTINCT t FROM unnest(raw_tokens || public.sporto_filter_values_v1(spec,'synonyms') ||
    public.sporto_filter_values_v1(spec,'concepts')) t);
  min_price := (spec->>'min')::numeric; max_price := (spec->>'max')::numeric;
  IF cardinality(raw_tokens)>16 OR cardinality(terms)>192
    OR EXISTS(SELECT 1 FROM unnest(terms) t WHERE length(t)>160 OR length(t)=0)
    OR (cardinality(raw_tokens)=0 AND min_price IS NULL AND max_price IS NULL)
    OR min_price<0 OR max_price<0 OR min_price>1000000000 OR max_price>1000000000
    OR min_price='NaN'::numeric OR max_price='NaN'::numeric THEN
    RAISE EXCEPTION 'Search exceeds allowed bounds' USING ERRCODE='22023';
  END IF;

  -- Exact internal code / SKU needs only the existing PK or the small SKU index.
  IF cardinality(raw_tokens)=1 THEN
    RETURN QUERY SELECT p.id,1000,'exact'::text FROM public.products p
      WHERE p.active=true AND (p.id=raw_tokens[1] OR public.sporto_search_norm_v1(p.sku)=raw_tokens[1])
        AND (min_price IS NULL OR p.price>=min_price) AND (max_price IS NULL OR p.price<=max_price);
    GET DIAGNOSTICS exact_count = ROW_COUNT;
    IF exact_count>0 THEN RETURN; END IF;
  END IF;

  RETURN QUERY
  WITH candidates AS MATERIALIZED (
    SELECT p.id FROM unnest(terms) t(term)
    CROSS JOIN LATERAL (
      SELECT q.id FROM public.products q WHERE q.active=true AND
        public.sporto_search_document_v1(q.name_ro,q.name_ru,q.description_ro,q.description_ru,q.category,q.subcategory,q.brand,q.sku,q.id)
        LIKE '%' || replace(replace(replace(t.term, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%'
    ) p
    UNION
    SELECT p.id FROM unnest(raw_tokens) t(term)
    CROSS JOIN LATERAL (
      SELECT q.id FROM public.products q WHERE q.active=true AND
        public.sporto_search_norm_v1(COALESCE(q.name_ro,'') || ' ' || COALESCE(q.name_ru,'') || ' ' || COALESCE(q.brand,''))
          OPERATOR(__TRGM_SCHEMA__.%>) t.term
    ) p WHERE length(t.term)>=4 AND t.term !~ '^[0-9]+$'
    UNION
    SELECT p.id FROM public.products p WHERE p.active=true AND cardinality(raw_tokens)=0
  )
  SELECT p.id,s.score,s.match_type FROM candidates c JOIN public.products p ON p.id=c.id
    CROSS JOIN LATERAL public.sporto_search_score_v1(p,spec,locale) s
  WHERE p.active=true AND (min_price IS NULL OR p.price>=min_price) AND (max_price IS NULL OR p.price<=max_price);
END;
$fn$;
$ddl$, '__TRGM_SCHEMA__', quote_ident(trgm_schema));
END;
$migration$;

CREATE INDEX IF NOT EXISTS sporto_search_sku_idx ON public.products (public.sporto_search_norm_v1(sku)) WHERE active=true;

CREATE OR REPLACE FUNCTION public.sporto_search_v1(spec jsonb, locale text DEFAULT 'ro')
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $fn$
  WITH matches AS MATERIALIZED (SELECT * FROM public.sporto_search_matches_v1(spec,locale)),
  best AS (
    SELECT p.id,p.name_ro,p.name_ru,p.sku,p.brand,p.category,p.subcategory,p.price,p.sale_price,p.image_url,p.qty,m.score,m.match_type
    FROM matches m JOIN public.products p ON p.id=m.product_id
    ORDER BY m.score DESC,p.id LIMIT 8
  )
  SELECT jsonb_build_object(
    'products',COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.score DESC,b.id) FROM best b),'[]'::jsonb),
    'total',(SELECT count(*) FROM matches),
    'brands',COALESCE((SELECT jsonb_agg(b.brand) FROM (
      SELECT p.brand FROM matches m JOIN public.products p ON p.id=m.product_id WHERE p.brand IS NOT NULL
      GROUP BY p.brand ORDER BY max(m.score) DESC,p.brand LIMIT 6) b),'[]'::jsonb),
    'categories',COALESCE((SELECT jsonb_agg(c.category) FROM (
      SELECT p.category FROM matches m JOIN public.products p ON p.id=m.product_id WHERE p.category IS NOT NULL
      GROUP BY p.category ORDER BY max(m.score) DESC,p.category LIMIT 4) c),'[]'::jsonb),
    'hasFuzzy',EXISTS(SELECT 1 FROM matches WHERE match_type='fuzzy'),
    'hasSynonym',EXISTS(SELECT 1 FROM matches WHERE match_type='synonym'),
    'hasConcept',EXISTS(SELECT 1 FROM matches WHERE match_type='concept'),
    'suggestions',COALESCE((SELECT jsonb_agg(t.value) FROM (
      SELECT r.value FROM jsonb_array_elements_text(spec->'raw') r(value)
      WHERE NOT EXISTS(SELECT 1 FROM matches) AND jsonb_array_length(spec->'raw')>1 AND length(r.value)>=3
        AND EXISTS(SELECT 1 FROM public.sporto_search_matches_v1(
          jsonb_build_object('raw',jsonb_build_array(r.value),'synonyms','[]'::jsonb,'concepts','[]'::jsonb),locale))
      LIMIT 3) t),'[]'::jsonb)
  );
$fn$;

-- Separate RPC keeps the existing non-search catalog and older deployments compatible.
CREATE OR REPLACE FUNCTION public.sporto_catalog_search_v1(
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

  WITH search_matches AS MATERIALIZED (
    SELECT * FROM public.sporto_search_matches_v1(filters->'searchSpec',locale)
  ), definitions AS MATERIALIZED (
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
    JOIN search_matches sm ON sm.product_id=v.product_id
    JOIN definitions a ON a.id = v.attribute_id
  ), checked AS MATERIALIZED (
    SELECT sm.score AS search_score,p.id,p.name_ro,p.name_ru,p.sku,p.brand,p.category,p.subcategory,p.price,p.sale_price,p.image_url,p.qty,p.has_warranty, CASE WHEN p.sale_price > 0 AND p.sale_price < p.price THEN p.sale_price ELSE p.price END AS effective_price,
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
    FROM public.products p JOIN search_matches sm ON sm.product_id=p.id WHERE p.active = true
  ), matching AS MATERIALIZED (
    SELECT * FROM checked WHERE cardinality(failed)=0
  ), page_rows AS (
    SELECT id,name_ro,name_ru,sku,brand,category,subcategory,price,sale_price,image_url,qty,has_warranty
    FROM matching
    ORDER BY
      CASE WHEN sort_order='price-asc' THEN effective_price END ASC,
      CASE WHEN sort_order='price-desc' THEN effective_price END DESC,
      CASE WHEN sort_order='recommended' THEN search_score END DESC,
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


REVOKE ALL ON FUNCTION public.sporto_search_norm_v1(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_search_document_v1(text,text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_search_score_v1(public.products,jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_search_matches_v1(jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_search_v1(jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sporto_catalog_search_v1(jsonb,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sporto_search_norm_v1(text),
  public.sporto_search_document_v1(text,text,text,text,text,text,text,text,text),
  public.sporto_search_score_v1(public.products,jsonb,text),public.sporto_search_matches_v1(jsonb,text),
  public.sporto_search_v1(jsonb,text),public.sporto_catalog_search_v1(jsonb,integer,text,text)
TO anon,authenticated,service_role;
ANALYZE public.products;
NOTIFY pgrst, 'reload schema';
-- Smoke checks: functions execute before COMMIT; no catalog contents are modified.
SELECT result->>'total' AS found, jsonb_array_length(result->'products') AS suggestions_count
FROM (SELECT public.sporto_search_v1('{"raw":["insportline"],"synonyms":[],"concepts":[]}','ro') AS result) t;
SELECT result->>'totalProducts' AS found, jsonb_array_length(result->'products') AS page_size
FROM (SELECT public.sporto_catalog_search_v1('{"searchSpec":{"raw":["insportline"],"synonyms":[],"concepts":[]}}') AS result) t;
COMMIT;

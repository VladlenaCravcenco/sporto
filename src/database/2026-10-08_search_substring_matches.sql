-- Preserve all substring matches when one product has an exact SKU.
-- No data, index, grants or RLS changes. Requires 2026-09-28_search_rpc.sql.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $migration$
DECLARE trgm_schema text;
BEGIN
  SELECT n.nspname INTO STRICT trgm_schema FROM pg_extension e
    JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm';
  -- Register pg_trgm's user-settable parameters in this connection before
  -- CREATE FUNCTION validates its SET clause (SQL Editor may use a fresh backend).
  EXECUTE format('SELECT %I.similarity(%L, %L)', trgm_schema, 'sporto', 'sporto');
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
COMMIT;

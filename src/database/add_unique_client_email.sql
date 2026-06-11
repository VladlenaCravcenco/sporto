-- Keep one public.clients row per email and prevent accidental duplicates.
-- Run once in Supabase SQL Editor.

UPDATE public.clients
SET email = LOWER(BTRIM(email))
WHERE email IS DISTINCT FROM LOWER(BTRIM(email));

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.clients
)
DELETE FROM public.clients
USING ranked
WHERE public.clients.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique_idx
  ON public.clients (email);

-- Keep one client per normalized phone number as well.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY REGEXP_REPLACE(phone, '\D', '', 'g')
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.clients
  WHERE NULLIF(REGEXP_REPLACE(phone, '\D', '', 'g'), '') IS NOT NULL
)
DELETE FROM public.clients
USING ranked
WHERE public.clients.id = ranked.id
  AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_unique_idx
  ON public.clients (REGEXP_REPLACE(phone, '\D', '', 'g'))
  WHERE NULLIF(REGEXP_REPLACE(phone, '\D', '', 'g'), '') IS NOT NULL;

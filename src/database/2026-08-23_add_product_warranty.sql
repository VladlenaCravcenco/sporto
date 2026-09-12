-- Product warranty marker used by the catalog filter, cards and admin editor.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS products_warranty_idx
  ON public.products (has_warranty)
  WHERE has_warranty = TRUE;

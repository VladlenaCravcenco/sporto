-- Dynamic product specifications and category-specific catalog filters.
-- Safe additive migration: existing products, URLs and SEO fields are unchanged.

CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$'),
  name_ro TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('number', 'select', 'boolean', 'text')),
  unit TEXT,
  unit_ro TEXT,
  unit_ru TEXT,
  options TEXT[] NOT NULL DEFAULT '{}',
  category_ids TEXT[] NOT NULL DEFAULT '{}',
  filter_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  specification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE product_attributes
  ADD COLUMN IF NOT EXISTS options TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS unit_ro TEXT,
  ADD COLUMN IF NOT EXISTS unit_ru TEXT;

UPDATE product_attributes
SET
  unit_ro = COALESCE(unit_ro, unit),
  unit_ru = COALESCE(unit_ru, unit)
WHERE unit IS NOT NULL;

CREATE TABLE IF NOT EXISTS product_attribute_values (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  numeric_value NUMERIC,
  text_value TEXT,
  text_value_ro TEXT,
  text_value_ru TEXT,
  boolean_value BOOLEAN,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, attribute_id),
  CHECK (
    numeric_value IS NOT NULL
    OR NULLIF(BTRIM(text_value), '') IS NOT NULL
    OR NULLIF(BTRIM(text_value_ro), '') IS NOT NULL
    OR NULLIF(BTRIM(text_value_ru), '') IS NOT NULL
    OR boolean_value IS NOT NULL
  )
);

ALTER TABLE product_attribute_values
  ADD COLUMN IF NOT EXISTS text_value_ro TEXT,
  ADD COLUMN IF NOT EXISTS text_value_ru TEXT;

ALTER TABLE product_attribute_values
  DROP CONSTRAINT IF EXISTS product_attribute_values_check;

ALTER TABLE product_attribute_values
  ADD CONSTRAINT product_attribute_values_check CHECK (
    numeric_value IS NOT NULL
    OR NULLIF(BTRIM(text_value), '') IS NOT NULL
    OR NULLIF(BTRIM(text_value_ro), '') IS NOT NULL
    OR NULLIF(BTRIM(text_value_ru), '') IS NOT NULL
    OR boolean_value IS NOT NULL
  );

UPDATE product_attribute_values
SET
  text_value_ro = COALESCE(text_value_ro, text_value),
  text_value_ru = COALESCE(text_value_ru, text_value)
WHERE text_value IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_attributes_categories_idx
  ON product_attributes USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS product_attributes_filter_idx
  ON product_attributes (filter_enabled, active);
CREATE INDEX IF NOT EXISTS product_attribute_values_attribute_idx
  ON product_attribute_values (attribute_id);
CREATE INDEX IF NOT EXISTS product_attribute_values_number_idx
  ON product_attribute_values (attribute_id, numeric_value)
  WHERE numeric_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_attribute_values_text_idx
  ON product_attribute_values (attribute_id, text_value)
  WHERE text_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_attribute_values_boolean_idx
  ON product_attribute_values (attribute_id, boolean_value)
  WHERE boolean_value IS NOT NULL;

ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active product attributes" ON product_attributes;
CREATE POLICY "Public read active product attributes"
  ON product_attributes FOR SELECT USING (active = TRUE);

DROP POLICY IF EXISTS "Public read product attribute values" ON product_attribute_values;
CREATE POLICY "Public read product attribute values"
  ON product_attribute_values FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated manage product attributes" ON product_attributes;
CREATE POLICY "Authenticated manage product attributes"
  ON product_attributes FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Authenticated manage product attribute values" ON product_attribute_values;
CREATE POLICY "Authenticated manage product attribute values"
  ON product_attribute_values FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Matches the existing admin setup, which currently permits anon writes.
DROP POLICY IF EXISTS "Anon manage product attributes" ON product_attributes;
CREATE POLICY "Anon manage product attributes"
  ON product_attributes FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anon manage product attribute values" ON product_attribute_values;
CREATE POLICY "Anon manage product attribute values"
  ON product_attribute_values FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

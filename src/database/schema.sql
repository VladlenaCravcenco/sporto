-- =====================================================================
-- SPORTOSFERA S.R.L. — Supabase Schema
-- Запустить: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- ─── Таблица товаров ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,         -- Внутренний код (9459, 9460...)
  name_ro      TEXT NOT NULL,            -- Название (румынский)
  name_ru      TEXT,                     -- Название (русский) — если пусто, берёт name_ro
  sku          TEXT,                     -- Артикул / каталожный код (17-47-121)
  brand        TEXT,                     -- Бренд (HMS, NILS, Technogym...)
  category     TEXT NOT NULL,            -- Slug категории (fitness-yoga, inot...)
  subcategory  TEXT,                     -- Slug подкатегории
  price        NUMERIC(10, 2) NOT NULL,  -- Цена в MDL
  sale_price   NUMERIC(10, 2),           -- Акционная цена (если NULL — акции нет)
  unit         TEXT DEFAULT 'BUC.',      -- Ед. изм.: BUC. / set / pereche
  qty          INTEGER DEFAULT 0,        -- Количество на складе
  description_ro TEXT DEFAULT '',        -- Описание (румынский)
  description_ru TEXT DEFAULT '',        -- Описание (русский)
  image_url    TEXT,                     -- URL главного фото (Supabase Storage или внешний)
  images       TEXT[] DEFAULT '{}',      -- Массив всех фото (images[1] = главное = image_url)
  youtube_url  TEXT,                     -- YouTube ссылка (https://youtu.be/ID или watch?v=ID)
  featured     BOOLEAN DEFAULT FALSE,    -- Показывать на главной
  active       BOOLEAN DEFAULT TRUE,     -- Скрыть товар не удаляя
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Автообновление updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security: публичное чтение, запись только авторизованным
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Все могут читать активные товары
CREATE POLICY "Public read active products"
  ON products FOR SELECT
  USING (active = TRUE);

-- Авторизованные пользователи могут всё
CREATE POLICY "Auth full access"
  ON products FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Anon-ключ может писать (для страницы /admin/import)
-- Примечание: если нужна защита, замените на service_role ключ
CREATE POLICY "Anon write access"
  ON products FOR ALL
  TO anon
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Индексы для быстрой фильтрации ──────────────────────────────────
CREATE INDEX IF NOT EXISTS products_category_idx     ON products (category);
CREATE INDEX IF NOT EXISTS products_brand_idx        ON products (brand);
CREATE INDEX IF NOT EXISTS products_featured_idx     ON products (featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS products_active_idx       ON products (active);

-- ─── Полнотекстовый поиск по названию ────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name_ro, '') || ' ' || coalesce(name_ru, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(brand, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN (search_vector);


-- =====================================================================
-- КАК ИМПОРТИРОВАТЬ ИЗ EXCEL:
--
-- 1. Открой Excel → Сохранить как → CSV UTF-8
-- 2. В CSV должны быть колонки:
--    id, name_ro, sku, brand, category, subcategory, price, unit, qty
-- 3. Supabase Dashboard → Table Editor → products → Import data
-- 4. Выбери CSV файл → Map columns → Import
--
-- SLUGS категорий (category column):
--   aparate-cardio     — Беговые дорожки, велотренажёры, эллипсы
--   aparate-forta      — Силовые тренажёры
--   greutati           — Гантели, утяжелители, грифы
--   fitness-yoga       — Фитнес-аксессуары, йога, пилатес, эспандеры
--   inot               — Плавание, дайвинг
--   sporturi-colective — Командные виды: футбол, волейбол, баскетбол
--   sporturi-individuale — Бадминтон, теннис
--   arte-martiale      — Ед��ноборства, бокс
--   jocuri             — Игры, рекреация
--   forta-exterior     — Уличный фитнес, туризм
--   inventar-institutii — Инвентарь для учреждений
-- =====================================================================
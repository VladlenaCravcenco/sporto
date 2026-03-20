-- =====================================================================
-- МИГРАЦИЯ: Добавление акционной цены (sale_price)
-- Выполни это в: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- Добавляем колонку sale_price к существующей таблице products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2) DEFAULT NULL;

-- Комментарий к колонке (для документации)
COMMENT ON COLUMN products.sale_price IS 'Акционная цена. Если NULL — товар не участвует в акции. Если задана — на фронте показывается красный бейдж АКЦИЯ и перечёркнутая старая цена.';

-- Проверим результат
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'sale_price';

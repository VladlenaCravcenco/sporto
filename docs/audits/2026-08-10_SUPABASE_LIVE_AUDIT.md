# Supabase Live Audit — завершён

Сравнение deployed Supabase с SQL-файлами в `src/database/`. Проверка выполнена по предоставленным CSV; изменения в production не вносились.

## Итог

Статус: **ЗАВЕРШЕНО 2026-08-11**. Фактические columns, functions, function definitions, triggers, table/function grants, RLS policies и Storage settings зафиксированы без secret values.

- [x] Проверены предоставленные schema, functions, grants, RLS и triggers.
- [x] Проверено отсутствие очевидных JWT, service-role keys, паролей и connection strings в CSV.
- [x] Получить полный список columns всех 13 public-таблиц.
- [x] Получить полные выгрузки table grants и function grants.
- [x] Получить определение `public.rls_auto_enable`.
- [x] Получить настройки Storage buckets.
- [x] Повторить итоговое сравнение с `src/database/`.

## Критично

| Объект | Фактическое состояние live | Что проверить или исправить |
|---|---|---|
| `banners`, `brands`, `categories`, `faq_items`, `page_content`, `site_settings`, `subcategories` | Policy `Allow all`, роль `public`, команда `ALL`, условия `true` | Любой посетитель может получить разрешение RLS на чтение и изменение. Удалить широкие policies после проверки реальных операций сайта. |
| `products` | `anon` имеет policy `ALL`; есть несколько дублирующих read/admin policies | Разделить публичное чтение и только серверные admin mutations. Убрать дубли. |
| `product_attributes`, `product_attribute_values` | `anon` и `authenticated` имеют policy `ALL` | Запретить управление обычному посетителю и любому рядовому авторизованному пользователю. |
| Storage `product-images` | Для роли `public` разрешены `INSERT`, `UPDATE`, `DELETE` | Запись и удаление должны проходить только после server-side проверки admin-доступа. |
| Storage `brand-logos` | Для роли `public` разрешены `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Оставить публичное чтение при необходимости; закрыть mutations. |
| `rls_auto_enable` | Event-trigger function с `SECURITY DEFINER`; автоматически включает RLS на новых таблицах `public`, но не создаёт policies | Убрать лишние `EXECUTE` grants у `PUBLIC`/`anon`/`authenticated` и отдельно проверить регистрацию event trigger. Само включение RLS не делает таблицу доступной или безопасной без правильных policies. |

Фактический доступ определяется одновременно grants и RLS. Полная grants-выгрузка подтверждает, что `anon` и `authenticated` имеют все стандартные table privileges почти на всех public-таблицах. Поэтому policies `ALL ... true` действительно разрешают публичные mutations.

## Важно

| Наблюдение | Вывод |
|---|---|
| Admin policies используют email `sporto-admin@gmail.com` | Источник admin identity жёстко записан в базе и должен быть согласован с будущей server-side авторизацией. |
| Любой `authenticated` допускается к управлению products и attributes | Сам факт входа не должен означать права администратора. |
| В live-списке нет `contact_requests`, `consultation_requests`, `pricelist_requests` | Код отправляет данные в эти таблицы; нужно проверить формы на staging и подтвердить, существуют ли таблицы в другой схеме или запросы сейчас завершаются ошибкой. |
| Bucket `brand-banners` отсутствует | Код `AdminBrands.tsx` загружает туда баннеры, поэтому эта операция сейчас должна завершаться ошибкой, пока bucket не будет создан или код не будет переведён на существующий bucket. |
| `brand-logos` и `product-images` имеют `public = true` | Публичное чтение обеспечивается bucket settings. На уровне bucket не заданы ограничения размера и MIME types. |

## Что совпадает с репозиторием

| Область | Результат |
|---|---|
| Order RPC functions | `consume_order_request_rate_limit` и `link_order_request_client` присутствуют, работают как `SECURITY DEFINER`, доступны `service_role`. |
| Auth trigger function | `handle_new_sporto_auth_user` присутствует; trigger на `auth.users` найден. |
| Product timestamp | `update_updated_at` и trigger `products_updated_at` присутствуют. |
| Catalog search | `search_products_catalog` присутствует и не является `SECURITY DEFINER`. |
| Clients и order requests | Live policies соответствуют модели с проверкой пользователя и отдельным admin email. |
| RLS | На всех 13 перечисленных public-таблицах RLS включён; forced RLS выключен. |
| Колонки public-таблиц | Получены 13 отдельных CSV: 147 колонок, ошибок парсинга и ограничения в 100 строк нет. |
| Table grants | Получены 58 сгруппированных записей без обрезки. Только `service_role` имеет доступ к `order_request_rate_limits`; остальные public-таблицы выдают широкие privileges `anon`/`authenticated`. |
| Function grants | Получена 21 запись без обрезки. Три защищённые order/auth functions доступны только `postgres`/`service_role`; catalog search и trigger helpers имеют более широкие grants. |
| Storage buckets | Найдены только `brand-logos` и `product-images`; оба public, без bucket-level size/MIME restrictions. |

## Полная структура колонок

| Таблица | Колонок | Сравнение с SQL проекта |
|---|---:|---|
| `banners` | 12 | В репозитории нет полной декларативной схемы таблицы. |
| `brands` | 22 | `catalog_pdf` присутствует; в репозитории нет полной базовой схемы таблицы. |
| `categories` | 10 | В репозитории нет полной декларативной схемы таблицы. |
| `clients` | 10 | `auth_user_id` присутствует и соответствует migration. |
| `faq_items` | 8 | В репозитории нет полной декларативной схемы таблицы. |
| `order_request_rate_limits` | 4 | Совпадает с migration. |
| `order_requests` | 15 | `client_id` присутствует и соответствует migration. |
| `page_content` | 3 | В репозитории нет полной декларативной схемы таблицы. |
| `product_attribute_values` | 8 | Локализованные `text_value_ro`/`text_value_ru` присутствуют. |
| `product_attributes` | 16 | `unit_ro`/`unit_ru` и остальные колонки migration присутствуют. |
| `products` | 26 | Все актуальные колонки проекта присутствуют; дополнительно найдена legacy-колонка `seo_description`. |
| `site_settings` | 2 | В репозитории нет полной декларативной схемы таблицы. |
| `subcategories` | 11 | В репозитории нет полной декларативной схемы таблицы. |

Пропуск ordinal positions `22` и `23` у `products` не означает потерю строк: PostgreSQL сохраняет след удалённых колонок, поэтому оставшиеся позиции могут быть непоследовательными.

## Расхождения и неопределённости

- `rls_auto_enable` существует только в live и отсутствует в SQL проекта. Definition получен; регистрация соответствующего event trigger в предоставленных данных не зафиксирована.
- На `products` live содержит дополнительные или дублирующие policies.
- Для ряда live-таблиц с `Allow all` в `src/database/` нет полной декларативной миграции, поэтому репозиторий не является полной копией deployed schema.
- Live содержит `products.seo_description`, которой нет в актуальных SQL-файлах проекта; перед удалением нужно проверить использование и данные.
- Полная схема ещё не воспроизводится из репозитория: для нескольких live-таблиц отсутствуют базовые migrations, а текущая выгрузка описывает колонки, но не все constraints, indexes и foreign keys.
- Для полного воспроизведения базы всё ещё потребуются отдельные декларативные migrations constraints, indexes, foreign keys, event triggers и Storage buckets; это не мешает считать текущий аудит доступа завершённым.

## `rls_auto_enable`

Функция реагирует на создание таблиц в схеме `public` и выполняет `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Она не выдаёт grants и не создаёт policies. Тип возврата `event_trigger` означает, что это служебная trigger-функция, а не обычный прикладной RPC; широкие `EXECUTE` grants всё равно избыточны и должны быть отозваны в security migration.

## Storage

| Bucket | Public read | Size limit | MIME restrictions | Использование в коде |
|---|---:|---:|---:|---|
| `brand-logos` | Да | Не задан | Не заданы | Логотипы брендов |
| `product-images` | Да | Не задан | Не заданы | Товары, banners и services |
| `brand-banners` | Bucket отсутствует | — | — | Код пытается загружать brand banners; требуется исправление |

## Следующий шаг

- [x] Сохранить и проверить дополнительные CSV без secret values.
- [x] Завершить live audit.
- [ ] Подготовить точную security migration для RLS/grants/functions/Storage без применения напрямую к production.
- [ ] Проверить исправления сначала на закрытом staging, затем переносить в production.

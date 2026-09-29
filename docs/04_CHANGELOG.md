# Migration Changelog

## 2026-09-02 — Native SSR Catalog sorting

- Добавлены server-side варианты `recommended`, `price-asc`, `price-desc` и `name-asc`.
- Default recommended order сохраняет merchandising priority inSPORTline → остальные бренды.
- Price и name sorting применяются ко всему active catalog с deterministic `id` tie-breaker.
- Выбранный `sort` хранится в URL и сохраняется во всех pagination links; смена sorting начинается с первой страницы.
- Default `sort=recommended` нормализуется до URL без лишнего query parameter, invalid sort возвращает canonical catalog URL.
- Sorting form работает как обычный GET и остаётся функциональным без client JavaScript.
- Sorting query не индексируется как отдельная canonical copy: canonical/hreflang указывают на соответствующую default catalog page.
- `next:build` проходит.

## 2026-08-27 — Native SSR Catalog pagination

- Добавлена server-side pagination по 24 товара с точным total count из Supabase.
- URL первой страницы нормализуется до `/[lang]/catalog`; следующие страницы используют `?page=N`.
- Invalid page values перенаправляются на canonical catalog URL, а страницы за пределами выдачи возвращают `notFound`.
- Canonical, hreflang и title учитывают номер страницы без создания отдельного `?page=1` URL.
- Порядок inSPORTline → остальные бренды сохраняется между страницами без загрузки всего каталога в память.
- Добавлены localized previous/next controls, компактные номера страниц и total product count.
- `next:build` проходит.

## 2026-08-27 — Native SSR Catalog, iteration 1

- Добавлен native localized route `/[lang]/catalog`, который имеет приоритет над legacy bridge.
- Первая выборка из 24 active products выполняется на сервере; браузер не обращается к Supabase напрямую.
- Начальная выдача приоритетно показывает товары inSPORTline, затем остальные бренды в deterministic order.
- Добавлены localized metadata, H1, четыре карточки в ряд на desktop, серый catalog background и белые cards.
- Карточки показывают localized name, SKU, brand, stock/order state, sale price и warranty badge.
- Ошибка подключения и пустой catalog отображаются раздельно; database error details не раскрываются пользователю.
- Filters, sorting, pagination и cart integration намеренно оставлены для следующих отдельных итераций.
- `next:build` подтверждает dynamic SSR route `/[lang]/catalog`.

## 2026-08-27 — Localized SSR Home shell and catalog navigation data layer

- Добавлены native App Router Home routes `/ro` и `/ru`; `/` и retired migration preview перенаправляются на `/ro`.
- Добавлены URL-based language switching, localized canonical/hreflang/Open Graph metadata и request-aware `<html lang>`.
- Public locale layout включает server-loaded Footer, floating contact sticker и функциональный cookie consent.
- Promo popup перенесён вместе с Supabase config loader, но принудительно отключён через `PROMO_POPUP_ENABLED = false`; в выключенном состоянии запрос к базе не выполняется.
- `@vercel/analytics` удалён из Vite, Next, `package.json` и `package-lock.json`; replacement analytics runtime не подключён.
- Добавлены server reads для categories/subcategories и `/api/catalog/menu-products` для validated cached загрузки товаров mega-menu.
- Static Next Header preview заменён актуальным трёхколоночным меню с category icons, четырьмя product cards в ряд, internal scroll и body scroll lock.
- Для ещё не перенесённых public pages добавлен временный localized legacy bridge; native App Router pages будут автоматически иметь приоритет.
- `next:build` проходит; полная visual Home parity и native SSR Catalog остаются in progress.

## 2026-08-20 — Next.js App Router foundation without UI changes

- Добавлен минимальный Next.js App Router runtime параллельно текущему Vite SPA.
- Добавлен server health endpoint `/api/health` для проверки нового runtime.
- Next root layout использует существующие global fonts, Tailwind utilities и theme styles.
- Добавлен изолированный preview route `/migration/header` для переноса существующего Header без редизайна.
- Пользовательские маршруты, компоненты, стили и утверждённый дизайн не изменялись.
- React Router остаётся активным до последовательного переноса и проверки каждой страницы.

## 2026-08-20 — Security migration prepared for staging

- Подготовлена транзакционная RLS/grants/Storage migration без применения к production.
- Публичное чтение сохранено; mutations ограничены текущим подтверждённым admin email.
- Закрыт application RPC-доступ к event-trigger helper `rls_auto_enable`.
- Добавлены аварийный staging rollback и отдельный access/functional checklist.
- Пункт Phase 0 остаётся открытым до успешной проверки на закрытом staging.

## 2026-08-11 — Live Supabase audit completed

- Получены полные table/function grants, definition `rls_auto_enable` и Storage bucket settings.
- Подтверждены широкие public/anon mutations для нескольких public-таблиц и Storage objects.
- Подтверждено: `brand-logos` и `product-images` публичные и не имеют bucket-level size/MIME restrictions.
- Подтверждено: используемый кодом bucket `brand-banners` отсутствует.
- Первый пункт Phase 0 закрыт; следующий шаг — подготовка и проверка security migration на staging.

## 2026-08-10 — Preliminary live Supabase audit

- Сопоставлены предоставленные CSV schema, functions, grants, RLS и triggers с `src/database/`.
- Получены отдельные column exports всех 13 public-таблиц: 147 колонок без обрезки.
- Подтверждено наличие всех ключевых колонок migration и дополнительной live-колонки `products.seo_description`.
- Обнаружены широкие public/anon write policies и требующая проверки `SECURITY DEFINER` функция `rls_auto_enable`.
- Аудит оставлен незавершённым: две grants-выгрузки ограничены 100 строками; definition функции и Storage bucket settings не предоставлены.
- Результат: `docs/audits/2026-08-10_SUPABASE_LIVE_AUDIT.md`.

## 2026-08-10 — Migration initialized

- Safety tag `pre-ssr-migration` confirmed.
- Migration branch `feature/next-ssr` confirmed.
- Current architecture audited from repository code.
- Migration documentation initialized:
  - `docs/00_CURRENT_STATE.md`
  - `docs/01_TARGET_ARCHITECTURE.md`
  - `docs/02_MIGRATION_PLAN.md`
  - `docs/03_DECISIONS.md`
  - `docs/04_CHANGELOG.md`

## Entry format

```markdown
## YYYY-MM-DD — Short title

- What changed.
- Verification performed.
- Related decision or migration phase.
```

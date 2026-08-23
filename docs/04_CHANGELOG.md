# Migration Changelog

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

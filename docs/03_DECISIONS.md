# Architecture Decisions

Только подтверждённые решения. Дата фиксации документа: 2026-08-10.

## ADR-001 — Next.js App Router

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: Текущее приложение — React/Vite SPA с React Router (`package.json`, `src/app/routes.tsx`).  
Decision: Мигрировать приложение на Next.js App Router.  
Consequences: Файловая маршрутизация заменит `createBrowserRouter`; migration выполняется отдельно от текущего production.

## ADR-002 — Server-side rendering

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: Текущий public content загружается SPA/hooks, а crawler HTML частично создают Vercel Functions.  
Decision: Публичные страницы переводятся на SSR; Server Components применяются только при совместимости с реальным кодом.  
Consequences: Browser-only behavior выделяется в Client Components; hydration и server HTML становятся обязательными verification points.

## ADR-003 — Supabase remains the backend

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: Код использует Supabase Database, Auth, Storage, Realtime и RPC (`src/lib/supabase.ts` и callers).  
Decision: Supabase остаётся data/backend layer.  
Consequences: Требуются server/browser clients и live RLS verification; database replacement не входит в scope.

## ADR-004 — Cookie-compatible Supabase Auth

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: Текущая Auth session сохраняется browser client, а admin дополнительно зависит от `localStorage` (`AuthContext.tsx`, `adminAuth.ts`).  
Decision: Auth адаптируется к SSR cookies; admin authorization выполняется server-side.  
Consequences: `sporto_admin_ok` перестаёт быть authorization control; текущие user flows должны сохраниться.

## ADR-005 — Locale-prefixed public URLs

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: В коде существуют только `ro` и `ru`; текущие URL используют смесь `/ru`, без-prefix paths и query language.  
Decision: Публичная target-модель использует locale segment, например `/ro/catalog` и `/ru/catalog`.  
Consequences: Нужны legacy redirects, canonical/hreflang update и URL-based language switching.

## ADR-006 — Replace Vercel with self-hosting

Status: **PLANNED / accepted scope**  
Date: 2026-08-10  
Context: Production использует Vercel Functions, rewrites, headers и Analytics. Новый provider указан как Host.md.  
Decision: После полной проверки production переносится на self-hosted Host.md server, Vercel dependency удаляется.  
Consequences: Functions, headers, deploy, analytics and rollback need explicit replacements before cutover.

## ADR-007 — Isolated migration and delayed cutover

Status: **CONFIRMED**
Date: 2026-08-10  
Context: Существующий production должен оставаться стабильным. Branch `feature/next-ssr` и tag `pre-ssr-migration` существуют.  
Decision: Миграция ведётся в отдельной branch; production не переключается до полной staging/final verification.  
Consequences: Старые SPA/Vercel paths нельзя удалять до подтверждённой replacement parity и rollback readiness.

# Open decisions

Следующие пункты имеют статус **REVIEW** и здесь не решаются:

- Точные Host.md VPS/server parameters и staging hostname.
- Process manager and application lifecycle configuration.
- CI/CD deployment strategy, secrets transport and rollback implementation.
- Per-route/data cache and revalidation policy.
- Server/client split для больших mixed components.
- Cart persistence after removing direct localStorage dependency from SSR path.
- Authoritative admin role representation and alignment with deployed RLS.
- Exact treatment of admin UI locale URLs.
- Indexability/canonical rules for each catalog query parameter.
- AI crawler allow/disallow policy.
- Browser EmailJS preservation versus server-side mail submission.
- Active status of `scripts/prerender-products.mjs` and `api/site-meta.ts`.

## ADR-008 — Remove Vercel Analytics without replacement

Status: **CONFIRMED** — 2026-08-27

Context: Target production moves to self-hosted Host.md and should not retain an unnecessary Vercel runtime dependency.
Decision: Remove `@vercel/analytics` from both Vite and Next runtimes and from package manifests. Do not add a replacement analytics service during the current migration.
Consequences: Cookie consent remains available for essential preferences and future integrations, but the Next runtime currently loads no external analytics service.

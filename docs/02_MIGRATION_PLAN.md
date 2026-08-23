# Migration Progress

Главный рабочий план миграции SPORTO.MD. Пункты расположены в порядке выполнения. Непринятые решения помечены **REVIEW**.

Completed:

- [x] Создан safety tag `pre-ssr-migration`.
- [x] Создана branch `feature/next-ssr`.
- [x] Выполнен initial architecture audit.
- [x] Создана migration documentation в `docs/`.

In progress:

- Нет начатой implementation-задачи.

## Phase 0 — Безопасность и исходное состояние production

- [x] Проверить live Supabase schema, functions, grants и RLS против `src/database/`.
  - Verify: отдельно зафиксировано фактическое deployed-состояние без secret values.
  - Предварительный аудит: `docs/audits/2026-08-10_SUPABASE_LIVE_AUDIT.md`.
  - Проверено: 13 public-таблиц, 147 колонок, 58 table grants, 21 function grant, 35 RLS policies, functions/triggers и 2 Storage buckets.
- [ ] Устранить или запланировать устранение широкого `anon`/`authenticated` write-доступа к products и attributes.
  - Depends on: live RLS audit.
  - Verify: обычный anonymous/regular user не может выполнять admin mutations.
  - Prepared: `src/database/2026-08-20_harden_public_access.sql`.
  - Staging checklist: `docs/audits/2026-08-20_SECURITY_MIGRATION_STAGING_CHECKLIST.md`.
  - Не закрывать пункт до успешного staging test и отдельного production deployment.
- [ ] Зафиксировать текущий Vercel production baseline.
  - Verify: проверены public routes, Auth, admin, catalog, product, forms, Storage, Realtime и order submission.
- [ ] Зафиксировать SEO baseline текущего production.
  - Verify: сохранены примеры HTML, metadata, canonical, hreflang, JSON-LD, sitemap и robots для основных page types.
- [ ] Не изменять Vercel production до готовности staging и rollback.

## Phase 1 — Инфраструктура Host.md и staging

- [ ] Подготовить отдельный Host.md VPS/staging без изменения production DNS.
- [ ] Настроить supported Node.js runtime.
- [ ] Настроить reverse proxy и HTTPS.
- [ ] Настроить Git checkout/deploy access к `feature/next-ssr`.
- [ ] Настроить CI/CD через Git/GitHub сначала для staging.
- [ ] Перенести environment variables по browser/server boundaries.
  - Verify: `SUPABASE_SERVICE_ROLE_KEY` доступен только server runtime и отсутствует в Git/client bundle.
- [ ] Проверить Supabase Database, Auth, Storage, Realtime и API с Host.md.
- [ ] Определить process manager, restart и rollback procedure.
  - Status: **REVIEW**.
- [ ] Закрыть staging от индексации и случайного публичного доступа.
  - Verify: включён password/IP access control.
  - Verify: staging отдаёт `noindex` и не включён в production sitemap.
- [ ] Предоставить заказчику отдельный доступ к staging для приёмки.
- [ ] Проверить восстановление приложения после restart/reboot staging server.

## Phase 2 — Основа Next.js App Router

- [x] Создать Next.js App Router application в migration branch, сохранив старое SPA до replacement.
  - Next.js добавлен параллельно Vite SPA; публичные страницы и утверждённый UI не изменены.
  - Первый App Router endpoint: `/api/health`; перенос пользовательских routes начнётся отдельными задачами.
- [ ] Настроить TypeScript, ESLint, build и start commands.
- [ ] Перенести global styles без изменения утверждённого UI до Phase 7.
  - In progress: существующие fonts/Tailwind/theme подключены к Next root layout; визуальные страницы ещё не переносились.
- [ ] Создать root layout и минимальный набор global providers из `src/main.tsx`/`src/app/App.tsx`.
  - In progress: создан изолированный `/migration/header` для pixel-parity переноса Header; он не заменяет public Home и закрыт от индексации.
- [ ] Создать отдельные public locale layout и admin layout.
- [ ] Разделить Server Components, Client Components и shared modules на основе реальных browser dependencies.
- [ ] Изолировать `window`, `document`, storage, History API, matchMedia, Notification, Speech Recognition и file APIs в Client Components/effects.
- [ ] Проверить browser-only dependencies: EmailJS, analytics, React Helmet replacement, virtual list, DnD и UI libraries.
- [ ] Устранить hydration differences в language, responsive и persisted state.
  - Verify: migrated routes не создают hydration warnings.

## Phase 3 — Supabase Auth и доступ к данным

- [ ] Создать отдельные Supabase browser client и cookie-aware server client.
- [ ] Перенести login, signup, logout, email verification и password reset на SSR-compatible cookies.
- [ ] Сохранить текущий flow создания/обновления `clients` profile.
- [ ] Заменить `sporto_admin_ok` server-side admin authorization.
- [ ] Выбрать единый источник admin role/identity и согласовать его с deployed RLS.
  - Status: **REVIEW** до live RLS audit.
- [ ] Защитить admin layout и каждую admin mutation на сервере.
  - Verify: regular authenticated user не получает admin UI и не выполняет admin CRUD.
- [ ] Перенести initial reads products/catalog/product в server data layer.
- [ ] Перенести initial reads brands, banners, categories, attributes, page content, settings и FAQ, где требуется SSR.
- [ ] Оставить Realtime только в Client Components, которым действительно нужны live updates.
- [ ] Отделить admin CRUD от UI и выполнять его через server-authorized mutations.
- [ ] Мигрировать `api/order-request.ts` в Next server endpoint без потери validation, honeypot, rate limit, service role и RPC.
- [ ] Определить SSR-safe persistence корзины.
  - Status: **REVIEW**.
  - Verify: корзина сохраняет требуемое поведение без hydration errors.
- [ ] Проверить EmailJS browser calls и решить, сохраняются ли они или переносятся server-side.
  - Status: **REVIEW**.

## Phase 4 — Мультиязычные URL и редиректы

- [ ] Реализовать `[lang]` только для существующих языков `ro` и `ru`.
- [ ] Перевести public routes на единую структуру `/ro/...` и `/ru/...`.
- [ ] Заменить language localStorage/query synchronization маршрутизацией App Router.
- [ ] Переключатель языка должен вести на эквивалентную страницу другого языка.
- [ ] Определить locale behavior для auth routes и admin UI.
  - Status: **REVIEW**.
- [ ] Зафиксировать единый production host: `www` или non-`www`.
  - Status: **REVIEW**.
- [ ] Зафиксировать единый trailing-slash policy.
  - Status: **REVIEW**.
- [ ] Настроить server 301 redirects:
  - HTTP → HTTPS;
  - альтернативный host → canonical host;
  - альтернативный slash-вариант → canonical URL;
  - `/`, `/ru` и остальные legacy routes → новые locale routes;
  - `?lang=...` и старые localized URLs → новые locale routes;
  - неправильные locale URLs → корректный URL.
- [ ] Не перенаправлять все параметрические catalog URL автоматически до утверждения indexability policy.
- [ ] Проверить отсутствие redirect chains, loops и внутренних ссылок через redirect.

## Phase 5 — Публичные страницы и полный SSR-контент

- [ ] Мигрировать Home для `ro` и `ru`.
  - Verify: основной контент и H1 присутствуют в HTML без JavaScript.
- [ ] Мигрировать Catalog.
  - Verify: products, categories, filters initial state и H1 присутствуют в server HTML согласно утверждённой indexability policy.
- [ ] Реализовать SSR category и subcategory states/pages.
  - Verify: уникальные heading, description и product links присутствуют в HTML.
- [ ] Мигрировать ProductDetail с полным пользовательским контентом:
  - title/H1;
  - полное localized description;
  - основное изображение и gallery data;
  - brand и SKU;
  - regular/sale price;
  - stock state;
  - dynamic/static specifications;
  - visible breadcrumbs;
  - реально существующие на текущей странице content blocks.
  - Verify: содержимое доступно в server HTML без JavaScript.
- [ ] Не добавлять related products как «перенос существующего блока», пока отдельное продуктовое требование не подтверждено.
- [ ] Мигрировать BrandPage с brand content и products.
- [ ] Мигрировать Contacts и существующие request modals/forms.
- [ ] Мигрировать About, turnkey, maintenance и legal pages.
- [ ] Мигрировать login, account, verification и reset pages после cookie Auth.
- [ ] Мигрировать OrderRequest после cart и server endpoint.
- [ ] Реализовать App Router not-found с корректным HTTP status/noindex.
- [ ] Мигрировать admin routes после server authorization и mutations.

## Phase 6 — Техническое SEO и внутренние ссылки

- [ ] Перенести browser `SeoHead.tsx` и Vercel SEO metadata в Next Metadata API.
- [ ] Для каждого indexable page type и обоих языков обеспечить уникальные:
  - title;
  - description;
  - canonical;
  - hreflang `ro`/`ru`;
  - `x-default`;
  - Open Graph/Twitter metadata;
  - применимую Schema.org разметку.
- [ ] Проверить SEO для Home, Catalog, categories, subcategories, approved filter pages, static pages, ProductDetail и BrandPage.
- [ ] Исключить общий fallback metadata для существующих indexable страниц.
- [ ] Формировать meta description без обрыва слова или смысловой конструкции.
- [ ] Проверить ровно один meaningful H1 на каждом public page type.
- [ ] Перенести подтверждённые JSON-LD types: Product/Offer, Organization, LocalBusiness, FAQ, Breadcrumb и применимые page/list schemas.
- [ ] Проверить Schema.org data на соответствие реально видимому контенту и фактическим business conditions.
- [ ] Утвердить indexability/canonical policy для каждого catalog GET parameter.
  - Status: **REVIEW**.
- [ ] Исключить дубли между locale, legacy и parameter URLs.
- [ ] Проверить взаимность hreflang и корректность `x-default`.
- [ ] Проверить `noindex` для auth, account, admin, order request, verification и error pages.
- [ ] Обновить все внутренние ссылки на canonical locale URLs:
  - header/footer/menu;
  - product and category cards;
  - language switcher;
  - breadcrumbs;
  - links inside page content;
  - admin links на public pages, если применимо.
- [ ] Проверить, что внутренние ссылки не используют старые `?lang`, legacy routes или redirecting URLs.
- [ ] Сравнить metadata/content parity с `api/product-meta.ts`, `api/seo-page.ts` и текущим пользовательским UI до отключения Vercel SEO layer.

## Phase 7 — Утверждённый дизайн и логика каталога

### Header and contacts

- [ ] Реализовать утверждённую кнопку каталога в header.
- [ ] Реализовать утверждённую нижнюю кнопку контактов.
- [ ] Проверить desktop/mobile navigation и доступность элементов управления.

### Product cards and catalog surface

- [ ] Реализовать утверждённый дизайн product cards во всех местах использования.
- [ ] Добавить утверждённый contrast background каталога.
- [ ] Реализовать hover states без ухудшения touch behavior.
- [ ] Вывести утверждённую информацию о гарантии.
- [ ] Реализовать новую кнопку «В корзину», сохранив cart behavior, price, sale и stock states.

### Filters

- [ ] Добавить утверждённые изображения в filter options.
- [ ] Реализовать утверждённый filter UI без потери существующих параметров и комбинаций.
- [ ] Проверить keyboard/touch accessibility фильтра.

### Carousels

- [ ] Переместить logos в утверждённую нижнюю позицию.
- [ ] Реализовать утверждённый special-products carousel.
- [ ] Проверить responsive и interaction states каруселей.

### Catalog ordering

- [ ] Реализовать утверждённый порядок выдачи товаров.
- [ ] Обеспечить deterministic ordering вместе с filters, search и pagination.

## Phase 8 — Open Graph, robots, AI-боты и sitemap

- [ ] Проверить абсолютные и доступные Open Graph images для каждого page type.
- [ ] Проверить link previews через требуемые официальные social preview tools.
- [ ] Перенести production robots policy на Host.md.
- [ ] Утвердить отдельную allow/disallow policy для AI crawlers.
  - Status: **REVIEW**.
- [ ] Реализовать dynamic multilingual sitemap на canonical `/ro/...` и `/ru/...` URLs.
- [ ] Включить только актуальные indexable canonical pages.
- [ ] Исключить legacy, redirecting, duplicate, noindex и неутверждённые parameter URLs.
- [ ] Добавить взаимные language alternates и `x-default` для применимых URLs.
- [ ] Проверить products, categories, subcategories, brands и static pages без лимита первых 1000 записей.
## Phase 9 — Производительность, доступность и тестирование

### Performance

- [ ] Зафиксировать Lighthouse baseline и target acceptance перед оптимизацией.
- [ ] Проверить и оптимизировать Core Web Vitals: LCP, CLS и INP.
- [ ] Проверить hero/LCP image priority.
- [ ] Проверить lazy/eager loading всех изображений; не применять lazy loading к LCP image.
- [ ] Использовать Next image optimization там, где это совместимо с Supabase/external sources.
- [ ] Проверить JavaScript bundle и исключить ненужную отправку server logic в client.
- [ ] Настроить cache headers/revalidation только после утверждения data freshness requirements.
- [ ] Проверить fonts, third-party scripts, analytics, EmailJS и embeds на влияние на загрузку.

### Accessibility

- [ ] Провести Lighthouse/manual accessibility audit.
- [ ] Проверить keyboard navigation, focus, labels, headings, contrast и modal behavior.
- [ ] Проверить фильтры, carousels, menus и cart controls без мыши.

### Functional and SEO regression

- [ ] Выполнить typecheck, lint и production build.
- [ ] Проверить login, signup, logout, verification, reset и account states.
- [ ] Проверить, что regular user не получает admin access.
- [ ] Проверить public/admin CRUD, Storage uploads, Realtime и exports.
- [ ] Проверить Catalog: search, filters, combinations, reset, ordering и pagination.
- [ ] Проверить cart и OrderRequest end-to-end.
- [ ] Проверить contact, consultation и pricelist submissions/EmailJS.
- [ ] Проверить все public routes, оба языка, status codes и broken links.
- [ ] Проверить SSR HTML и отсутствие hydration warnings.
- [ ] Проверить title, description, H1, canonical, hreflang, x-default, JSON-LD и Open Graph один раз в общей SEO regression matrix.
- [ ] Проверить robots и sitemap один раз в общей SEO regression matrix.
- [ ] Проверить все redirect rules, chains и loops.
- [ ] Провести staging acceptance с заказчиком.

## Phase 10 — Запуск нового production

- [ ] Зафиксировать release commit и успешную production build.
- [ ] Развернуть release на Host.md без переключения DNS.
- [ ] Выполнить pre-DNS production-equivalent smoke, SEO и performance checks.
- [ ] Подтвердить рабочий rollback на текущий Vercel production.
- [ ] Проверить Auth callback URLs, environment variables, TLS, API и assets для live domain.
- [ ] Переключить DNS только после полной приёмки.
- [ ] Сразу после DNS проверить routes, Auth, forms, catalog, admin, SEO, robots и sitemap.
- [ ] Мониторить server/application errors и ключевые user flows после релиза.
- [ ] Отправить sitemap в Google Search Console.
- [ ] Удалять Vercel-specific code только после стабильного monitoring period и подтверждения replacement parity.

## Do not remove yet

- `api/product-meta.ts` и `api/seo-page.ts` — текущая SEO-выдача Vercel production.
- `api/sitemap.ts` — текущий `/sitemap.xml`.
- `api/order-request.ts` — текущий защищённый order endpoint.
- `api/site-meta.ts` — до проверки active use и полного metadata replacement.
- `vercel.json` — текущие rewrites, headers и production routing.
- `src/app/components/SeoHead.tsx` — до server metadata parity всех migrated pages.
- React Router, SPA entry/layouts и старые public/admin pages — до полной page parity.
- `@vercel/analytics/react` — до решения о replacement/removal.
- `scripts/prerender-products.mjs` — до подтверждения, что он не участвует в production process.
- Любое текущее storage behavior — до реализации и проверки требуемой замены.

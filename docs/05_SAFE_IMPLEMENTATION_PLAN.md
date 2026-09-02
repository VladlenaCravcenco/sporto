# Safe Implementation Plan — Local-First Development

**Date:** 2026-09-02  
**Principle:** Complete all Next.js/SSR/auth/admin work locally before Host.md infrastructure is ready. Inspect but do not apply production database changes. No production deployments.

---

## Phase Breakdown: Local vs. External Access Required

### ✅ PHASE 2.5 — Next.js Foundation Completion (LOCAL ONLY)

**Blockers removed:** None — can proceed immediately.

**Tasks:**
1. [ ] Hydration fix: language/locale state
   - Ensure `[lang]` segment is deterministic server-side
   - Remove localStorage language override from SSR rendering
   - Test no hydration mismatch warnings in dev console
   
2. [ ] Create 404/error pages with proper HTTP status
   - Implement `app/not-found.tsx` and `app/error.tsx`
   - Verify `noindex` meta tag on error pages
   
3. [ ] Chunk size optimization
   - Apply dynamic imports for admin, product detail, filters
   - Target: vendor chunks <500 KB each
   
4. [ ] TypeScript strict mode compliance
   - Audit app/lib/data files for any `any` types
   - Fix remaining type warnings

**Deliverable:** Clean, optimized Next.js foundation with zero build warnings.

**Timeline:** 2-3 days  
**Can be merged:** Yes, to feature/next-ssr as independent commit

---

### ✅ PHASE 3 — Supabase Auth → SSR/Cookies (LOCAL ONLY)

**Blockers:** None — use anon key for local testing.

**Key decisions to make locally:**
- Server client will use `SUPABASE_SERVICE_ROLE_KEY` (dev: create test key)
- Browser client will remain public (anon key)
- Session persisted in httpOnly cookies via middleware
- Admin identity: email matching `VITE_ADMIN_LOGIN_EMAIL` env var

**Tasks:**
1. [ ] Create separate Supabase clients
   - `lib/supabase/server.ts` — Service role (SSR only)
   - `lib/supabase/client.ts` — Anon key (browser)
   - Middleware (`middleware.ts`) to refresh cookie session
   
2. [ ] Migrate AuthContext to SSR
   - Move login/logout logic to server actions
   - Replace localStorage session check with `getSession()` from server
   - Preserve user/client profile lookup flow
   
3. [ ] Build SSR-safe admin check
   - Remove `localStorage.sporto_admin_ok` completely
   - Add `src/lib/getAdminRole.ts` — server function verifies email from session
   - Protect `/admin/*` routes with middleware guard
   
4. [ ] Implement login/signup/reset flows
   - `app/(auth)/login/page.tsx` with server action handler
   - `app/(auth)/register/page.tsx`
   - `app/(auth)/reset-password/page.tsx`
   - Email verification flow with redirect to `/verify`
   
5. [ ] Test locally
   - Create test admin user in dev Supabase
   - Create test regular user
   - Verify login → session in cookie → SSR sees session
   - Verify logout → cookie cleared
   - Verify admin-only page blocks regular user
   - Verify password reset email flow (use Supabase Inbox)

**Deliverable:** Complete auth system with server-side security, no localStorage auth tokens.

**Timeline:** 1 week  
**Can be merged:** Yes, after local testing

**Notes:**
- Use `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local`, never commit to git
- `SUPABASE_SERVICE_ROLE_KEY` will be stored securely on Host.md only, not in Git

---

### ✅ PHASE 5A — Public Pages: ProductDetail + BrandPage (LOCAL ONLY)

**Blocker:** Depends on Phase 3 partially (auth isn't blocking product view).

**Tasks:**
1. [ ] ProductDetail full SSR implementation
   - Server loader: fetch product by slug+sku or id
   - Render fields: name, H1, description_ro/ru, price, sale_price, stock status
   - Gallery/images (carousel client-side)
   - Brand + SKU display
   - Warranty badge
   - Dynamic specifications (if product_attributes link exists)
   - Breadcrumbs (localized)
   - Related products (optional, leave until approved)
   - Metadata: unique title, description, canonical, hreflang, JSON-LD Product schema
   - Verify: server HTML contains all content without JS
   
2. [ ] BrandPage SSR
   - Server loader: fetch brand + products for brand
   - Brand info (name, logo, description if available)
   - Product grid (24 items) with pagination
   - Metadata: unique per brand, hreflang, Schema Brand/Organization
   
3. [ ] Test
   - Load ProductDetail in multiple locales
   - Verify JSON-LD renders correctly (use https://validator.schema.org/)
   - Test pagination on BrandPage

**Deliverable:** Fully functional ProductDetail and BrandPage with SSR and metadata.

**Timeline:** 3-4 days  
**Can be merged:** Yes

---

### ✅ PHASE 5B — Public Pages: Remaining (LOCAL ONLY)

**Tasks:**
1. [ ] Migrate About
   - Server loader: fetch FAQ items, page content
   - Metadata + JSON-LD FAQ schema
   
2. [ ] Migrate Contacts
   - Server loader: fetch site settings (phone, email, hours)
   - Contact form with server action handler
   - Metadata
   
3. [ ] Migrate Legal/Static Pages
   - About, Turnkey Solutions, Maintenance Service
   - Terms of Cooperation, Delivery Terms, Privacy Policy
   - Load from `page_content` table
   - Verify metadata on each

**Timeline:** 2-3 days  
**Can be merged:** Yes

---

### ✅ PHASE 6A — Cart Persistence (LOCAL ONLY)

**Decision needed:** Choose cart storage strategy locally, test before Phase 5 integration.

**Options:**
- **Option A:** Cookies + Server Session (most SSR-safe)
  - Cart stored in httpOnly cookie, managed by middleware
  - Survives refresh, language switch
  - Complex: need server action to update cart
  
- **Option B:** IndexedDB + Server Sync
  - Client-side IndexedDB for offline support
  - Server endpoint to sync cart state
  - Simpler for PWA, but adds sync complexity
  
- **Option C:** localStorage + Hydration Boundary
  - Keep localStorage, wrap CartProvider in `<ClientOnly>` boundary
  - Prevent hydration mismatch
  - Simplest migration, least SSR benefit

**Recommendation:** Start with **Option A** (cookies + server session) for best SSR integration, but prototype **Option C** as fallback if too complex.

**Tasks:**
1. [ ] Design cart data structure (product ID, quantity, language-aware)
2. [ ] Implement middleware → cookie refresh
3. [ ] Create server action: `updateCart()`, `clearCart()`
4. [ ] Wrap CartProvider in client boundary if needed
5. [ ] Test:
   - Add item → page refresh → cart persists
   - Switch language → cart stays in URL, not lost
   - Logout → cart cleared (or preserved, decide)

**Timeline:** 2-3 days  
**Can be merged:** Yes (as feature flag behind `CART_STRATEGY` env var)

---

### ✅ PHASE 6B — Multilingual URL Behavior & Redirects (LOCAL ONLY)

**Tasks:**
1. [ ] Implement locale normalization
   - Requests to `/` → `/ro` (default)
   - Requests to `/?lang=ru` → `/ru` (301 redirect)
   - Requests to `/catalog?lang=ru` → `/ru/catalog` (301 redirect)
   - Requests to `/unknown-locale/*` → 404
   
2. [ ] Language switcher logic
   - Get current locale from URL segment
   - Generate link to same page in other locale
   - Test header language switch

3. [ ] Canonical + hreflang
   - Verify every page has correct canonical URL
   - Verify hreflang links to ro/ru equivalents
   - Verify x-default (should point to /ro)

**Timeline:** 1-2 days  
**Can be merged:** Yes

---

### ✅ PHASE 6C — SEO: Complete Metadata & JSON-LD (LOCAL ONLY)

**Tasks:**
1. [ ] Home page
   - Verify: unique title, description, Open Graph, canonical
   - Add schema: Organization + LocalBusiness + FAQPage (if FAQ on home)
   
2. [ ] Catalog page (without filters/sorting variants for now)
   - Title: "Каталог товаров" (localized)
   - Description: unique per locale
   - Canonical: `/[lang]/catalog` (no ?page=1)
   - Schema: CollectionPage + Product items
   
3. [ ] ProductDetail
   - Title: product name + brand
   - Description: first 160 chars of description field
   - Schema: Product + Offer (price, sale price, stock status)
   - Image: main product image
   - URL: canonical slug/sku combo
   
4. [ ] BrandPage
   - Schema: Brand + Organization
   
5. [ ] Legal/Static pages
   - Unique descriptions
   - noindex on auth pages, admin pages

**Deliverable:** Full SEO metadata audit + metadata API implementation for all public pages.

**Timeline:** 2-3 days  
**Can be merged:** Yes

---

### ✅ PHASE 7A — Admin Routes & CRUD Migration (LOCAL ONLY)

**Blocker:** Depends on Phase 3 (admin auth).

**Tasks:**
1. [ ] Create admin layout
   - `app/(admin)/admin/layout.tsx`
   - Server-side auth check: redirect non-admins to login
   - Admin navigation menu
   
2. [ ] Migrate admin pages
   - AdminProducts (list + inline CRUD using server actions)
   - AdminBrands
   - AdminCategories
   - AdminAttributes
   - AdminBanners
   - AdminFAQ
   - AdminClients
   - AdminRequests
   - AdminContentPages
   - (Note: AdminImport, AdminFeatured, AdminServices remain lower priority)
   
3. [ ] Convert CRUD to server actions
   - Each create/update/delete becomes a `'use server'` function
   - Server validates admin role before executing
   - Client-side forms remain as `<form>` or React Hook Form
   
4. [ ] Test locally
   - Login as admin → see admin UI
   - Create/edit/delete product → database updates
   - Login as regular user → admin routes redirect to home
   - Verify data persists across refresh (not just in memory)

**Timeline:** 1 week  
**Can be merged:** Yes

---

### ✅ PHASE 7B — Catalog Filters + Cart Integration (LOCAL ONLY)

**Tasks:**
1. [ ] Implement product filters on Catalog page
   - Brand filter (GET param, server-side filtering)
   - Price range slider (GET param)
   - Category/subcategory (already in URL)
   - Server-renders filtered count
   
2. [ ] Add "Add to Cart" on product cards
   - Calls server action `updateCart(productId, quantity)`
   - Cart persists via Phase 6B chosen strategy
   
3. [ ] Implement OrderRequest flow
   - Server action endpoint for form submission
   - Sends to `order_requests` table
   - Includes honeypot + rate limit checks
   - Returns success/error toast

**Timeline:** 2-3 days  
**Can be merged:** Yes

---

### ✅ PHASE 2.6 — i18n Library Integration (LOCAL ONLY)

**Decision:** Whether to use structured i18n (next-intl, i18next) or manual localization.

**Recommendation:** Start with **manual localization** (object-based translations in TypeScript), add structured i18n library later if complexity grows.

**Tasks:**
1. [ ] Create translation structure
   - `lib/i18n/translations.ts` with nested object: `{ ro: { home: { title: '...' } } }`
   - `lib/i18n/useTranslation.ts` hook for components
   
2. [ ] Replace hardcoded strings
   - "Каталог" → `t('catalog.title')`
   - Button labels, error messages, etc.
   
3. [ ] Test all pages in both locales

**Timeline:** 2-3 days  
**Can be merged:** Yes

---

## 🔍 DATABASE INSPECTION & PREPARATION (Local + Staging Analysis)

**DO NOT apply to production. Prepare only.**

### Task: Inspect Current RLS Policies

**Actions:**
1. [ ] Query your staging/dev Supabase: `SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check FROM pg_policies ORDER BY tablename;`
2. [ ] Document current state for each table
3. [ ] Compare against `src/database/2026-08-20_harden_public_access.sql`
4. [ ] Identify what needs to change

**Deliverable:** Document in `docs/06_RLS_ANALYSIS.md` with before/after policy table.

**Timeline:** 1 day  
**Can be merged:** Documentation only, no code changes

---

### Task: Verify Missing Tables

**Actions:**
1. [ ] Connect to your dev Supabase
2. [ ] Query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. [ ] Confirm these exist:
   - `contact_requests`
   - `consultation_requests`
   - `pricelist_requests`
4. [ ] If missing, create locally with RLS

**Deliverable:** Table structure and RLS policies in `src/database/missing_tables.sql`

**Timeline:** 1 day

---

### Task: Prepare Security Migration

**Actions:**
1. [ ] Review `src/database/2026-08-20_harden_public_access.sql`
2. [ ] Create detailed comments explaining each policy change
3. [ ] Prepare `_rollback.sql` if not already complete
4. [ ] Create staging test checklist in `docs/` (already exists, verify accuracy)

**Deliverable:** Finalized, commented SQL migration + checklist

**Timeline:** 1 day  
**Status:** Ready to hand off to staging team, but DO NOT APPLY YET

---

## 🚫 Explicitly NOT Blocking Local Work

- ✅ Host.md server setup — Staging team handles in parallel
- ✅ Production Supabase schema changes — Inspect and prepare, don't apply
- ✅ DNS/production deployment — Happens after all testing
- ✅ Analytics replacement — Out of scope for now (noted as removed)
- ✅ Storage bucket creation (`brand-banners`) — Can be done locally for testing, fixture data only

---

## 📊 REVISED PRIORITY ORDER (What Blocks What)

### Tier 1: Foundation (Do First)
```
1. PHASE 2.5 — Next.js hydration fix + error pages + chunk optimization
   └─ Unblocks: Everything below
   └─ Time: 2-3 days
   └─ Status: CAN START IMMEDIATELY ✅

2. PHASE 3 — Auth → SSR/cookies + admin server-side check
   └─ Unblocks: Admin pages, protected routes
   └─ Time: 1 week
   └─ Status: CAN START IMMEDIATELY (after 1) ✅
```

### Tier 2: Content (Parallel with Tier 1)
```
3. PHASE 5A — ProductDetail + BrandPage (full SSR)
   └─ Unblocks: Catalog → detail flow
   └─ Time: 3-4 days
   └─ Status: CAN START IMMEDIATELY ✅

4. PHASE 5B — Remaining public pages (About, Contacts, Legal)
   └─ Time: 2-3 days
   └─ Status: After 3 ✅

5. PHASE 6B — Multilingual redirects + canonical
   └─ Time: 1-2 days
   └─ Status: CAN START IMMEDIATELY ✅

6. PHASE 6C — Complete SEO metadata + JSON-LD
   └─ Time: 2-3 days
   └─ Status: After 3-4 ✅
```

### Tier 3: Features (After Tier 2)
```
7. PHASE 6A — Cart persistence decision + implementation
   └─ Time: 2-3 days
   └─ Status: CAN START IMMEDIATELY (in parallel with Phase 3) ✅

8. PHASE 7A — Admin routes + CRUD migration
   └─ Unblocks: Full admin functionality
   └─ Depends on: Phase 3
   └─ Time: 1 week
   └─ Status: START AFTER PHASE 3 ✅

9. PHASE 7B — Catalog filters + cart integration
   └─ Depends on: 6A, 7A
   └─ Time: 2-3 days
   └─ Status: After 8 ✅

10. PHASE 2.6 — i18n library integration (optional, polish)
    └─ Time: 2-3 days
    └─ Status: Last ✅
```

### Tier 4: Database & Infrastructure (Staging Parallel)
```
11. DATABASE — Inspect RLS + prepare migration
    └─ Time: 1 day
    └─ Status: CAN START IMMEDIATELY ✅
    └─ Note: INSPECT ONLY, DO NOT APPLY

12. INFRASTRUCTURE — Host.md staging setup
    └─ Time: 3-5 days (Staging team)
    └─ Status: Handled externally, not a blocker for local work ✅
```

---

## 🎯 CRITICAL PATH (Fastest → Staging Ready)

**Optimal local development sequence:**

```
Week 1:
  Day 1-2: PHASE 2.5 (hydration, errors, chunks)
  Day 2-3: PHASE 3 (auth) — START THIS
  Day 3-4: PHASE 5A (ProductDetail) — PARALLEL
  Day 4-5: Database inspection (RLS analysis)

Week 2:
  Day 6-7: PHASE 3 (continue/finish)
  Day 7-8: PHASE 5B (remaining pages)
  Day 8-10: PHASE 6B (redirects) + PHASE 6C (SEO)

Week 3:
  Day 11-12: PHASE 6A (cart) + PHASE 7A (admin auth)
  Day 13-14: PHASE 7A (admin CRUD)
  Day 15: Final testing + Staging team deploys

Week 4:
  STAGING TESTS → If all pass: Production migration decision
```

**Total local dev time:** 2.5-3 weeks (with parallel work)  
**Staging test time:** 1 week (happens after local completion)  
**Total to production-ready:** ~4 weeks

---

## ✅ What You Can Start RIGHT NOW (Today)

**No dependencies, can run in parallel:**

1. **PHASE 2.5a — Hydration fix**
   - 2-3 hour task
   - No external access needed
   - Start immediately
   - Merge to feature/next-ssr when done

2. **DATABASE inspection — RLS analysis**
   - 2-3 hour task
   - Read-only, no changes
   - Start immediately
   - Document findings only

3. **PHASE 6A — Cart strategy + prototype**
   - Design choice + proof of concept
   - Can be done locally
   - Start immediately
   - Merge feature flag to feature/next-ssr

4. **PHASE 5A — ProductDetail skeleton + server loader**
   - Start page structure while Phase 3 progresses in parallel
   - No auth needed for reading products
   - Start immediately
   - Integrate with auth after Phase 3 done

---

## 🚀 NEXT IMMEDIATE ACTION

**Start with these three in parallel TODAY:**

1. **Branch:** `feature/hydration-fix` from feature/next-ssr
   - Fix language state mismatch
   - Add 404 page
   - Optimize chunks
   - Merge back to feature/next-ssr
   - **Time:** 2-3 hours

2. **Branch:** `feature/auth-ssr` from feature/next-ssr
   - Create server/browser Supabase clients
   - Implement middleware + cookie refresh
   - Build SSR auth context
   - Migrate login/signup flows to server actions
   - **Time:** 4-5 days (do in parallel with #1)

3. **Branch:** `feature/product-detail` from feature/next-ssr
   - Create `/[lang]/product/[slug]/page.tsx` with server loader
   - Render all fields + metadata
   - Test locally with sample product
   - Merge back (independent of auth for initial load)
   - **Time:** 2-3 days (parallel with #2)

**All three branches can be worked on independently, then merged back to feature/next-ssr when ready.**

---

**Ready to begin? Which task should I start with first?**

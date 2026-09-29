# Quick-Reference: Revised Priority & Dependencies

Generated: 2026-09-02  
Principle: Maximize local progress while Host.md/staging prepare in parallel.

---

## 📊 Task Matrix: Sequence & Time

| # | Phase | Task | Depends On | Duration | External Access? | Can Start Today? |
|---|-------|------|-----------|----------|------------------|------------------|
| 1 | 2.5 | Hydration fix + error pages + chunk optimization | None | 2-3d | No | ✅ **YES** |
| 2 | 3 | Supabase Auth → SSR/cookies + admin check | 1 | 1 week | No (dev env) | ✅ **YES** |
| 3 | 5A | ProductDetail + BrandPage SSR | 1 | 3-4d | No | ✅ **YES** |
| 4 | 5B | Remaining public pages (About, Contacts, Legal) | 1,3 | 2-3d | No | ✅ **YES** |
| 5 | 6B | Multilingual redirects + canonical URLs | 1 | 1-2d | No | ✅ **YES** |
| 6 | 6C | Complete SEO metadata + JSON-LD | 1,3,4 | 2-3d | No | ✅ **YES** |
| 7 | 6A | Cart persistence design + prototype | 1 | 2-3d | No | ✅ **YES** |
| 8 | 7A | Admin layout + CRUD server actions | 2 | 1 week | No | After task 2 |
| 9 | 7B | Catalog filters + cart integration | 7,8 | 2-3d | No | After task 8 |
| 10 | 2.6 | i18n library integration (polish) | 1 | 2-3d | No | After task 9 |
| 11 | DB | RLS inspection + migration preparation | None | 1d | No (read-only) | ✅ **YES** |
| 12 | Infra | Host.md staging deployment | None | 3-5d | Yes (staging team) | Parallel |

---

## 🚀 PARALLEL TRACKS (Week 1 Recommended)

### Track A: Foundation (2-3 days)
```
[Task 1: Hydration Fix]
    ↓
[Task 2: Auth SSR] ←── Continue in Week 2
```

### Track B: Content (3-5 days, runs parallel with Track A)
```
[Task 3: ProductDetail]
    ↓
[Task 4: Remaining Pages]
    ↓
[Task 6: SEO Metadata]
```

### Track C: Features (2-3 days, runs parallel with A+B)
```
[Task 5: Redirects/Canonical]
[Task 7: Cart Strategy]
[Task 11: RLS Inspection]
```

### Track D: Infrastructure (External, parallel to all)
```
[Task 12: Host.md Staging] ←── Staging team handles
```

---

## ⏱️ CRITICAL PATH TIMELINE

```
WEEK 1:
  Mon-Tue: Task 1 (hydration)
  Tue-Fri: Task 2 (auth) + Task 3 (product detail) + Task 7 (cart) in parallel
  
WEEK 2:
  Mon-Wed: Task 2 finish (auth) + Task 4 (pages)
  Wed-Thu: Task 5 (redirects) + Task 6 (SEO)
  Thu-Fri: Task 11 (DB inspection)
  
WEEK 3:
  Mon-Fri: Task 8 (admin routes)
  
WEEK 4:
  Mon-Tue: Task 9 (filters)
  Tue-Wed: Task 10 (i18n polish) + Final integration testing
  Thu-Fri: Deploy to staging (if Host.md ready)

WEEK 5:
  Staging testing + security migration (RLS) on staging DB
  
WEEK 6:
  Production migration decision + cutover
```

**Total local dev:** 2.5-3 weeks  
**Staging test:** 1 week  
**Total to live:** ~4 weeks

---

## ✅ START HERE (Right Now, Pick One to Three)

### Option 1: Start Auth (Highest Impact)
```bash
git checkout feature/next-ssr
git checkout -b feature/auth-ssr
# Implement Phase 3 tasks (server clients, middleware, login flow)
```
**Why:** Unblocks admin routes and all protected features. Required before moving to production.  
**Duration:** 4-5 days

### Option 2: Start ProductDetail (Fast Win)
```bash
git checkout feature/next-ssr
git checkout -b feature/product-detail
# Implement Phase 5A tasks (server loader, full rendering, metadata)
```
**Why:** Product detail is critical content, independent of auth, valuable for SEO.  
**Duration:** 3-4 days

### Option 3: Start Hydration Fix (Quick Polish)
```bash
git checkout feature/next-ssr
git checkout -b feature/hydration-fix
# Fix locale mismatch, add errors, optimize chunks
```
**Why:** Quick 2-3 hour win, unblocks all other features, no dependencies.  
**Duration:** 2-3 hours

### Option 4 (Recommended): Do ALL THREE in Parallel
- Branch 1: `feature/hydration-fix` (2-3h, merge immediately)
- Branch 2: `feature/auth-ssr` (4-5d, merge end of week)
- Branch 3: `feature/product-detail` (3-4d, merge mid-week)

---

## 🔐 Database Work (Non-Blocking Preparation)

**NO PRODUCTION CHANGES.** Inspection only.

```bash
# In your local dev Supabase (connected to staging):
# 1. Query current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles 
FROM pg_policies ORDER BY tablename;

# 2. Verify table existence
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# 3. Document findings in: docs/06_RLS_ANALYSIS.md
```

**Deliverable:** Read-only analysis document, ready to share with staging team.

---

## 📋 DO NOT DO (Blockers Intentionally Avoided)

❌ Do NOT: Set up Host.md host yourself (staging team responsibility)  
❌ Do NOT: Apply RLS migration to production (inspect only)  
❌ Do NOT: Deploy to Vercel until all local testing complete  
❌ Do NOT: Add external analytics (out of scope)  
❌ Do NOT: Redesign UI (maintain approved design)  

---

## ✨ My Recommendation

**Start TODAY with this sequence:**

1. **Right now (30 min):** Task 1 - Hydration fix (quick win, merge immediately)
2. **Immediately after (1h):** Start Task 2 - Auth SSR in parallel branch
3. **Same day (afternoon):** Start Task 3 - ProductDetail in third branch
4. **Ongoing:** Work on 2 and 3 throughout week, cross-reference as needed

**By end of Week 1:**
- Hydration ✅ merged
- Auth foundation + login/logout working locally
- ProductDetail rendering with metadata
- Cart persistence decided and prototyped

**By end of Week 2:**
- Auth complete with admin security
- All public pages migrated
- Full SEO metadata across all pages
- Admin layout structure ready

**By end of Week 3:**
- Admin CRUD fully functional locally
- Filters + cart integration working
- All tests passing locally

**By Week 4:**
- Ready for staging deployment
- Staging team runs RLS migration
- Final integration testing

---

**Which task should I implement first?** Just say "start with [Task X]" and I'll begin immediately.

Or if you want me to proceed with all three in parallel, I can set up the branches and begin work across all three tracks.

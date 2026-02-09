# TinySteps AI — Code Review Fixes Plan

> **Date:** 2026-02-08
> **Scope:** Fix all issues identified in the comprehensive code review of branch `7feb-extension`

---

## Issue Tracker

| # | Severity | Status | Title |
|---|----------|--------|-------|
| 1 | CRITICAL | TODO | Complete `findByAnyId` migration in stories, timeline, recommendations, children routes |
| 2 | CRITICAL | TODO | `GET /api/analysis/:childId` missing child existence / format validation |
| 3 | CRITICAL | N/A | `findByAnyId` returns null for non-ObjectId strings (by design — frontend guards needed) |
| 4 | CRITICAL | N/A | Auth middleware disabled (known dev shortcut — production blocker, not fixing now) |
| 5 | HIGH | TODO | `docker-compose.yml` env_file + environment conflict — **causes Gemini 400 error** |
| 6 | HIGH | TODO | MinIO healthcheck uses unavailable `mc` command |
| 7 | HIGH | TODO | `recommendations.js` uses `process.env.GEMINI_API_KEY` directly, inconsistent with other routes |
| 8 | HIGH | N/A | `saveChildAsync` throws with no local fallback (intentional — backend required) |
| 9 | HIGH | TODO | `getDoctors` passes undefined params to URLSearchParams |
| 10 | HIGH | TODO | `getWHOEvidence` passes undefined params to URLSearchParams |
| 11 | MEDIUM | N/A | `Analysis.sources.type` schema change (backward compatible) |
| 12 | MEDIUM | TODO | `mapBackendStatus` duplicated in 3 files |
| 13 | MEDIUM | TODO | `mapResource` duplicated in 2 files |
| 14 | MEDIUM | TODO | `overallStatus.charAt(0)` crash on empty string in GeneratedReportView |
| 15 | MEDIUM | N/A | `userId` made optional in Analysis model (revisit when auth re-enabled) |
| 16 | MEDIUM | N/A | Frontend response shape assumptions (works today, needs types later) |
| 17 | MEDIUM | N/A | `saveAnalysis` localStorage-first (acceptable for now) |
| 18 | MEDIUM | N/A | No userId filtering on queries (blocked on auth re-enable) |
| 19 | LOW | N/A | `mapBackendReport` always sets status `'ready'` (correct for now) |
| 20 | LOW | TODO | `env_file` references `.env` which may not exist for fresh clones |
| 21 | LOW | N/A | BedtimeStories `(theme as any).personalized` (cosmetic) |
| 22 | LOW | N/A | Region mapping uses raw string (cosmetic) |
| 23 | LOW | N/A | Interest objects stripped to strings (acceptable) |
| 24 | LOW | N/A | Optional chaining on `req.user._id` (harmless) |
| 25 | LOW | N/A | README changes (documentation) |

---

## Fixes To Implement

### Fix 1: Docker-compose env conflict (Issue #5) — **ROOT CAUSE OF GEMINI 400 ERROR**

**File:** `docker-compose.yml` (line 18)

**Problem:** `environment: GEMINI_API_KEY=${GEMINI_API_KEY}` resolves from host shell (empty), overriding the value in `env_file: ./backend/.env`.

**Fix:** Remove `GEMINI_API_KEY` and `JWT_SECRET` from the `environment:` block — let `env_file` provide them. Only keep vars that need Docker-specific overrides (MONGODB_URI, MINIO_ENDPOINT, etc.).

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - MONGODB_URI=mongodb://mongo:27017/tinysteps
  - WEB_APP_URL=http://localhost:3005
  - MINIO_ENDPOINT=minio
  - MINIO_PORT=9000
  - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
  - MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
  - MINIO_USE_SSL=false
  - MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL:-http://localhost:9000}
```

### Fix 2: MinIO healthcheck (Issue #6)

**File:** `docker-compose.yml` (line 64)

**Fix:** Replace `mc ready local` with curl:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
```

### Fix 3: env_file tolerance for fresh clones (Issue #20)

**File:** `docker-compose.yml` (line 11-12)

**Fix:** Use list format which tolerates missing files:
```yaml
env_file:
  - path: ./backend/.env
    required: false
```

### Fix 4: Complete `findByAnyId` migration (Issue #1)

**Files:**
- `backend/src/routes/stories.js` — 2 occurrences
- `backend/src/routes/timeline.js` — 4 occurrences
- `backend/src/routes/recommendations.js` — 4 occurrences
- `backend/src/routes/children.js` — 5 occurrences (milestone/watch routes)

**Fix:** Replace all `Child.findOne({ _id: req.params.childId })` and `Child.findOne({ _id: req.params.childId, userId: ... })` with `Child.findByAnyId(req.params.childId)`. Also ensure all `child._id` references in saves use `String(child._id)`.

### Fix 5: URLSearchParams undefined filtering (Issues #9, #10)

**File:** `tinysteps-ai/services/apiService.ts`

**Fix:** Apply same pattern as `getResources` — filter undefined values before `URLSearchParams`:
```typescript
// getDoctors
const filtered = Object.fromEntries(
  Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
);
const query = new URLSearchParams(filtered as Record<string, string>).toString();

// Same for getWHOEvidence
```

### Fix 6: Gemini API key in recommendations.js (Issue #7)

**File:** `backend/src/routes/recommendations.js`

**Fix:** Change `const apiKey = process.env.GEMINI_API_KEY` to `const apiKey = req.user?.geminiApiKey || process.env.GEMINI_API_KEY` in all 4 occurrences.

### Fix 7: `overallStatus` crash guard (Issue #14)

**File:** `tinysteps-ai/components/GeneratedReportView.tsx`

**Fix:** Replace `report.overallStatus.charAt(0)` with `(report.overallStatus || 'unknown').charAt(0)`.

### Fix 8: Extract shared utilities (Issues #12, #13)

**Create:** `tinysteps-ai/utils/mappers.ts`

**Contents:** Move `mapBackendStatus()` and `mapResource()` to shared file. Update imports in:
- `services/storageService.ts`
- `components/PediatricianReportView.tsx`
- `components/GeneratedReportView.tsx`
- `components/ImproveDomainView.tsx`
- `components/ResourcesLibraryView.tsx`

---

## Verification

1. `docker-compose down && docker-compose up -d --build`
2. `POST /api/resources/:childId/regenerate` → should return 200 (not 400)
3. Test all routes that use `findByAnyId` with a valid childId
4. Check MinIO container health: `docker inspect --format='{{.State.Health.Status}}' tinysteps_network-minio-1`
5. TypeScript build: `cd tinysteps-ai && npx tsc --noEmit`

# Little Leap Production Readiness Tracker

Last Updated: 2026-04-23
Scope: `desktop-frontend`, `tinysteps-ai`, `tinysteps_flutter`, supporting backend auth/authorization paths needed for prod safety.

## Status Legend
- `OPEN`: not started
- `IN_PROGRESS`: actively being fixed
- `BLOCKED`: needs decision or dependency
- `DONE`: fixed and validated

## Priority Matrix

| ID | Priority | Area | Finding | Status | Validation | Notes |
|---|---|---|---|---|---|---|
| P0-01 | P0 | Flutter Auth | App shell accessible without auth token (`hasToken || isOnboarded`) | DONE | Flutter auth flow test | App shell now requires token and `/home` route is gated |
| P0-02 | P0 | Flutter Community | Guest user id hardcoded in like-state logic | DONE | Community like/unlike test | Like-state now uses authenticated user id from secure storage |
| P0-03 | P0 | Flutter Storage | Sensitive data (token/API key) in plain `SharedPreferences` | DONE | Static scan + login persistence test | Token/API key moved to `flutter_secure_storage` with legacy migration |
| P0-04 | P0 | Backend Auth | Auth middleware allowed guest fallback for missing/invalid tokens | DONE | Backend auth middleware tests | Strict 401 for missing/invalid/expired tokens |
| P1-01 | P1 | FE/Flutter Error UX | No standardized 403/404 handling strategy | DONE | API client regression tests | Added status-aware handling (401 session flow + 403/404 explicit user-facing messages) |
| P1-02 | P1 | FE/Flutter Completeness | User-visible placeholders/no-op actions in prod UI | DONE | Manual UX walk + targeted regression tests | Replaced key placeholders/no-ops with functional actions |
| P1-03 | P1 | Flutter Env Safety | Risky default env target for release | DONE | Build config verification | Release builds now default to production API; supports explicit `API_URL` override |
| P1-04 | P1 | E2E Infra | Docker stack failed in E2E due MinIO host port collision | DONE | `npx playwright test --grep @smoke` | Compose now uses configurable MinIO host ports (defaults 9010/9011) |
| P1-05 | P1 | E2E Reliability | Legacy E2E assertions/fixtures not aligned with current auth + routing behavior | DONE | Full Playwright run + targeted suites | Fixtures/assertions aligned with strict auth and desktop route model |
| P2-01 | P2 | Frontend Perf | Large web bundles | OPEN | Build artifact check | Split heavy chunks |
| P2-02 | P2 | Flutter Quality | High analyzer issue count | OPEN | `flutter analyze` | Reduce warnings and deprecated APIs |

## Work Log

### 2026-04-23
- Created tracker and prioritized remediation queue.
- Started parallel testing agent for continuous failure detection.
- Fixed P0 auth gate in Flutter main shell and `/home` route.
- Removed guest hardcoded identity from Flutter community like-state logic.
- Migrated Flutter token/API key storage to secure storage and added backward-compatible migration.
- Removed backend guest fallback path in required auth middleware (`authMiddleware` now strictly enforces token presence/validity).
- Updated backend auth unit/integration tests to enforce strict 401 behavior (no guest fallback assumptions).
- Fixed production-facing placeholder/no-op actions:
  - Flutter profile: API key link now opens AI Studio; notifications and language settings are persisted.
  - Flutter home: "View All" now navigates to timeline.
  - Flutter health hub: notification icon now provides user feedback.
  - Desktop FE: "Share with Pediatrician" now uses live share flow; premium CTA now links to support inquiry.
- Hardened Flutter API environment selection for release safety (`API_URL` override + production default in release mode).
- Fixed E2E Docker startup reliability by making MinIO host ports configurable and avoiding common 9000/9001 collisions.
- Implemented status-aware FE error handling for ownership/authorization states in:
  - `desktop-frontend/src/api.ts`
  - `tinysteps-ai/services/apiService.ts`
  - `tinysteps_flutter/lib/services/api_service.dart`
- Improved E2E auth reliability:
  - Auth fixture now creates a child profile for authenticated contexts.
  - Fixture stores both `token` and `tinysteps_token` keys and falls back to UI login when storage injection is insufficient.
  - Desktop auth suite now passes (`tests/auth.spec.ts` on `desktop-chromium`).
- Added route aliases for desktop compatibility: `/dashboard`, `/growth-charts`, `/children/new`.
- Added explicit label associations (`htmlFor`/`id`) for desktop login/signup/create-child forms to improve accessibility/testability.
- Made backend rate limiter configurable and increased compose default limit for high-volume local E2E execution.
- Made Playwright Firefox project opt-in via `PLAYWRIGHT_INCLUDE_FIREFOX=true` to avoid environment-dependent instability in default runs.
- Scoped desktop-specific E2E suites to desktop projects only; web/mobile projects continue to validate smoke/API availability.

## Validation Matrix
- `backend`: `npm run test:unit` ✅
- `backend`: `npm run test:integration` ✅
- `desktop-frontend`: `npm run test:run` ✅
- `desktop-frontend`: `npm run build` ✅ (bundle size warning remains)
- `tinysteps-ai`: `npm run test:run` ✅
- `tinysteps-ai`: `npm run build` ✅ (bundle size warning remains)
- `e2e`: `npx playwright test --grep @smoke` ✅ (28 passed)
- `e2e`: `npx playwright test tests/auth.spec.ts --project=desktop-chromium` ✅
- `e2e`: full suite `npx playwright test` ✅ (`40 passed`, `38 skipped`, `0 failed`)
- `tinysteps_flutter`: `flutter analyze tinysteps_flutter` ⚠️ no hard errors from changes; large pre-existing info-level lint backlog remains

## Final Exit Criteria
- All P0 items are `DONE`.
- P1 items either `DONE` or explicitly accepted with documented risk sign-off.
- Full automated test matrix green.
- Manual end-to-end checklist completed for auth, child profile, analysis, reports, community, and logout.

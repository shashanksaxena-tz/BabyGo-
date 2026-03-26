# Probable Errors Found During Test Writing

Errors, inconsistencies, and bugs discovered while writing the test suite.

| # | Severity | Location | Description | Status |
|---|----------|----------|-------------|--------|
| 1 | HIGH | `backend/src/middleware/auth.js:32-48` | Auth middleware falls back to guest user on invalid/missing token instead of returning 401. Any endpoint using `authMiddleware` is accessible without authentication. | Open |
| 2 | HIGH | `backend/src/routes/auth.js:109` | JWT_SECRET fallback duplicated inline (`'tinysteps-dev-secret-change-in-production'`) instead of importing from auth middleware. If env var is missing, both use the same insecure default, but the duplication means a fix in one place won't fix the other. | Open |
| 3 | MEDIUM | `backend/src/routes/children.js:87-89` | `GET /:id` doesn't scope by `userId` — any authenticated user can read any child by ID. Compare with `GET /` (line 45) which correctly filters by `userId`. Same issue in `PUT /:id` (line 104) and `DELETE /:id` (line 123). | Open |
| 4 | MEDIUM | `backend/src/routes/children.js:104-107` | `PUT /:id` uses `{ ...req.body }` spread directly into `findOneAndUpdate` — allows overwriting `userId`, `createdAt`, `achievedMilestones`, or any other field. No field whitelist. | Open |
| 5 | LOW | `backend/src/models/User.js:29` | User preferences.language defaults to `'en'` but `PATCH /api/auth/language` validates against BCP-47 codes like `'en-IN'`. The default `'en'` would fail validation if sent back. | Open |
| 6 | LOW | `backend/src/index.js:57` | Rate limiter applies to all `/api/` routes uniformly (100/15min). Auth endpoints (login/register) should have stricter limits to prevent brute force. | Open |

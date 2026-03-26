# Comprehensive Test Suite — TinySteps AI

**Date:** 2026-03-26
**Status:** Approved
**Scope:** All 7 test layers across backend + 2 React frontends

## Architecture Overview

```
L7  Accessibility (axe-core baked into Playwright)
L6  Load & Performance (k6)
L5  Smoke Tests (Docker compose health)
L4  Playwright E2E (desktop-frontend + tinysteps-ai)
L3  Frontend Unit (Vitest + React Testing Library)
L2  API Integration (Jest + Supertest + Testcontainers)
L1  Backend Unit (Jest + mocks)
```

### Tools

| Tool | Purpose |
|------|---------|
| Jest 29.7 | Backend unit + integration (already installed) |
| Vitest | Frontend unit tests (native Vite, same Jest API) |
| Playwright | E2E + accessibility for both React apps |
| k6 | Load and performance testing |
| Supertest | HTTP assertions against Express |
| Testcontainers | Real MongoDB + MinIO per test suite |
| React Testing Library | Component rendering/interaction tests |
| MSW (Mock Service Worker) | Frontend API mocking |
| @axe-core/playwright | WCAG 2.1 AA accessibility scans |

### Mock Strategy

| Dependency | Unit Tests | Integration Tests | E2E Tests |
|-----------|-----------|-------------------|-----------|
| MongoDB | Mocked | Real (Testcontainers) | Real (Docker) |
| MinIO | Mocked | Real (Testcontainers) | Real (Docker) |
| Gemini AI | Always mocked | Always mocked | Always mocked |
| Sarvam API | Always mocked | Always mocked | Always mocked |
| JWT/Auth | Real | Real | Real |

Gemini and Sarvam are external paid APIs — always mocked with deterministic fixtures.

---

## Layer 1: Backend Unit Tests

**Location:** `backend/tests/unit/`
**Framework:** Jest 29.7
**Config:** `backend/jest.config.js`

### Services

#### geminiService.js
- Prompt construction for development analysis (correct age, domains, milestones included)
- Prompt construction for story generation (theme, child name, age, preferences)
- Prompt construction for illustration generation (landscape orientation, child description)
- Response parsing: valid JSON from Gemini → structured output
- Response parsing: malformed JSON → graceful error
- Retry logic on transient failures
- Rate limit handling
- Mock: `@google/generative-ai` SDK — return fixture responses

#### whoDataService.js
- `getMilestones(age)` returns correct milestones for ages 0-72 months
- Domain filtering (motor, cognitive, language, social)
- Status filtering (on_track, needs_attention, not_started)
- Age range boundary conditions (0, 1, 6, 12, 24, 36, 48, 60, 72)
- Growth percentile calculations against WHO data
- Invalid age handling (negative, > 72, non-numeric)
- Mostly pure logic — minimal mocking needed

#### storageService.js
- Bucket existence check + auto-creation
- File upload path construction (correct prefix, extension)
- Presigned URL generation with expiry
- File deletion
- Mime type validation (allowed: image/*, audio/*)
- File size boundary (at 50MB limit)
- Mock: MinIO client methods

#### sarvamService.js
- Text chunking: splits at 1800 chars respecting sentence boundaries
- Text chunking: text < 1800 chars → single chunk
- Text chunking: empty text → empty array
- Language code validation (11 supported codes)
- English translation short-circuit (returns input unchanged, no API call)
- Translation response assembly from chunks
- TTS base64 audio chunk assembly
- HTTP error handling (timeout, 429, 500)
- Mock: HTTP fetch/axios calls

#### migrationRunner.js
- Discovers migration files in order
- Skips already-run migrations (checks Migration model)
- Records successful migration
- Stops on first failure, reports which migration failed
- Empty migrations directory → no-op
- Mock: Migration model, fs for file listing

### Middleware

#### auth.js
- Valid JWT → `req.user` populated with user data
- Expired JWT → 401 response
- Malformed JWT → 401 response
- Missing Authorization header → 401 response
- Invalid signature → 401 response
- Token with non-existent user ID → 401 response
- Mock: User model findById

#### geminiInit.js
- Valid API key → model initialized
- Missing API key → appropriate error/warning
- Model configuration (temperature, safety settings)

### Models (20 models — validation focus)

For each model, test:
- Required field validation (missing required → validation error)
- Type coercion (string to number, etc.)
- Default values applied
- Enum validation (invalid value rejected)
- Custom validators (email format, password strength, language codes)
- Virtual fields computed correctly
- Pre-save hooks execute

Priority models: User, Child, Analysis, Story, Timeline, Measurement

**Estimated: ~150 test cases**

---

## Layer 2: API Integration Tests

**Location:** `backend/tests/integration/`
**Framework:** Jest + Supertest + Testcontainers
**Config:** Shared in `backend/tests/setup/`

### Test Infrastructure

```javascript
// backend/tests/setup/testcontainers.js
// Starts MongoDB + MinIO containers before all tests
// Provides connection URIs to Express app
// Tears down after all tests complete
```

**Lifecycle:**
1. `globalSetup` — start MongoDB + MinIO containers, export URIs
2. `beforeAll` (per suite) — boot Express app with container URIs, seed test user
3. `beforeEach` — clean collections (drop all except users)
4. `afterAll` (per suite) — close Express app
5. `globalTeardown` — stop containers

**Gemini mock:** Jest mock of geminiService at module level — returns fixture JSON for all AI calls.

### Route Test Suites

#### auth.js (auth flow)
- POST /api/auth/register — success with valid data
- POST /api/auth/register — 400 on duplicate email
- POST /api/auth/register — 400 on invalid email format
- POST /api/auth/register — 400 on weak password
- POST /api/auth/login — success returns JWT
- POST /api/auth/login — 401 on wrong password
- POST /api/auth/login — 401 on non-existent email
- GET /api/auth/profile — returns user profile with valid token
- GET /api/auth/profile — 401 without token
- PATCH /api/auth/language — updates user language preference
- PATCH /api/auth/language — 400 on unsupported language code

#### children.js (child CRUD)
- POST /api/children — create child with required fields
- POST /api/children — response includes computed ageInMonths, displayAge
- GET /api/children — list all children for authenticated user
- GET /api/children/:id — single child with enriched data
- PUT /api/children/:id — update child details
- DELETE /api/children/:id — soft/hard delete
- POST /api/children — 400 on missing required fields
- GET /api/children/:id — 404 on non-existent ID
- Authorization: cannot access other user's children

#### analysis.js (development analysis)
- GET /api/analysis/milestones/:age — returns milestones for age
- GET /api/analysis/milestones/:age?domain=motor — domain filtering
- GET /api/analysis/milestones/:age?status=on_track&childId=X — status filtering with child
- GET /api/analysis/growth-percentiles — WHO growth data
- GET /api/analysis/:childId/trends?period=1m — trends with period filter
- GET /api/analysis/:childId/trends?period=3m — different period
- POST /api/analysis — submit analysis (mocked Gemini), verify DB persistence
- POST /api/analysis — response structure matches expected schema

#### stories.js (bedtime stories)
- POST /api/stories — generate story (mocked Gemini), returns story with pages
- GET /api/stories — list user's stories
- GET /api/stories/:id — single story with pages and illustrations
- POST /api/stories/illustration — trigger illustration generation (mocked)
- PATCH /api/stories/:id/favorite — toggle favorite
- DELETE /api/stories/:id — delete story
- Authorization: cannot access other user's stories

#### timeline.js
- POST /api/timeline — create entry with type, content, childId
- GET /api/timeline/:childId — list entries with pagination
- GET /api/timeline/:childId?type=milestone — filter by type
- DELETE /api/timeline/:id — delete entry
- Pagination: page, limit, total count in response

#### recommendations.js
- GET /api/recommendations/:childId/products — age-appropriate products
- GET /api/recommendations/:childId/activities — activities by domain
- GET /api/recommendations/:childId/recipes — recipes by age
- GET /api/recommendations/:childId/tips — parenting tips

#### upload.js
- POST /api/upload — upload image to MinIO, get URL back
- POST /api/upload — 400 on no file
- POST /api/upload — 400 on invalid mime type
- POST /api/upload — file retrievable from returned URL
- Size limit enforcement

#### doctors.js
- CRUD operations for doctor records
- Authorization scoping

#### resources.js
- GET /api/resources — list with filtering
- Response structure validation

#### reports.js
- POST /api/reports — generate pediatrician report (mocked Gemini)
- GET /api/reports — list reports
- GET /api/reports/:id — single report

#### sarvam.js
- POST /api/sarvam/translate — translation with cache miss (calls API, stores cache)
- POST /api/sarvam/translate — translation with cache hit (returns cached, no API call)
- POST /api/sarvam/tts — TTS returns base64 audio chunks
- POST /api/sarvam/translate — English short-circuit
- POST /api/sarvam/translate — 400 on unsupported language
- Mock: Sarvam HTTP calls

#### community.js
- CRUD posts, comments, likes
- Authorization for edit/delete

#### config.js
- GET /api/config — returns complete config object
- Response includes: domain colors, status labels, languages, recipe categories
- No auth required

**Estimated: ~250 test cases**

---

## Layer 3: Frontend Unit Tests

**Location:** `desktop-frontend/tests/` and `tinysteps-ai/tests/`
**Framework:** Vitest + React Testing Library + MSW
**Config:** `vitest.config.ts` in each frontend root

### Setup

```
# New dependencies per frontend:
vitest
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
msw (Mock Service Worker)
jsdom
```

### MSW Handlers

Shared mock API handlers that intercept fetch/axios calls:
- `handlers/auth.ts` — login, register, profile
- `handlers/children.ts` — child CRUD
- `handlers/analysis.ts` — milestones, trends, growth
- `handlers/stories.ts` — story CRUD
- `handlers/config.ts` — app config

### Desktop Frontend Tests (20 pages)

#### High Priority
| Page | Test Focus |
|------|-----------|
| Login.tsx | Form validation, submit calls API, error display, redirect on success |
| Signup.tsx | Form validation, password requirements, submit, redirect |
| Dashboard.tsx | Renders child selector, displays summary cards, chart rendering, loading state |
| Analysis.tsx | Media upload interaction, submit trigger, loading/error states |
| AnalysisResult.tsx | Renders domain scores, milestone list, domain colors from config |

#### Medium Priority
| Page | Test Focus |
|------|-----------|
| Stories.tsx | Story list rendering, reader view toggle, play/pause, favorite toggle |
| Milestones.tsx | Milestone list by domain, status badges, mark/unmark interaction |
| GrowthCharts.tsx | Chart renders with data, percentile lines, measurement form |
| Timeline.tsx | Entry list, type filter, pagination, create entry form |
| Insights.tsx | Trend charts render, period selector, domain breakdown |

#### Lower Priority
| Page | Test Focus |
|------|-----------|
| Recipes.tsx | Recipe cards render, category filter, regional cuisine filter |
| Recommendations.tsx | Tab navigation (products/activities/tips), card rendering |
| Community.tsx | Post list, create post form, comment interaction |
| Profile.tsx | User info display, child list, settings |
| Remaining pages | Basic render + no crash tests |

### Web App Tests (20+ components)

Same priority structure — HomeDashboard, AnalysisView, BedtimeStoriesView highest priority. Same MSW mocking approach but with fetch instead of axios.

### API Client Tests

- `desktop-frontend/src/api.ts` — all 25+ methods: correct URL construction, auth header injection, 401 interceptor triggers logout
- `tinysteps-ai/services/apiService.ts` — all 60+ methods: correct URL, request body, response parsing, error handling

**Estimated: ~180 test cases across both frontends**

---

## Layer 4: Playwright E2E Tests

**Location:** `e2e/` (root level, shared across both frontends)
**Config:** `e2e/playwright.config.ts`

### Configuration

```typescript
// Two projects: desktop + web
projects: [
  {
    name: 'desktop-chromium',
    use: { baseURL: 'http://localhost:5174', ...devices['Desktop Chrome'] },
  },
  {
    name: 'desktop-firefox',
    use: { baseURL: 'http://localhost:5174', ...devices['Desktop Firefox'] },
  },
  {
    name: 'desktop-webkit',
    use: { baseURL: 'http://localhost:5174', ...devices['Desktop Safari'] },
  },
  {
    name: 'web-chromium',
    use: { baseURL: 'http://localhost:5173', ...devices['Desktop Chrome'] },
  },
  {
    name: 'web-firefox',
    use: { baseURL: 'http://localhost:5173', ...devices['Desktop Firefox'] },
  },
  {
    name: 'web-mobile',
    use: { baseURL: 'http://localhost:5173', ...devices['Pixel 7'] },
  },
]
```

**Pre-requisite:** `docker-compose up` running with seeded test data.
**Port config:** Desktop defaults to 5174, web to 5173 — configurable via `E2E_DESKTOP_URL` and `E2E_WEB_URL` env vars.

### Test Suites

#### auth.spec.ts
- Register new account → redirected to dashboard
- Login with valid credentials → see dashboard
- Login with wrong password → error message
- Logout → redirected to login
- Protected page without auth → redirected to login

#### child-management.spec.ts
- Create child profile → appears in child list
- Edit child details → changes reflected
- Switch between children → dashboard updates
- Delete child → removed from list

#### analysis.spec.ts
- Select child → upload photo/video → submit → view results
- Results show domain scores with correct colors
- Results show milestone recommendations
- Navigate to milestone tracker from results

#### stories.spec.ts
- Generate bedtime story → story appears in list
- Open story → reader view with pages and illustrations
- Navigate between story pages
- Favorite a story → heart icon filled
- Delete story → removed from list

#### growth.spec.ts
- Add measurement (height, weight, head) → chart updates
- Growth chart shows WHO percentile lines
- Switch between chart types (height, weight, head)

#### timeline.spec.ts
- Timeline shows entries in chronological order
- Filter by entry type
- Create new entry → appears in timeline

#### recipes-recommendations.spec.ts
- Browse recipes → filter by category
- Browse recommendations → switch tabs
- View detail page

#### navigation.spec.ts
- All sidebar/nav links navigate correctly
- Back button works
- Deep link to specific page works

**Estimated: ~50 E2E scenarios x 6 browser/device combos = ~300 test runs**

---

## Layer 5: Smoke Tests

**Location:** `e2e/smoke/`
**Framework:** Playwright (reuse setup)
**Target:** Docker compose stack

### Tests

- All Docker services healthy (mongodb, minio, backend, web, desktop)
- `GET /health` → 200 with `{ status: 'ok' }`
- `GET /api/config` → 200 with valid config shape
- `GET /api` → 200 with API documentation
- `POST /api/auth/register` + `POST /api/auth/login` → valid JWT
- `GET /api/analysis/milestones/6` → returns milestone data
- Desktop frontend serves index.html with bundled JS/CSS
- Web frontend serves index.html with bundled JS/CSS
- MinIO health check → bucket accessible

**Estimated: ~15 test cases**

---

## Layer 6: Load & Performance Tests

**Location:** `load-tests/`
**Framework:** k6 (Grafana)
**Target:** Docker compose stack

### Scenarios

#### config-endpoint.js
- `GET /api/config` — 100 VUs for 30s
- Pass criteria: p95 < 50ms, error rate < 1%

#### auth-flow.js
- Register + login cycle — 50 VUs for 30s
- Pass criteria: p95 < 200ms, error rate < 1%

#### milestones-read.js
- `GET /api/analysis/milestones/:age` — 100 VUs for 30s, random age 0-72
- Pass criteria: p95 < 100ms, error rate < 1%

#### story-generation.js
- `POST /api/stories` (mocked Gemini) — 20 VUs for 30s
- Pass criteria: p95 < 500ms, error rate < 1%

#### file-upload.js
- `POST /api/upload` with 5MB test image — 10 VUs for 30s
- Pass criteria: p95 < 1s, error rate < 1%

#### mixed-workload.js
- Realistic traffic: 60% reads (config, milestones, stories), 30% writes (analysis, timeline), 10% uploads
- 200 concurrent VUs for 60s
- Pass criteria: p95 < 300ms, error rate < 2%, no 5xx errors

**Estimated: 6 scenarios**

---

## Layer 7: Accessibility Tests

**Location:** Integrated into `e2e/` Playwright tests
**Framework:** @axe-core/playwright

### Approach

Every Playwright E2E test gets an accessibility assertion appended:

```typescript
// After each critical page interaction:
const accessibilityResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();
expect(accessibilityResults.violations).toEqual([]);
```

### Dedicated Accessibility Tests (`e2e/accessibility/`)

| Test | Focus |
|------|-------|
| forms.spec.ts | All form inputs have labels, error messages associated, required fields indicated |
| navigation.spec.ts | Keyboard navigation through all nav items, focus visible, skip links |
| modals.spec.ts | Focus trapped in modals, Escape closes, focus returns to trigger |
| images.spec.ts | All images have alt text, decorative images have empty alt |
| color-contrast.spec.ts | Text meets 4.5:1 ratio (AA), large text meets 3:1 |
| headings.spec.ts | Heading hierarchy (no skipped levels), one h1 per page |
| aria.spec.ts | ARIA roles correct, live regions for dynamic content, button labels |

**Estimated: ~15 dedicated tests + assertions on every E2E page**

---

## File Structure

```
BabyGo-/
├── backend/
│   ├── jest.config.js
│   ├── tests/
│   │   ├── setup/
│   │   │   ├── testcontainers.js      # Global setup/teardown
│   │   │   ├── app.js                 # Boot Express for testing
│   │   │   └── fixtures/              # Gemini response fixtures, test data
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   │   ├── geminiService.test.js
│   │   │   │   ├── whoDataService.test.js
│   │   │   │   ├── storageService.test.js
│   │   │   │   ├── sarvamService.test.js
│   │   │   │   └── migrationRunner.test.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.test.js
│   │   │   │   └── geminiInit.test.js
│   │   │   └── models/
│   │   │       ├── User.test.js
│   │   │       ├── Child.test.js
│   │   │       └── ...
│   │   └── integration/
│   │       ├── auth.test.js
│   │       ├── children.test.js
│   │       ├── analysis.test.js
│   │       ├── stories.test.js
│   │       ├── timeline.test.js
│   │       ├── recommendations.test.js
│   │       ├── upload.test.js
│   │       ├── doctors.test.js
│   │       ├── resources.test.js
│   │       ├── reports.test.js
│   │       ├── sarvam.test.js
│   │       ├── community.test.js
│   │       └── config.test.js
├── desktop-frontend/
│   ├── vitest.config.ts
│   └── tests/
│       ├── setup/
│       │   ├── msw-handlers.ts
│       │   └── test-utils.tsx          # Render with providers
│       ├── pages/
│       │   ├── Login.test.tsx
│       │   ├── Dashboard.test.tsx
│       │   └── ...
│       └── api.test.ts
├── tinysteps-ai/
│   ├── vitest.config.ts
│   └── tests/
│       ├── setup/
│       │   ├── msw-handlers.ts
│       │   └── test-utils.tsx
│       ├── components/
│       │   ├── HomeDashboard.test.tsx
│       │   ├── AnalysisView.test.tsx
│       │   └── ...
│       └── services/
│           └── apiService.test.ts
├── e2e/
│   ├── playwright.config.ts
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── child-management.spec.ts
│   │   ├── analysis.spec.ts
│   │   ├── stories.spec.ts
│   │   ├── growth.spec.ts
│   │   ├── timeline.spec.ts
│   │   ├── recipes-recommendations.spec.ts
│   │   └── navigation.spec.ts
│   ├── smoke/
│   │   └── health.spec.ts
│   ├── accessibility/
│   │   ├── forms.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── modals.spec.ts
│   │   ├── images.spec.ts
│   │   ├── color-contrast.spec.ts
│   │   ├── headings.spec.ts
│   │   └── aria.spec.ts
│   └── fixtures/
│       └── test-data.ts                # Seed data for E2E
├── load-tests/
│   ├── config-endpoint.js
│   ├── auth-flow.js
│   ├── milestones-read.js
│   ├── story-generation.js
│   ├── file-upload.js
│   └── mixed-workload.js
```

## NPM Scripts

### Backend (package.json)
```json
{
  "test": "jest",
  "test:unit": "jest --testPathPattern=tests/unit",
  "test:integration": "jest --testPathPattern=tests/integration",
  "test:coverage": "jest --coverage"
}
```

### Desktop Frontend (package.json)
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### Tinysteps-AI (package.json)
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### Root (package.json or Makefile)
```json
{
  "test:backend": "cd backend && npm test",
  "test:desktop": "cd desktop-frontend && npm test",
  "test:web": "cd tinysteps-ai && npm test",
  "test:e2e": "npx playwright test --config=e2e/playwright.config.ts",
  "test:smoke": "npx playwright test --config=e2e/playwright.config.ts --grep @smoke",
  "test:a11y": "npx playwright test --config=e2e/playwright.config.ts --grep @a11y",
  "test:load": "k6 run load-tests/mixed-workload.js",
  "test:all": "npm run test:backend && npm run test:desktop && npm run test:web && npm run test:e2e"
}
```

## Total Estimated Coverage

| Layer | Test Cases |
|-------|-----------|
| L1 Backend Unit | ~150 |
| L2 API Integration | ~250 |
| L3 Frontend Unit | ~180 |
| L4 Playwright E2E | ~50 scenarios |
| L5 Smoke | ~15 |
| L6 Load/Perf | 6 scenarios |
| L7 Accessibility | ~15 dedicated + all E2E |
| **Total** | **~660+** |

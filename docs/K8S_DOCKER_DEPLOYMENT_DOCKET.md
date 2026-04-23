# Little Leap Kubernetes Docker Deployment Docket

This document is a Kubernetes-focused handoff for teams that already have their own K8s manifests and CI/CD.

Scope:
- Docker images to build/push
- Runtime environment variables
- Required dependency services (MongoDB, MinIO)
- Migration and seed order (including exact commands)

Non-scope:
- K8s YAML authoring (Deployment/Service/Ingress/Secrets) since your team owns this

## 1. Docker Artifacts to Build

Build these images from repo root:

```bash
# Backend API
docker build -f backend/Dockerfile -t <registry>/tinysteps-backend:<tag> backend

# Web app (mobile-style React app, served by nginx on 3005)
docker build -f tinysteps-ai/Dockerfile -t <registry>/tinysteps-web:<tag> tinysteps-ai

# Desktop frontend (served by nginx on 5173)
docker build -f desktop-frontend/Dockerfile -t <registry>/tinysteps-desktop:<tag> desktop-frontend
```

Push:

```bash
docker push <registry>/tinysteps-backend:<tag>
docker push <registry>/tinysteps-web:<tag>
docker push <registry>/tinysteps-desktop:<tag>
```

Source Dockerfiles:
- `backend/Dockerfile`
- `tinysteps-ai/Dockerfile`
- `desktop-frontend/Dockerfile`

## 2. External Services Required by Backend

Backend requires:
- MongoDB (persistent)
- MinIO/S3-compatible object storage (for profile photos, story illustrations, reports)

Backend will still start if MinIO is down, but upload/report media features will fail.

## 3. Backend Environment Variables (Runtime Contract)

Set these in K8s Secret/ConfigMap and inject into backend container.

### 3.1 Required

- `PORT` (default `3001`)
- `NODE_ENV` (`production` recommended)
- `MONGODB_URI` (Mongo connection string)
- `JWT_SECRET` (strong secret; do not use defaults)
- `GEMINI_API_KEY` (required for AI analysis/story/recommendations)
- `WEB_APP_URL` (allowed CORS origin)
- `MOBILE_APP_URL` (allowed CORS origin, optional if not used)
- `MINIO_ENDPOINT` (MinIO host reachable from backend pod)
- `MINIO_PORT` (default `9000`)
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_USE_SSL` (`true`/`false`)
- `MINIO_PUBLIC_URL` (public/browser-reachable MinIO URL, not internal pod DNS)

### 3.2 Optional but Recommended

- `MINIO_BUCKET_PROFILES` (default `profile-photos`)
- `MINIO_BUCKET_STORIES` (default `story-illustrations`)
- `MINIO_BUCKET_REPORTS` (default `report-pdfs`)
- `RATE_LIMIT_WINDOW_MS` (default `900000`)
- `RATE_LIMIT_MAX` (default `100`)
- `SARVAM_API_KEY` (if Sarvam features enabled)

### 3.3 Seed-time Optional

- `SEED_API_URL` (default `http://localhost:3001/api`) for realistic seed script

## 4. Frontend Runtime/Build Notes (K8s)

### 4.1 `tinysteps-ai` image
- Served by nginx on port `3005`.
- nginx proxies `/api` to `http://backend:3001/api/`.
- In K8s, ensure service DNS/route named `backend` or adjust nginx config before build.

### 4.2 `desktop-frontend` image
- Served by nginx on port `5173`.
- Build arg `VITE_API_URL` exists; default is `/api`.
- nginx also proxies `/api` to `http://backend:3001/api/`.

Build with explicit API base if needed:

```bash
docker build \
  -f desktop-frontend/Dockerfile \
  --build-arg VITE_API_URL=/api \
  -t <registry>/tinysteps-desktop:<tag> \
  desktop-frontend
```

## 5. Startup and Data Initialization Order

Use this order in deployment pipeline:

1. Provision MongoDB and MinIO.
2. Deploy backend with all env vars.
3. Wait for backend health `GET /health` = `200`.
4. Let migration runner complete (automatic on backend startup).
5. Run optional seed jobs (only if you want seeded/demo data).
6. Deploy frontends (`tinysteps-web`, `tinysteps-desktop`).

## 6. Migrations: What Runs Automatically

Migrations run automatically in backend startup (`runMigrations()`).

Migration files (in order):
- `backend/src/migrations/001-seed-doctors.js`
- `backend/src/migrations/002-seed-milestones.js`
- `backend/src/migrations/003-migrate-milestone-ids.js`
- `backend/src/migrations/004-seed-expanded-milestones.js`
- `backend/src/migrations/005-seed-recipes.js`
- `backend/src/migrations/006-seed-tips.js`
- `backend/src/migrations/007-seed-products.js`
- `backend/src/migrations/008-seed-activities.js`
- `backend/src/migrations/009-enrich-descriptions.js`

Migration status is tracked in `Migration` collection (idempotent per migration name).

Important behavior:
- Migration failures are logged but backend continues startup (non-blocking).
- For production rigor, monitor startup logs and fail rollout if migration failures are detected.

## 7. Seed Scripts (Manual / One-Off Jobs)

These are not part of migration runner unless noted.

## 7.1 Realistic full data seed (optional, dev/UAT)

Creates sample families, children, analyses, stories, timeline, community data.

Prerequisites:
- Backend reachable
- Mongo reachable
- Migrations already completed (especially milestone seeds)

Command:

```bash
cd backend
npm run seed:realistic
```

Equivalent:

```bash
node src/seeds/seedRealisticData.js
```

For K8s one-off job, set:
- `MONGODB_URI`
- `SEED_API_URL` (for example `http://<backend-service>:3001/api`)

## 7.2 Doctors standalone seed (legacy/manual, usually not needed)

Doctors are already seeded by migration `001-seed-doctors.js`.
Run this only if explicitly needed for repair/backfill:

```bash
cd backend
node src/scripts/seedDoctors.js
```

## 8. Example One-Off K8s Seed Job Command

If your platform supports overriding container command in a Job:

```bash
npm run seed:realistic
```

Run this against the same backend version/image and same environment variables used in deployment.

## 9. Verification Checklist

After deployment + migration/seed:

1. Backend health:
```bash
curl -f http://<backend-host>/health
```

2. Config endpoint:
```bash
curl -f http://<backend-host>/api/config
```

3. Frontends load:
- `http://<web-host>/` (tinysteps-web)
- `http://<desktop-host>/` (tinysteps-desktop)

4. Data sanity:
- doctors endpoint returns entries:
```bash
curl -f http://<backend-host>/api/doctors
```
- recommendations endpoints return seeded/static data for a real child id

## 10. Production-Safety Notes

- Do not run `seed:realistic` on production with live PII unless explicitly intended.
- Rotate and securely store `JWT_SECRET`, `GEMINI_API_KEY`, `MINIO_SECRET_KEY`.
- Ensure CORS (`WEB_APP_URL`, `MOBILE_APP_URL`) exactly matches deployed origins.
- Ensure `MINIO_PUBLIC_URL` is externally reachable by browsers; internal service DNS is not enough.

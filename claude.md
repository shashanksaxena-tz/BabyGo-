# TinySteps AI - Project Context

## Architecture Overview

This project has **3 UI platforms** + 1 desktop app that consume a single backend API:

1. **Web App** (`/tinysteps-ai/`) - React/TypeScript with Vite
2. **Mobile Apps** (`/tinysteps_flutter/`) - Flutter for Android & iOS
3. **Desktop App** (`/desktop-frontend/`) - React/TypeScript with Vite + Electron
4. **Backend API** (`/backend/`) - Node.js/Express with MongoDB

### Backend-First Architecture (CRITICAL)

**ALL business logic lives on the backend.** Frontends are pure UI layers.

- **No direct AI calls from frontends** - All Gemini calls go through backend endpoints
- **No hardcoded WHO data on frontends** - Milestones and growth data fetched from `/api/analysis/milestones/:age` and `/api/analysis/growth-percentiles`
- **No hardcoded status/domain config on frontends** - All config fetched from `/api/config`
- **No age calculations on frontends** - Backend enriches child profiles with `ageInMonths`, `ageInDays`, `displayAge`
- **No trend/chart calculations on frontends** - Backend provides `/api/analysis/:childId/trends`

### Key Backend Endpoints
- `GET /api/config` - Single source of truth for domain colors, status labels, score thresholds, time filters, languages, recipe categories, regional cuisine mapping
- `GET /api/analysis/milestones/:age?status=&domain=&childId=` - WHO milestones with server-side filtering
- `GET /api/analysis/:childId/trends?period=` - Pre-computed chart data, trends, milestone stats
- `POST /api/analysis/baby-sounds` - Baby vocalization analysis via Gemini
- `POST /api/analysis/transcribe` - Parent audio transcription
- `POST /api/stories/illustration` - AI illustration generation with child photo support

## Development Guidelines

### Feature Development
When building a new feature, it MUST be implemented end-to-end:
1. Backend API endpoint(s) with ALL business logic
2. Flutter mobile implementation (UI only, calls backend)
3. Web React implementation (UI only, calls backend)
4. Desktop implementation (UI only, calls backend)

**Never** put business logic on frontends. **Never** make direct AI API calls from frontends.

### API-First Approach
- Define API endpoints in backend first
- All frontends (Flutter, Web, Desktop) consume the same REST API
- Use `/api/config` for shared configuration (don't hardcode enums, colors, labels)
- Backend returns enriched data (computed fields, labels, interpretations)

### Current Features

| Feature | Backend | Flutter | Web | Desktop |
|---------|---------|---------|-----|---------|
| Auth (login/register) | ✅ | 🔄 | 🔄 | 🔄 |
| Child Profiles | ✅ | 🔄 | 🔄 | 🔄 |
| Development Analysis | ✅ | ✅ | ✅ | ✅ |
| Bedtime Stories | ✅ | ✅ | ✅ | ✅ |
| Recipes | ✅ | 🔄 | 🔄 | 🔄 |
| Recommendations | ✅ | 🔄 | 🔄 | 🔄 |
| Milestones Tracker | ✅ | 🔄 | 🔄 | 🔄 |
| Growth Charts (WHO) | ✅ | 🔄 | 🔄 | 🔄 |
| Timeline | ✅ | ✅ | ✅ | ✅ |
| Baby Sound Analysis | ✅ | 🔄 | 🔄 | ❌ |
| Audio Transcription | ✅ | 🔄 | 🔄 | ❌ |
| Story Illustrations | ✅ | 🔄 | 🔄 | ❌ |
| App Config | ✅ | ✅ | ✅ | ✅ |
| Trends/Charts Data | ✅ | 🔄 | 🔄 | 🔄 |

Legend: ✅ Complete | 🔄 Partial/Needs Integration | ❌ Not Started

### Tech Stack

**Backend (ALL business logic here):**
- Express.js with MongoDB
- JWT authentication
- Gemini AI integration (all AI calls centralized)
- WHO data service (milestones, growth percentiles)
- MinIO for file storage
- Multer for file uploads

**Flutter (Mobile - UI only):**
- Provider for state management
- fl_chart for charts
- http for backend API calls

**Web (React - UI only):**
- TypeScript with Vite
- Framer Motion for animations
- Recharts for visualizations
- React Query for data fetching

**Desktop (React - UI only):**
- TypeScript with Vite + Electron
- Recharts for visualizations
- useAppConfig hook for config caching

### Environment Configuration

**Backend:** Configure via `.env`
```
MONGODB_URI=mongodb://localhost:27017/tinysteps
JWT_SECRET=your-secret
GEMINI_API_KEY=your-key
```

**Flutter:** Configure API URL in `lib/config/api_config.dart`

**Web:** Configure via `.env`
```
VITE_API_URL=http://localhost:3001/api
```

### Running Locally

```bash
# Start all services with Docker
docker-compose up -d

# Or run individually:
# Backend
cd backend && npm install && npm run dev

# Web
cd tinysteps-ai && npm install && npm run dev

# Flutter
cd tinysteps_flutter && flutter pub get && flutter run
```

## File Structure

```
BabyGo-/
├── backend/                 # Node.js API (ALL business logic)
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints + config.js
│   │   ├── services/       # Gemini AI, WHO data, MinIO
│   │   └── middleware/     # Auth, validation
│   └── Dockerfile
├── tinysteps-ai/           # React Web App (UI only)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Page components
│   │   ├── services/       # API client (apiService.ts only)
│   │   └── hooks/          # Custom React hooks
│   └── Dockerfile
├── tinysteps_flutter/      # Flutter Mobile App (UI only)
│   ├── lib/
│   │   ├── models/         # Data models
│   │   ├── screens/        # Screen widgets
│   │   ├── services/       # API client (api_service.dart only)
│   │   ├── widgets/        # Reusable widgets
│   │   └── config/         # App configuration
│   └── pubspec.yaml
├── desktop-frontend/       # Desktop App (UI only)
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # useAppConfig, etc.
│   │   └── components/     # Reusable UI components
│   └── Dockerfile
└── docker-compose.yml      # Full stack deployment
```

## Important Notes

- All features must work offline-first where possible (especially mobile)
- Cache `/api/config` response locally for offline access
- No medical advice - informational purposes only
- Child photos require explicit consent handling
- Never add business logic to frontends - if it's not a UI concern, it belongs on the backend

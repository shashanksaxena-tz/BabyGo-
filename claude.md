# TinySteps AI - Project Context

## Architecture Overview

This project has **3 UI platforms** that must be kept in sync:

1. **Web App** (`/tinysteps-ai/`) - React/TypeScript with Vite
2. **Mobile Apps** (`/tinysteps_flutter/`) - Flutter for Android & iOS
3. **Backend API** (`/backend/`) - Node.js/Express with MongoDB

## Development Guidelines

### Feature Development
When building a new feature, it MUST be implemented end-to-end:
1. Backend API endpoint(s)
2. Flutter mobile implementation (serves both Android & iOS)
3. Web React implementation
4. Proper integration tests

**Never** build mock implementations - always integrate with real backend.

### API-First Approach
- Define API endpoints in backend first
- Both Flutter and Web apps consume the same REST API
- Use shared data models/types where possible

### Current Features

| Feature | Backend | Flutter | Web |
|---------|---------|---------|-----|
| Auth (login/register) | ✅ | 🔄 | 🔄 |
| Child Profiles | ✅ | 🔄 | 🔄 |
| Development Analysis | ✅ | ✅ | ✅ |
| Bedtime Stories | ✅ | ✅ | ✅ |
| Recipes | ✅ | 🔄 | ❌ |
| Recommendations | ✅ | 🔄 | ❌ |
| Milestones Tracker | ✅ | 🔄 | ❌ |
| Growth Charts (WHO) | ✅ | 🔄 | ❌ |
| Timeline | ✅ | ✅ | ✅ |

Legend: ✅ Complete | 🔄 Partial/Needs Integration | ❌ Not Started

### Tech Stack

**Backend:**
- Express.js with MongoDB
- JWT authentication
- Gemini AI integration
- Multer for file uploads

**Flutter (Mobile):**
- Provider for state management
- fl_chart for charts
- google_generative_ai for direct Gemini calls
- http for API calls

**Web (React):**
- TypeScript with Vite
- Framer Motion for animations
- Recharts for visualizations
- React Query for data fetching

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
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic (Gemini, WHO data)
│   │   └── middleware/     # Auth, validation
│   └── Dockerfile
├── tinysteps-ai/           # React Web App
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Page components
│   │   ├── services/       # API client
│   │   └── hooks/          # Custom React hooks
│   └── Dockerfile
├── tinysteps_flutter/      # Flutter Mobile App
│   ├── lib/
│   │   ├── models/         # Data models
│   │   ├── screens/        # Screen widgets
│   │   ├── services/       # API & Gemini services
│   │   ├── widgets/        # Reusable widgets
│   │   └── config/         # App configuration
│   └── pubspec.yaml
└── docker-compose.yml      # Full stack deployment
```

## Important Notes

- All features must work offline-first where possible (especially mobile)
- WHO data should be cached locally for offline access
- No medical advice - informational purposes only
- Child photos require explicit consent handling

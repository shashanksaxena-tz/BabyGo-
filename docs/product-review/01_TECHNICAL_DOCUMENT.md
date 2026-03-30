# TinySteps AI - Technical Architecture Document

**Document Version:** 1.0
**Date:** March 30, 2026
**Classification:** Internal Technical Reference

---

## 1. Executive Technical Summary

TinySteps AI (BabyGo-) is a multi-platform child development tracking platform built on a modern full-stack architecture. The system uses a centralized Node.js/Express backend with MongoDB persistence, Google Gemini AI integration for intelligent analysis, and three frontend clients: React web app, Flutter mobile app, and Electron desktop app.

The platform tracks child growth against WHO (World Health Organization) standards, provides AI-powered developmental assessments, generates personalized content (stories, recipes, activities), and connects parents with healthcare professionals.

---

## 2. System Architecture Overview

```
                          ┌─────────────────────────────────────┐
                          │           CLIENTS                    │
                          │                                      │
                          │  ┌──────────┐ ┌────────┐ ┌────────┐ │
                          │  │ Web App  │ │ Mobile │ │Desktop │  │
                          │  │ React+TS │ │Flutter │ │Electron│  │
                          │  │ :5173    │ │        │ │        │  │
                          │  └────┬─────┘ └───┬────┘ └───┬────┘ │
                          └───────┼───────────┼──────────┼──────┘
                                  │           │          │
                                  ▼           ▼          ▼
                          ┌─────────────────────────────────────┐
                          │         NGINX REVERSE PROXY          │
                          │              :3000                   │
                          └──────────────┬──────────────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────────────┐
                          │       BACKEND API (Express.js)       │
                          │              :3001                   │
                          │                                      │
                          │  ┌────────────────────────────────┐  │
                          │  │         MIDDLEWARE STACK        │  │
                          │  │  Helmet│CORS│RateLimit│Morgan  │  │
                          │  └────────────────────────────────┘  │
                          │                                      │
                          │  ┌────────────────────────────────┐  │
                          │  │          ROUTE LAYER           │  │
                          │  │ Auth│Children│Analysis│Stories │  │
                          │  │ Timeline│Recs│Reports│Doctors  │  │
                          │  │ Community│Resources│Upload     │  │
                          │  └────────────────────────────────┘  │
                          │                                      │
                          │  ┌────────────────────────────────┐  │
                          │  │         SERVICE LAYER          │  │
                          │  │ GeminiService│WHODataService   │  │
                          │  │ StorageService│PDFService      │  │
                          │  └────────────────────────────────┘  │
                          │                                      │
                          │  ┌────────────────────────────────┐  │
                          │  │          MODEL LAYER           │  │
                          │  │ Mongoose ODM (15+ Models)      │  │
                          │  └────────────────────────────────┘  │
                          └──────┬───────────┬──────────┬───────┘
                                 │           │          │
                    ┌────────────▼──┐  ┌─────▼────┐  ┌─▼──────────────┐
                    │   MongoDB     │  │  MinIO   │  │  Google Gemini │
                    │   :27017      │  │  :9000   │  │  (External)    │
                    │               │  │          │  │                │
                    │  15+ Collections│ │ Buckets: │  │ gemini-2.5-   │
                    │  User,Child,  │  │ profiles │  │ flash (text)  │
                    │  Analysis,    │  │ stories  │  │ gemini-2.5-   │
                    │  Story, etc.  │  │ reports  │  │ flash (vision)│
                    └───────────────┘  └──────────┘  └───────────────┘
```

---

## 3. Technology Stack

### 3.1 Backend

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 18+ | Server runtime |
| Framework | Express.js | 4.x | HTTP framework (ES6 modules) |
| Database | MongoDB | 7.x | Document store |
| ODM | Mongoose | 8.x | Schema modeling & validation |
| Authentication | JWT + bcryptjs | - | Stateless auth, password hashing (12 salt rounds) |
| AI Engine | Google Gemini API | gemini-2.5-flash | Text/vision analysis, content generation |
| Object Storage | MinIO | Latest | S3-compatible file storage |
| File Uploads | Multer | - | Multipart form handling |
| Validation | express-validator | - | Input sanitization |
| Security | Helmet | - | HTTP security headers |
| Rate Limiting | express-rate-limit | - | 100 req/15 min per IP |
| PDF Generation | PDFKit | - | Pediatrician report PDFs |
| Logging | Morgan | - | HTTP request logging |

### 3.2 Frontend - Web (React)

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 19.2.4 | UI library |
| Language | TypeScript | 5.x | Type safety |
| Build Tool | Vite | 6.2.0 | Dev server & bundling |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Animation | Framer Motion | 12.31.0 | UI animations |
| Charts | Recharts | 3.7.0 | Growth/development charts |
| Forms | React Hook Form + Zod | 7.71.2 | Form management & validation |
| Icons | Lucide React | - | Icon system |
| State | React Context API | - | Global state management |

### 3.3 Frontend - Mobile (Flutter)

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Flutter | 3.2.0+ | Cross-platform mobile |
| Language | Dart | 3.x | Programming language |
| State (Simple) | Provider | 6.1.1 | Dependency injection & state |
| State (Complex) | Riverpod | 2.4.9 | Reactive state management |
| Charts | FL Chart + Syncfusion | 0.66.2 | Growth visualization |
| Media | Image Picker, Camera | - | Photo/video capture |
| Audio | AudioPlayers, Record | - | Audio recording & playback |
| Local DB | Hive | - | Offline data persistence |
| HTTP | Dio | - | Network requests |
| Animations | Flutter Animate, Lottie, Rive | - | Rich animations |

### 3.4 Frontend - Desktop (Electron)

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Shell | Electron | Latest | Desktop wrapper |
| Framework | React | 19.2.0 | UI (shared with web) |
| Build Tool | Vite | 7.3.1 | Bundling |
| Styling | Tailwind CSS | 4.2.1 | Styling |
| HTTP | Axios | 1.13.6 | API communication |
| Charts | Recharts | 3.7.0 | Data visualization |
| Router | React Router DOM | - | Navigation |

### 3.5 Infrastructure

| Component | Technology | Purpose |
|---|---|---|
| Containerization | Docker + Docker Compose | Service orchestration |
| Reverse Proxy | Nginx | Request routing, static serving |
| CI/CD | Docker Compose | Local development stack |

---

## 4. Database Architecture

### 4.1 Entity Relationship Overview

```
User (1) ─────────── (N) Child
  │                        │
  │                        ├── (N) Measurement
  │                        ├── (N) Analysis ──── (N) Resource
  │                        ├── (N) Story
  │                        ├── (N) Report
  │                        ├── (N) Timeline
  │                        └── (N) RecipeCache
  │
  ├── (N) Post ──── (N) Comment
  └── (N) UserRecipeFavorite

Milestone (standalone - WHO reference data)
AgeActivity (standalone - activity library)
Recipe (standalone - recipe library)
Tip (standalone - tips library)
Product (standalone - product recommendations)
Doctor (standalone - healthcare directory)
TranslationCache (utility - translation caching)
Migration (utility - schema versioning)
```

### 4.2 Core Collections

| Collection | Documents (Est.) | Growth Rate | Indexes |
|---|---|---|---|
| users | Low | Slow | email (unique) |
| children | Low-Medium | Slow | userId |
| measurements | Medium | Moderate | childId, date |
| analyses | Medium | Moderate | childId, userId |
| stories | Medium-High | Fast | childId, userId |
| milestones | ~300 (static) | None | uuid, domain, ageRange |
| recipes | ~200 (seeded) | Slow | ageRange, mealType |
| tips | ~150 (seeded) | Slow | category, ageRange |
| products | ~100 (seeded) | Slow | category, ageRange |
| doctors | ~50 (seeded) | Slow | specialty, domains |
| posts | Medium | Moderate | category, userId |
| comments | Medium-High | Fast | postId |
| reports | Low-Medium | Moderate | childId |
| timelines | High | Fast | childId, date |
| resources | Medium | Moderate | childId, domain |
| translationcaches | Medium | Moderate | 30-day TTL |

### 4.3 Key Schema Patterns

- **Embedded Documents**: Child.achievedMilestones, Analysis.domainAssessments, Story.pages
- **Referenced Documents**: Analysis -> Child (ObjectId), Report -> Analysis (ObjectId)
- **TTL Indexes**: TranslationCache (30-day expiry)
- **Compound Queries**: Milestones by domain + age range, Recipes by mealType + allergens + ageRange

---

## 5. API Architecture

### 5.1 RESTful Endpoint Summary

| Route Group | Base Path | Endpoints | Auth Required |
|---|---|---|---|
| Authentication | `/api/auth` | 6 | Partial |
| Children | `/api/children` | 10 | Yes |
| Analysis | `/api/analysis` | 8 | Yes |
| Stories | `/api/stories` | 7 | Yes |
| Timeline | `/api/timeline` | 5 | Yes |
| Recommendations | `/api/recommendations` | 8 | Yes |
| Resources | `/api/resources` | 2 | Yes |
| Reports | `/api/reports` | 5 | Yes |
| Doctors | `/api/doctors` | 2 | Yes |
| Community | `/api/community` | 5 | Yes |
| Upload | `/api/upload` | 1 | Yes |
| Config | `/api/config` | 3 | No |
| Sarvam | `/api/sarvam` | 1 | Yes |
| **Total** | | **63** | |

### 5.2 Authentication Flow

```
Register/Login ──> JWT Token (access) + Refresh Token
       │
       ▼
Request with Authorization: Bearer <token>
       │
       ▼
auth.js middleware ──> Verify JWT ──> Attach user to req
       │
       ▼
Route handler with req.user available
```

### 5.3 Rate Limiting Strategy

- **Global**: 100 requests per 15-minute window per IP
- **Applied via**: express-rate-limit middleware
- **Response on exceed**: 429 Too Many Requests

---

## 6. AI Integration Architecture

### 6.1 Google Gemini Service (`geminiService.js`)

The Gemini service is the core intelligence layer, handling:

| Function | Model Used | Input | Output |
|---|---|---|---|
| Development Analysis | gemini-2.5-flash | Photos/videos + child data | Scores, assessments, tips |
| Baby Sound Analysis | gemini-2.5-flash | Audio file + child data | Vocalization analysis |
| Story Generation | gemini-2.5-flash | Theme + child profile | Multi-page story with morals |
| Illustration Generation | gemini-2.5-flash | Text prompt + child photo | Generated image |
| Recipe Generation | gemini-2.5-flash | Child age + preferences | Age-appropriate recipes |
| Activity Generation | gemini-2.5-flash | Child profile + domains | Development activities |
| Product Recommendations | gemini-2.5-flash | Child age + needs | Toy/product suggestions |
| Tip Generation | gemini-2.5-flash | Child data + analysis | Parenting tips |
| Resource Generation | gemini-2.5-flash | Analysis results | Learning resources |

### 6.2 WHO Data Service (`whoDataService.js`)

Provides evidence-based reference data:
- Growth percentile calculations (weight, height, head circumference)
- Milestone age-range mappings across 4 developmental domains
- Regional growth standards (AFRO, AMRO, SEARO, EURO, EMRO, WPRO)
- Growth curve reference data for charting

---

## 7. File Storage Architecture

### 7.1 MinIO Bucket Structure

```
MinIO Server (:9000)
├── profile-photos/
│   └── <userId>/<childId>/<uuid>.jpg
├── story-illustrations/
│   └── <storyId>/<pageIndex>_<uuid>.png
└── report-pdfs/
    └── <childId>/<reportNumber>.pdf
```

### 7.2 Upload Flow

```
Client ──(multipart/form-data)──> Multer ──> MinIO SDK ──> MinIO Bucket
                                                │
                                                ▼
                                        Returns public URL
```

---

## 8. Deployment Architecture

### 8.1 Docker Compose Stack

```yaml
Services:
  web-app:     React (Nginx) ──────────── Port 3000
  backend:     Express.js    ──────────── Port 3001
  mongo:       MongoDB 7     ──────────── Port 27017
  minio:       MinIO         ──────────── Port 9000 (API), 9001 (Console)
```

### 8.2 Network Topology

```
External Traffic
      │
      ▼
  Nginx (:3000)
      │
      ├── /api/* ────────> Backend (:3001)
      │                        │
      │                        ├──> MongoDB (:27017)
      │                        ├──> MinIO (:9000)
      │                        └──> Gemini API (external)
      │
      └── /* ────────────> Static React Assets
```

---

## 9. Security Architecture

| Layer | Mechanism | Details |
|---|---|---|
| Transport | HTTPS (production) | TLS termination at proxy |
| Authentication | JWT | Stateless, short-lived tokens |
| Password Storage | bcryptjs | 12 salt rounds |
| API Security | Helmet.js | X-Frame-Options, CSP, HSTS |
| Rate Limiting | express-rate-limit | 100 req/15 min/IP |
| Input Validation | express-validator | Sanitize all inputs |
| CORS | cors middleware | Whitelist allowed origins |
| File Upload | Multer | Type & size validation |
| API Keys | Server-side only | Gemini key never exposed to client |

---

## 10. State Management Architecture

### 10.1 Backend State

- **MongoDB**: Primary persistent state (all user data, content, analyses)
- **MinIO**: Binary asset state (images, PDFs)
- **In-Memory**: WHO reference data loaded at startup

### 10.2 Web Frontend State

```
React Context API
  ├── User state (auth, preferences)
  ├── Active child profile
  ├── Navigation state (current screen)
  └── Analysis results cache

localStorage
  ├── JWT tokens
  ├── Child profiles (offline access)
  └── Cached analysis data
```

### 10.3 Mobile State

```
Provider/Riverpod
  ├── Auth state
  ├── Child profiles
  ├── Screen navigation
  └── Feature data

Hive (Local DB)
  ├── Offline child data
  ├── Cached content
  └── User preferences

SharedPreferences
  └── Simple key-value settings
```

---

## 11. Data Flow Diagrams

### 11.1 Development Analysis Flow

```
1. Parent uploads photos/videos + optional audio
2. Multer receives multipart form data
3. Backend fetches child profile + measurement history
4. Gemini API receives: media + child context + WHO milestones
5. Gemini returns: structured JSON (scores, assessments, tips)
6. Backend validates & saves Analysis document
7. Timeline entry auto-created
8. Resources regenerated based on flagged domains
9. Frontend renders results with domain score charts
```

### 11.2 Story Generation Flow

```
1. Parent selects story theme
2. Backend loads child profile (age, interests, favorites)
3. Optional: child profile photo fetched from MinIO
4. Gemini generates story structure (title, pages, moral)
5. For each page: Gemini generates illustration
6. Illustrations uploaded to MinIO
7. Story document saved with page content + image URLs
8. Frontend displays story with pagination
```

---

## 12. Testing Infrastructure

| Type | Tool | Coverage Area |
|---|---|---|
| Unit Tests | Vitest/Jest | Service functions, utilities |
| API Tests | Supertest | Route handlers, middleware |
| E2E Tests | Playwright | Full user flows |
| API Mocking | MSW (Mock Service Worker) | Frontend tests |
| DB Testing | Test containers | MongoDB integration tests |

---

## 13. Configuration Management

### 13.1 Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `PORT` | Backend | API server port (3001) |
| `MONGODB_URI` | Backend | Database connection string |
| `JWT_SECRET` | Backend | Token signing key |
| `GEMINI_API_KEY` | Backend | Google AI API key |
| `MINIO_*` | Backend | Object storage credentials |
| `VITE_API_URL` | Frontend | Backend API base URL |

### 13.2 App Configuration (`appConfig.js`)

Centralized constants for:
- Domain colors, labels, icons (Motor, Language, Cognitive, Social)
- Status definitions with severity levels (5 statuses)
- Score thresholds (excellent >80, moderate 50-80, concern <50)
- Percentile interpretation ranges
- Supported languages (11 languages)
- Recipe categories and regional cuisine mapping
- Time filter options (1W, 1M, 3M, 6M, ALL)

---

## 14. Scalability Considerations

| Concern | Current Approach | Scaling Path |
|---|---|---|
| Database | Single MongoDB instance | Replica sets, sharding |
| File Storage | Single MinIO instance | MinIO cluster, CDN |
| AI Calls | Direct Gemini API | Queue-based processing, caching |
| Backend | Single Express instance | PM2 cluster, Kubernetes |
| Frontend | Static assets via Nginx | CDN distribution |
| Rate Limiting | In-memory store | Redis-backed store |

---

*End of Technical Document*

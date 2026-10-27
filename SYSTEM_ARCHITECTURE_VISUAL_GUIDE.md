# System Architecture: Data Flow & Storage Overview

> Visual reference guide showing how data flows through the Little Leap system, with MongoDB and MinIO integration.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Little Leap Platform                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Client Applications                             │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │   Web App        │  │   Mobile App     │  │  Desktop App     │   │   │
│  │  │  React/Vite      │  │   Flutter        │  │  React/Electron  │   │   │
│  │  │ :3005 (Docker)   │  │   :3000 (dev)    │  │  :5173 (Docker)   │   │   │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │   │
│  └───────────┼─────────────────────┼────────────────────┼──────────────┘   │
│              │                     │                    │                  │
│              └──────────┬──────────┴────────────────────┘                  │
│                         │                                                  │
│              ┌──────────▼───────────────────┐                             │
│              │   Express.js Backend API     │                             │
│              │   Node.js / TypeScript       │                             │
│              │   :3001 (Docker)             │                             │
│              │                              │                             │
│              │  ┌────────────────────────┐  │                             │
│              │  │   Route Handlers       │  │                             │
│              │  │  - /auth (login)       │  │                             │
│              │  │  - /children           │  │                             │
│              │  │  - /analysis           │  │                             │
│              │  │  - /upload             │  │                             │
│              │  │  - /stories            │  │                             │
│              │  │  - /config             │  │                             │
│              │  └────────────┬───────────┘  │                             │
│              │               │              │                             │
│              │  ┌────────────▼───────────┐  │                             │
│              │  │   Business Logic       │  │                             │
│              │  │  - AuthService         │  │                             │
│              │  │  - StorageService      │  │                             │
│              │  │  - GeminiService       │  │                             │
│              │  │  - AnalysisService     │  │                             │
│              │  │  - WhoService          │  │                             │
│              │  └────────────┬───────────┘  │                             │
│              │               │              │                             │
│              │  ┌────────────▼───────────┐  │                             │
│              │  │  Data Access Layer     │  │                             │
│              │  │  (Mongoose Models)     │  │                             │
│              │  └────────────┬───────────┘  │                             │
│              └──────────────┼───────────────┘                             │
│                             │                                             │
│         ┌───────────────────┴────────────────────┐                       │
│         │                                        │                       │
│         ▼                                        ▼                       │
│  ┌─────────────────────────────┐       ┌──────────────────────────────┐  │
│  │  MongoDB                     │       │  MinIO (Object Storage)      │  │
│  │  :27017 (Docker)             │       │  :9000 (API) :9001 (Console)│  │
│  │                              │       │                              │  │
│  │  Collections:                │       │  Buckets:                    │  │
│  │  - users                     │       │  - profile-photos            │  │
│  │  - children                  │       │  - story-illustrations       │  │
│  │  - analyses                  │       │  - report-pdfs               │  │
│  │  - milestones (500+)         │       │                              │  │
│  │  - recipes (1000+)           │       │  Access:                     │  │
│  │  - tips (1000+)              │       │  - Presigned URLs (temp)     │  │
│  │  - products (600+)           │       │  - Public read policy        │  │
│  │  - activities (600+)         │       │  - Private (auth required)   │  │
│  │  - doctors (101)             │       │                              │  │
│  │  - stories                   │       │  Format: S3-compatible       │  │
│  │  - timelineentries           │       │  (AWS SDK compatible)        │  │
│  │  - communitypost             │       │                              │  │
│  │  - migrations                │       │                              │  │
│  └─────────────────────────────┘       └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Registration & Child Profile

```
User (Web App) opens http://localhost:3005
        │
        ▼
┌──────────────────────────────────┐
│ Frontend shows signup form        │
│ - Email                           │
│ - Password                        │
│ - Name                            │
└──────────────────────────────────┘
        │
        ▼
User submits registration
        │
        ▼
┌──────────────────────────────────────────┐
│ POST /api/auth/register                  │
│ { email, password, name }                │
│                                          │
│ Backend Validation:                      │
│ - Email unique?                          │
│ - Password strong?                       │
│ - Name not empty?                        │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Hash password (bcrypt)                   │
│ Generate UUID for user                   │
│ Create User document                     │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Save to MongoDB                          │
│ db.users.insertOne({                     │
│   uuid: "user-123",                      │
│   email: "priya@tinysteps.dev",          │
│   passwordHash: "$2b$10$...",            │
│   name: "Priya Sharma",                  │
│   createdAt: ISODate                     │
│ })                                       │
└──────────────────────────────────────────┘
        │
        ▼
Generate JWT token (valid 7 days)
        │
        ▼
Response to frontend:
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  userId: "user-123",
  email: "priya@tinysteps.dev"
}
        │
        ▼
Frontend stores JWT in localStorage
        │
        ▼
User navigates to "Create Child"
        │
        ▼
┌──────────────────────────────────────────┐
│ Frontend shows child creation form       │
│ - Name                                   │
│ - Date of Birth                          │
│ - Gender                                 │
│ - Height/Weight (optional)               │
│ - Photo (optional)                       │
└──────────────────────────────────────────┘
        │
        ▼
User submits (with JWT in Authorization header)
        │
        ▼
┌──────────────────────────────────────────────┐
│ POST /api/children                           │
│ Headers: Authorization: Bearer <JWT>         │
│ Body: { name, dateOfBirth, gender, ... }    │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│ Backend verifies JWT token                   │
│ Extracts userId from token                   │
│ Validates child data                         │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│ If photo uploaded:                           │
│ - Validate file (size, type)                 │
│ - Generate unique filename                   │
│ - Upload to MinIO: profile-photos bucket     │
│ - Get public URL                             │
│ - Store URL in child metadata                │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│ Create Child document:                       │
│ db.children.insertOne({                      │
│   uuid: "child-456",                         │
│   parentId: "user-123",                      │
│   name: "Aarav",                             │
│   dateOfBirth: ISODate("2026-01-15"),       │
│   gender: "male",                            │
│   region: "searo",                           │
│   measurements: [],                          │
│   achievedMilestones: [],                    │
│   metadata: {                                │
│     photoUrl: "http://localhost:9000/...",   │
│     allergies: []                            │
│   },                                         │
│   createdAt: ISODate                         │
│ })                                           │
└──────────────────────────────────────────────┘
        │
        ▼
Response to frontend: { childId, name, dateOfBirth, ... }
        │
        ▼
Frontend navigates to child dashboard
```

---

## Data Flow: Development Analysis

```
User (Frontend) opens "Analysis" screen
        │
        ▼
Frontend fetches age-appropriate milestones
        │
        ▼
GET /api/analysis/milestones/14?domain=motor
        │
        ▼
┌──────────────────────────────────────────────┐
│ Backend calculates child age (from DOB)      │
│ Query MongoDB:                               │
│ db.milestones.find({                         │
│   ageRangeStartMonths: { $lte: 14 },         │
│   ageRangeEndMonths: { $gte: 14 },           │
│   domain: "motor"                            │
│ })                                           │
└──────────────────────────────────────────────┘
        │
        ▼
Returns ~50 motor milestones for 14-month age
        │
        ▼
User selects milestones child has achieved
        │
        ▼
Frontend shows analysis form:
- Observations
- Focus area
- Additional notes
        │
        ▼
User submits analysis
        │
        ▼
┌──────────────────────────────────────────────┐
│ POST /api/analysis/save                      │
│ {                                            │
│   childId,                                   │
│   selectedMilestones: ["milestone-uuid1"],   │
│   observations: "Very active",               │
│   domain: "motor",                           │
│   focusArea: "gross-motor"                   │
│ }                                            │
└──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Backend processes analysis                       │
│ - Calculate scores (0-100) for each domain      │
│ - Call Gemini AI to generate insights           │
│ - Gemini analyzes milestones + observations     │
│ - Get recommendations                           │
└──────────────────────────────────────────────────┘
        │
        ▼
Gemini API call (external)
        │
        ▼
Gemini returns:
{
  summary: "Good motor development...",
  recommendations: ["Continue tummy time..."],
  scores: { motor: 78, language: 65, ... }
}
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Store Analysis in MongoDB:                       │
│ db.analyses.insertOne({                          │
│   uuid: "analysis-789",                          │
│   childId: "child-456",                          │
│   date: ISODate,                                 │
│   domain: "motor",                               │
│   scores: { motor: 78, language: 65, ... },      │
│   summary: "Good motor development...",          │
│   recommendations: [...],                        │
│   achievedMilestones: ["milestone-uuid1", ...],  │
│   geminiAnalysis: { /* full response */ },       │
│   createdAt: ISODate                             │
│ })                                               │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Update Child with achieved milestones:           │
│ db.children.updateOne(                           │
│   { uuid: "child-456" },                         │
│   {                                              │
│     $push: {                                      │
│       achievedMilestones: {                       │
│         milestoneId: "milestone-uuid1",          │
│         achievedDate: ISODate,                    │
│         notes: "Observed at daycare"             │
│       }                                           │
│     }                                             │
│   }                                               │
│ )                                                 │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Create Timeline Entry (activity log):            │
│ db.timelineentries.insertOne({                   │
│   childId: "child-456",                          │
│   type: "analysis",                              │
│   analysisId: "analysis-789",                    │
│   date: ISODate,                                 │
│   summary: "Motor development analysis",         │
│   createdAt: ISODate                             │
│ })                                               │
└──────────────────────────────────────────────────┘
        │
        ▼
Response to frontend: 
{
  analysisId: "analysis-789",
  summary: "Good motor development...",
  recommendations: [...],
  scores: {...}
}
        │
        ▼
Frontend displays results
```

---

## Data Flow: File Upload (Photo)

```
User selects photo from device in app
        │
        ▼
Frontend reads file (image/jpeg, < 5MB)
        │
        ▼
┌──────────────────────────────────────┐
│ POST /api/upload                     │
│ Content-Type: multipart/form-data    │
│ - file: <binary image data>          │
│ - childId: "child-456"               │
│ Headers: Authorization: Bearer JWT   │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Backend multer middleware:               │
│ - Validate file size (< 5MB)             │
│ - Validate file type (image/*)           │
│ - Store in memory buffer                 │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ Generate unique filename:                │
│ fileName = uuid() + ".jpg"               │
│ e.g., "a1b2c3d4.jpg"                     │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Upload to MinIO:                                 │
│ storageService.uploadFile(                       │
│   "profile-photos",        // bucket              │
│   "a1b2c3d4.jpg",          // filename            │
│   buffer,                  // file data           │
│   { "Content-Type": "image/jpeg" }               │
│ )                                                 │
│                                                  │
│ MinIO stores in:                                 │
│ /profile-photos/a1b2c3d4.jpg                     │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ MinIO creates public URL:                        │
│ http://localhost:9000/profile-photos/a1b2c3d4.jpg
│                                                  │
│ (or presigned URL for private access:)          │
│ http://localhost:9000/profile-photos/...?<sig>  │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Update Child in MongoDB:                         │
│ db.children.updateOne(                           │
│   { uuid: "child-456" },                         │
│   {                                              │
│     $set: {                                       │
│       "metadata.photoUrl":                        │
│       "http://localhost:9000/profile-photos/..." │
│     }                                             │
│   }                                               │
│ )                                                 │
└──────────────────────────────────────────────────┘
        │
        ▼
Response to frontend:
{
  photoUrl: "http://localhost:9000/profile-photos/a1b2c3d4.jpg",
  fileName: "a1b2c3d4.jpg"
}
        │
        ▼
Frontend displays image on child profile
```

---

## Data Flow: Story Generation

```
User navigates to "Bedtime Stories"
        │
        ▼
Frontend fetches available stories
        │
        ▼
GET /api/stories?childId=child-456
        │
        ▼
Query MongoDB:
db.stories.find({ childId: "child-456" })
        │
        ▼
Display stories from history
        │
        ▼
User clicks "Generate New Story"
        │
        ▼
┌──────────────────────────────────────┐
│ Frontend shows options:               │
│ - Theme (adventure, fairy tale, etc.) │
│ - Duration (short, medium, long)      │
└──────────────────────────────────────┘
        │
        ▼
User selects options
        │
        ▼
┌──────────────────────────────────────────────────┐
│ POST /api/stories/generate                       │
│ {                                                │
│   childId: "child-456",                          │
│   theme: "adventure",                            │
│   childName: "Aarav",                            │
│   childAge: "14 months"                          │
│ }                                                │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Backend calls Gemini AI:                         │
│ "Generate a bedtime story for 14-month-old       │
│  Aarav with adventure theme. Age-appropriate."   │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Gemini generates story (~500 words)              │
│ Potential to also generate illustration (future) │
└──────────────────────────────────────────────────┘
        │
        ▼
Optional: Generate story illustration with Gemini
        │
        ▼
If image generated:
  Upload to MinIO → story-illustrations bucket
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Save Story to MongoDB:                           │
│ db.stories.insertOne({                           │
│   uuid: "story-101",                             │
│   childId: "child-456",                          │
│   childName: "Aarav",                            │
│   title: "Aarav's Grand Adventure",              │
│   content: "Once upon a time...",                │
│   theme: "adventure",                            │
│   imageUrl: (if generated)                       │
│   ageAppropriate: true,                          │
│   createdAt: ISODate                             │
│ })                                               │
└──────────────────────────────────────────────────┘
        │
        ▼
Response to frontend:
{
  storyId: "story-101",
  title: "Aarav's Grand Adventure",
  content: "Once upon a time...",
  imageUrl: "http://localhost:9000/story-illustrations/..."
}
        │
        ▼
Frontend displays story (text + optional image)
```

---

## Data Flow: Timeline Activity Log

```
Every significant user action creates a TimelineEntry:
        │
        ├─ Analysis created → Add to timeline
        │  Type: "analysis"
        │  Data: { analysisId, domain, score }
        │
        ├─ Measurement recorded → Add to timeline
        │  Type: "measurement"
        │  Data: { height, weight, date }
        │
        ├─ Milestone achieved → Add to timeline
        │  Type: "milestone"
        │  Data: { milestoneId, title }
        │
        ├─ Photo uploaded → Add to timeline
        │  Type: "photo"
        │  Data: { photoUrl, caption }
        │
        ├─ Note recorded → Add to timeline
        │  Type: "note"
        │  Data: { text, category }
        │
        └─ Story generated → Add to timeline
           Type: "story"
           Data: { storyId, title }
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Create TimelineEntry in MongoDB:                 │
│ db.timelineentries.insertOne({                   │
│   uuid: "timeline-xxx",                          │
│   childId: "child-456",                          │
│   type: "analysis",      // enum                 │
│   data: {                                        │
│     analysisId: "analysis-789",                  │
│     domain: "motor",                             │
│     score: 78                                    │
│   },                                             │
│   date: ISODate,                                 │
│   createdAt: ISODate                             │
│ })                                               │
└──────────────────────────────────────────────────┘
        │
        ▼
Timeline visible in frontend:
- Sorted by date (newest first)
- Shows all activities with icons
- Tap to see details
```

---

## Database Collections Relationships

```
users (1) ─┐
           │
           ├─ (1:many) ─→ children (1) ─┐
                                       │
                                       ├─ (1:many) ─→ analyses
                                       │
                                       ├─ (1:many) ─→ timelineentries
                                       │
                                       └─ (1:many) ─→ stories

milestones ◄─── (many:many) ─── children.achievedMilestones

recipes (available globally, filtered by age)

tips (available globally, filtered by age)

doctors (available globally, searchable)

communitypost ◄─ (1:many) ─ users
             ─ (1:many) → comments


MinIO Files Relationship:

users ─→ profile-photos
         (one photo per child, stored in MinIO)

stories ─→ story-illustrations
           (optional AI-generated images)

analyses ─→ report-pdfs
            (generated when analysis complete)
```

---

## Startup Sequence: What Happens When Backend Starts

```
1. Load environment variables (.env)
   ├─ MONGODB_URI
   ├─ MINIO_ENDPOINT, MINIO_ACCESS_KEY, etc.
   ├─ JWT_SECRET
   └─ GEMINI_API_KEY

2. Connect to MongoDB
   └─ Verify ping: db.adminCommand('ping')

3. Initialize MinIO Client
   └─ Verify connection to :9000

4. Create buckets if not exist
   ├─ profile-photos
   ├─ story-illustrations
   └─ report-pdfs

5. Run migrations (auto-seeding)
   ├─ 001-seed-doctors.js (101 doctors)
   ├─ 002-seed-milestones.js (107 core milestones)
   ├─ 003-migrate-milestone-ids.js
   ├─ 004-seed-expanded-milestones.js
   ├─ 005-seed-recipes.js (1000+)
   ├─ 006-seed-tips.js (1000+)
   ├─ 007-seed-products.js (600+)
   ├─ 008-seed-activities.js (600+)
   └─ 009-enrich-descriptions.js
   
   Each migration:
   - Check if already applied (from db.migrations)
   - Run if not applied
   - Record in db.migrations

6. Initialize services
   ├─ AuthService
   ├─ StorageService
   ├─ GeminiService
   └─ WhoService

7. Start Express server on :3001
   └─ Ready to accept API requests
```

---

## Configuration Environment Variables

```
┌─────────────────────────────────────────────────────────┐
│ MongoDB Configuration                                   │
├─────────────────────────────────────────────────────────┤
│ MONGODB_URI=mongodb://mongo:27017/tinysteps             │
│ (Docker: mongo internal hostname)                       │
│ (Local: localhost:27017)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ MinIO Configuration                                     │
├─────────────────────────────────────────────────────────┤
│ MINIO_ENDPOINT=minio          (Docker internal)         │
│ MINIO_PORT=9000                                         │
│ MINIO_ACCESS_KEY=minioadmin                             │
│ MINIO_SECRET_KEY=minioadmin                             │
│ MINIO_USE_SSL=false                                     │
│ MINIO_PUBLIC_URL=http://localhost:9000                  │
│ (Browser-accessible URL for file sharing)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Authentication                                          │
├─────────────────────────────────────────────────────────┤
│ JWT_SECRET=your-secret-key-here                         │
│ JWT_EXPIRY=7d                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ External APIs                                           │
├─────────────────────────────────────────────────────────┤
│ GEMINI_API_KEY=your-key-from-aistudio.google.com       │
│ SARVAM_API_KEY=your-key-optional                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ CORS & Frontend URLs                                    │
├─────────────────────────────────────────────────────────┤
│ WEB_APP_URL=http://localhost:3005                       │
│ MOBILE_APP_URL=http://localhost:8080                    │
└─────────────────────────────────────────────────────────┘
```

---

## Ports & Services Map

```
Service                Port(s)        Protocol       Purpose
─────────────────────────────────────────────────────────
Frontend Web           3005           HTTP           React web app
Frontend Desktop       5173           HTTP           React desktop (Electron)
Frontend Mobile        3000 (dev)     HTTP           Flutter dev server
Backend API            3001           HTTP/REST      Express server
MongoDB                27017          BSON/TCP       Database
MinIO API              9000           HTTP/S3        Object storage
MinIO Console          9001           HTTP           MinIO web UI
Nginx (Web)            80/443         HTTP/HTTPS     Reverse proxy (prod)
```

---

## Summary: Data Storage Decision Matrix

| Type of Data | Storage | Why | Accessed By |
|-------------|---------|-----|-------------|
| Users, Passwords | MongoDB | Relational, transactional | Backend only |
| Children, Profiles | MongoDB | Structured, queried frequently | Backend → Frontend |
| Analyses, Scores | MongoDB | Historical, time-series | Backend → Frontend |
| Milestones | MongoDB | Static data, seeded once | Backend → Frontend |
| Recipes, Tips | MongoDB | Static, searchable | Backend → Frontend |
| Photos | MinIO | Large binary, CDN-friendly | Backend ↔ MinIO ↔ Browser |
| Generated Images | MinIO | Large binary, AI-generated | Backend → MinIO → Frontend |
| PDF Reports | MinIO | Large binary, downloadable | Backend → MinIO → Browser |
| Temporary URLs | Cache/URL | Session-based, presigned | Browser direct access |

---

## File Structure: Where Code Lives

```
backend/
├── src/
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Child.js
│   │   ├── Analysis.js
│   │   ├── Milestone.js
│   │   ├── Recipe.js
│   │   └── ... (more models)
│   │
│   ├── routes/                    # API endpoints
│   │   ├── auth.js                # /api/auth/*
│   │   ├── children.js            # /api/children/*
│   │   ├── analysis.js            # /api/analysis/*
│   │   ├── stories.js             # /api/stories/*
│   │   └── ... (more routes)
│   │
│   ├── services/                  # Business logic
│   │   ├── storageService.js      # MinIO operations
│   │   ├── migrationRunner.js     # Auto-run migrations
│   │   ├── GeminiService.js       # AI integration
│   │   ├── AuthService.js         # Auth logic
│   │   └── WhoService.js          # WHO data
│   │
│   ├── migrations/                # Auto-seed scripts
│   │   ├── 001-seed-doctors.js
│   │   ├── 002-seed-milestones.js
│   │   └── ... (more migrations)
│   │
│   ├── seeds/                     # Manual seed scripts
│   │   └── seedRealisticData.js   # Create demo data
│   │
│   └── index.js                   # Entry point
│
├── .env                           # Configuration
├── .env.example                   # Config template
├── package.json                   # npm scripts
└── Dockerfile                     # Docker image
```

---

This architecture ensures:
- ✅ **Scalability**: MongoDB for structured data, MinIO for files
- ✅ **Performance**: Indexing, caching, async file operations
- ✅ **Security**: JWT auth, presigned URLs, no direct file access
- ✅ **Maintainability**: Clear separation of concerns, migrations for schema changes
- ✅ **Flexibility**: Easy to add new data types or storage backends


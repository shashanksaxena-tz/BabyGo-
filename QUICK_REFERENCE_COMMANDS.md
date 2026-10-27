# Quick Reference: MongoDB & MinIO Commands

> Fast lookup guide for common operations. For detailed documentation, see `GETTING_STARTED_WITH_MONGODB_MINIO.md` and `MONGODB_MINIO_DEVELOPER_GUIDE.md`

## Docker & Services

```bash
# Start everything
docker-compose up -d --build

# Stop everything
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f mongo
docker-compose logs -f minio

# Check status
docker-compose ps

# Enter container shell
docker-compose exec backend bash
docker-compose exec mongo bash
```

---

## MongoDB - Quick Commands

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/tinysteps"

# Inside mongosh:
show databases                          # List databases
use tinysteps                          # Switch database
show collections                       # List collections

# Basic queries
db.users.find().pretty()               # All users
db.users.findOne({ email: "..." })    # Find by email
db.children.find({ parentId: "..." }) # Children of parent
db.milestones.countDocuments()         # Count collection

# Insert
db.users.insertOne({ email: "...", name: "..." })

# Update
db.users.updateOne(
  { email: "..." },
  { $set: { name: "New Name" } }
)

# Delete
db.users.deleteOne({ email: "..." })

# Export collection
mongoexport --uri="mongodb://localhost:27017/tinysteps" \
  --collection=children \
  --out=children.json

# Import data
mongoimport --uri="mongodb://localhost:27017/tinysteps" \
  --collection=children \
  --file=children.json

# Backup
mongodump --uri="mongodb://localhost:27017/tinysteps" --out=./backup/

# Reset database (WARNING!)
db.dropDatabase()
```

---

## MongoDB - Collections Reference

| Collection | Count | Purpose |
|-----------|-------|---------|
| `users` | ? | Parent accounts |
| `children` | ? | Child profiles |
| `milestones` | 500+ | WHO developmental milestones |
| `recipes` | 1000+ | Age-appropriate recipes |
| `tips` | 1000+ | Parenting tips |
| `products` | 600+ | Baby care products |
| `activities` | 600+ | Age-based activities |
| `doctors` | 101 | Pediatrician directory |
| `analyses` | ? | Development analyses |
| `stories` | ? | Bedtime stories |
| `timelineentries` | ? | User activity log |
| `communitypost` | ? | Community posts |
| `migrations` | ~9 | Ran migrations tracking |

---

## MinIO - Quick Access

```bash
# Web Console
http://localhost:9001
Username: minioadmin
Password: minioadmin

# MinIO CLI setup
mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
mc ls local

# List files in bucket
mc ls local/profile-photos
mc ls local/story-illustrations
mc ls local/report-pdfs

# Upload file
mc cp image.jpg local/profile-photos/

# Download file
mc cp local/profile-photos/image.jpg ./

# Set public read policy
mc policy set download local/profile-photos
```

---

## Seeding Data

```bash
# Auto-migrations on backend startup
# Just start the backend, all migrations run automatically
docker-compose up -d backend

# Create demo data (10 families, analyses, stories)
cd backend
npm run seed:realistic

# Or manually:
cd backend
node src/seeds/seedRealisticData.js

# Check what migrations ran
mongosh "mongodb://localhost:27017/tinysteps"
> db.migrations.find().pretty()
```

---

## Login Credentials (Demo)

After running `npm run seed:realistic`:

```
priya@tinysteps.dev / Test1234!     → Child: Aarav (3mo)
meera@tinysteps.dev / Test1234!     → Child: Ananya (5mo)
vikram@tinysteps.dev / Test1234!    → Child: Arnav (48mo)
... (10 total families)
```

---

## Node.js / Backend Code Patterns

```javascript
// MongoDB - Find and Update
import Child from './models/Child.js';

const child = await Child.findById(childId);
const child = await Child.findOne({ uuid: childUuid });
const children = await Child.find({ parentId });

await Child.findByIdAndUpdate(childId, { name: 'New Name' }, { new: true });

// Add to array
await Child.findByIdAndUpdate(childId, {
  $push: { measurements: { height: 65, weight: 6.2 } }
});

// MinIO - File Upload
import storageService from './services/storageService.js';

const fileName = `${uuid}.jpg`;
const fileUrl = await storageService.uploadFile(
  'profile-photos',
  fileName,
  fileBuffer,
  { 'Content-Type': 'image/jpeg' }
);

// Presigned URL (temporary access)
const tempUrl = await storageService.client.presignedGetObject(
  'profile-photos',
  fileName,
  3600  // 1 hour
);

// Transactions
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Child.create([...], { session });
  await TimelineEntry.create([...], { session });
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
}
```

---

## API Endpoints (Backend)

```bash
# Health check
curl http://localhost:3001/health

# Auth
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","name":"Test"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# Children
curl -X GET http://localhost:3001/api/children \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Milestones (by age)
curl "http://localhost:3001/api/analysis/milestones/14"

# Analyses
curl -X GET http://localhost:3001/api/analysis/CHILD_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Config
curl http://localhost:3001/api/config
```

---

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://mongo:27017/tinysteps  # Docker
MONGODB_URI=mongodb://localhost:27017/tinysteps  # Local

# MinIO
MINIO_ENDPOINT=minio  # Docker: minio, Local: localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_PUBLIC_URL=http://localhost:9000

# API
JWT_SECRET=your-secret-key-change-in-production
PORT=3001

# External APIs
GEMINI_API_KEY=your-api-key-from-aistudio.google.com
```

---

## Troubleshooting Quick Fixes

```bash
# MongoDB won't connect
docker-compose restart mongo
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# MinIO console not accessible
# Try: http://localhost:9001
# Or check: docker-compose logs minio

# Seed script fails
# 1. Is backend running? curl http://localhost:3001/health
# 2. Is MongoDB accessible? Check logs: docker-compose logs mongo
# 3. Do migrations exist? db.migrations.find()

# Files not uploading
# 1. Check MinIO bucket exists: mc ls local
# 2. Check bucket policy: mc policy get local/profile-photos
# 3. Fix if needed: mc policy set download local/profile-photos

# Port conflicts
lsof -i :3001  # Check who's using port
kill -9 <PID>   # Kill the process
```

---

## Collections Schema Quick Look

```javascript
// User
{ uuid, email, passwordHash, name, verified, createdAt }

// Child
{ uuid, parentId, name, dateOfBirth, gender, region, 
  measurements: [{ date, height, weight }],
  achievedMilestones: [{ milestoneId, achievedDate }],
  metadata: { photoUrl, allergies, medicalHistory } }

// Milestone
{ uuid, title, description, domain, subDomain, 
  ageRangeStartMonths, ageRangeEndMonths, typicalMonths, isActive }

// Analysis
{ uuid, childId, date, domain, scores: {...}, summary, recommendations }

// Recipe
{ title, description, ingredients, ageRangeStart/End, difficulty, 
  cookingTimeMinutes, allergies, nutrition: {...} }

// Story
{ title, content, theme, childId, ageAppropriate, imageUrl, createdAt }

// TimelineEntry
{ childId, type, data, date, createdAt }  // type: analysis|measurement|note|photo
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot connect to MongoDB` | MongoDB not running | `docker-compose up -d mongo` |
| `MinIO: Connection refused` | MinIO not running | `docker-compose up -d minio` |
| `JWT expired` | Token too old | Login again to get new token |
| `File upload failed` | Bucket doesn't exist | Backend will create on startup |
| `Seed script timeout` | Gemini API slow | Wait longer or check API key |
| `Cast error on ObjectId` | Invalid MongoDB ID | Use UUID instead of _id |
| `Presigned URL 404` | File doesn't exist | Check file name in MinIO |

---

## File Locations

```
backend/
├── src/
│   ├── models/          # Mongoose schemas (User, Child, etc.)
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (storageService, migrationRunner)
│   ├── migrations/      # Auto-run seed scripts
│   ├── seeds/           # Manual seed scripts (seedRealisticData.js)
│   └── index.js         # Entry point
├── .env                 # Your configuration
└── package.json         # npm scripts (seed:realistic, dev, test)
```

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:3001 | None (public endpoints) |
| Web App | http://localhost:3005 | Register or demo accounts |
| Desktop App | http://localhost:5173 | Same as web app |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| MongoDB | localhost:27017 | No auth (default) |

---

## Next Steps

1. **Start services**: `docker-compose up -d`
2. **Create data**: `npm run seed:realistic`
3. **Browse data**:
   - Mongosh: `mongosh "mongodb://localhost:27017/tinysteps"`
   - MinIO: http://localhost:9001
4. **Login to apps**: Use demo accounts or register new user
5. **Check logs**: `docker-compose logs -f backend`

---

## Documentation Files

- **GETTING_STARTED_WITH_MONGODB_MINIO.md** - Complete setup & login guide
- **MONGODB_MINIO_DEVELOPER_GUIDE.md** - Detailed technical guide for developers
- **QUICK_REFERENCE_COMMANDS.md** - This file (quick lookup)


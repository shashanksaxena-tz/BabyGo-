# MongoDB & MinIO Developer Guide

> Technical guide for developers working with the Little Leap database and storage systems from code.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [MongoDB Integration](#mongodb-integration)
3. [MinIO Integration](#minio-integration)
4. [Data Models & Schemas](#data-models--schemas)
5. [Common Patterns](#common-patterns)
6. [Migration System](#migration-system)
7. [Seed Scripts](#seed-scripts)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Client Apps                         │
│              (Web, Mobile, Desktop)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Backend API                      │
│           (Node.js / JavaScript Layer)                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
        ┌──────────────────┐  ┌──────────────┐
        │   MongoDB        │  │   MinIO      │
        │  (Structured     │  │  (Binary     │
        │   Data)          │  │   Files)     │
        │                  │  │              │
        │ - Users          │  │ - Photos     │
        │ - Children       │  │ - Images     │
        │ - Analyses       │  │ - PDFs       │
        │ - Milestones     │  │              │
        │ - Recipes, Tips  │  │              │
        └──────────────────┘  └──────────────┘
```

### Connection Lifecycle

```javascript
// 1. Backend starts (index.js)
↓
// 2. Connect to MongoDB (via mongoose)
↓
// 3. Initialize MinIO client (storageService)
↓
// 4. Run migrations (auto-seeding)
↓
// 5. Ready to serve API requests
↓
// 6. On request: Query MongoDB + serve/store files in MinIO
```

---

## MongoDB Integration

### Connection Setup

**File**: `backend/src/index.js`

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connection happens once on startup
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tinysteps', {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 10000,
});

console.log('MongoDB connected successfully');
```

### Environment Variables

```env
# .env file
MONGODB_URI=mongodb://mongo:27017/tinysteps  # Docker
# OR
MONGODB_URI=mongodb://localhost:27017/tinysteps  # Local dev
```

### Collection-to-Model Mapping

| MongoDB Collection | Mongoose Model | File Location |
|-------------------|----------------|---------------|
| `users` | `User` | `src/models/User.js` |
| `children` | `Child` | `src/models/Child.js` |
| `analyses` | `Analysis` | `src/models/Analysis.js` |
| `milestones` | `Milestone` | `src/models/Milestone.js` |
| `recipes` | `Recipe` | `src/models/Recipe.js` |
| `tips` | `Tip` | `src/models/Tip.js` |
| `products` | `Product` | `src/models/Product.js` |
| `activities` | `AgeActivity` | `src/models/AgeActivity.js` |
| `doctors` | `Doctor` | `src/models/Doctor.js` |
| `stories` | `Story` | `src/models/Story.js` |
| `timelineentries` | `TimelineEntry` | `src/models/TimelineEntry.js` |
| `communitypost` | `CommunityPost` | `src/models/CommunityPost.js` |
| `migrations` | `Migration` | `src/models/Migration.js` |

### Working with Models

#### Define a Schema

**File**: `backend/src/models/Child.js`

```javascript
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const childSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: () => uuidv4(),
    index: true,
  },
  parentId: {
    type: String,
    required: true,
    index: true,  // For fast parent lookups
  },
  name: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },
  region: {
    type: String,
    enum: ['searo', 'wpro', 'emro'],
    default: 'searo',
  },
  
  // Nested data
  measurements: [{
    date: Date,
    height: Number,  // cm
    weight: Number,  // kg
    headCircumference: Number,  // cm
    recordedBy: String,  // parent name
  }],
  
  // Array of achievement records
  achievedMilestones: [{
    milestoneId: String,  // UUID reference to Milestone
    achievedDate: Date,
    notes: String,
  }],
  
  metadata: {
    photoUrl: String,  // MinIO URL
    allergies: [String],
    medicalHistory: String,
  },
  
  timestamps: true,  // Adds createdAt, updatedAt
});

const Child = mongoose.model('Child', childSchema);
export default Child;
```

#### CRUD Operations

```javascript
import Child from './models/Child.js';

// CREATE
const newChild = await Child.create({
  parentId: 'parent-uuid',
  name: 'Aarav',
  dateOfBirth: new Date('2026-01-15'),
  gender: 'male',
  region: 'searo',
});

// READ - by ID
const child = await Child.findById(childId);

// READ - by UUID
const child = await Child.findOne({ uuid: childUuid });

// READ - multiple (find all children for a parent)
const children = await Child.find({ parentId: parentId });

// UPDATE
await Child.findByIdAndUpdate(childId, {
  name: 'New Name',
  'measurements.0.height': 65,  // Update nested field
}, { new: true });  // Returns updated document

// DELETE
await Child.findByIdAndDelete(childId);

// BATCH OPERATIONS
// Bulk write for efficiency
const bulkOps = [
  { updateOne: { filter: { parentId: 'p1' }, update: { $set: { region: 'wpro' } } } },
  { updateOne: { filter: { parentId: 'p2' }, update: { $set: { region: 'emro' } } } },
];
await Child.bulkWrite(bulkOps);
```

#### Advanced Queries

```javascript
// Aggregate - get child age statistics by gender
const stats = await Child.aggregate([
  {
    $group: {
      _id: '$gender',
      count: { $sum: 1 },
      avgAgeMonths: {
        $avg: {
          $divide: [
            { $subtract: [new Date(), '$dateOfBirth'] },
            2592000000,  // 30 days in milliseconds
          ]
        }
      },
    }
  },
  { $sort: { count: -1 } },
]);

// Find children with measurements in last 30 days
const recentMeasurements = await Child.find({
  'measurements.date': {
    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
});

// Find milestone achievements by date range
const achievementsByRange = await Child.find({
  'achievedMilestones.achievedDate': {
    $gte: startDate,
    $lte: endDate,
  }
});
```

### Transactions (Multi-Document ACID)

For operations that must succeed/fail together:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Operation 1: Create child
  const child = await Child.create([{ /* data */ }], { session });
  
  // Operation 2: Record timeline entry
  await TimelineEntry.create([{
    childId: child[0].uuid,
    type: 'created',
  }], { session });
  
  // Both succeed or both rollback
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

### Indexing for Performance

```javascript
// Indexes created in schema definition:
childSchema.index({ parentId: 1 });  // Single field
childSchema.index({ uuid: 1 }, { unique: true });  // Unique
childSchema.index({ dateOfBirth: 1, gender: 1 });  // Compound

// Check indexes
db.children.getIndexes()

// Remove index if needed
db.children.dropIndex('dateOfBirth_1_gender_1')
```

---

## MinIO Integration

### Connection Setup

**File**: `backend/src/services/storageService.js`

```javascript
import { Client as MinioClient } from 'minio';

class StorageService {
  async initialize() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    this.client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    // Set public base URL for browser access
    const protocol = useSSL ? 'https' : 'http';
    this.publicBaseUrl = process.env.MINIO_PUBLIC_URL
      || `${protocol}://${endpoint}:${port}`;

    // Create buckets if they don't exist
    const buckets = ['profile-photos', 'story-illustrations', 'report-pdfs'];
    for (const bucket of buckets) {
      await this._ensureBucket(bucket);
    }

    this.initialized = true;
  }
}
```

### Bucket Names (Constants)

```javascript
export const BUCKETS = {
  PROFILES: 'profile-photos',      // Child profile pictures
  STORIES: 'story-illustrations',  // AI-generated story images
  REPORTS: 'report-pdfs',          // Generated development reports
};
```

### File Operations

#### Upload File

```javascript
import storageService from './storageService.js';
import { v4 as uuidv4 } from 'uuid';

// File object from multer middleware
const file = req.file;  // { buffer, mimetype, originalname }

// Generate unique name
const fileName = `${uuidv4()}.${file.originalname.split('.').pop()}`;

// Upload to MinIO
await storageService.uploadFile(BUCKETS.PROFILES, fileName, file.buffer, {
  'Content-Type': file.mimetype,
});

// Get public URL
const fileUrl = `${storageService.publicBaseUrl}/${BUCKETS.PROFILES}/${fileName}`;

// Save URL reference in MongoDB
await Child.findByIdAndUpdate(childId, {
  'metadata.photoUrl': fileUrl,
});
```

#### Download File

```javascript
// Get file from MinIO
const fileStream = await storageService.client.getObject(
  BUCKETS.PROFILES,
  fileName
);

// Send to client
res.setHeader('Content-Type', 'image/jpeg');
fileStream.pipe(res);
```

#### Generate Presigned URL (Temporary Public Access)

```javascript
// Create URL valid for 1 hour
const presignedUrl = await storageService.client.presignedGetObject(
  BUCKETS.PROFILES,
  fileName,
  3600  // 1 hour in seconds
);

// Share this URL with frontend or third parties
// No credentials needed to access
console.log('Share URL:', presignedUrl);
```

#### Delete File

```javascript
await storageService.client.removeObject(BUCKETS.PROFILES, fileName);

// Update MongoDB reference
await Child.findByIdAndUpdate(childId, {
  'metadata.photoUrl': null,
});
```

### StorageService Methods

```javascript
// Upload from buffer
uploadFile(bucket, fileName, buffer, metadata = {})

// Upload from file path
uploadFileFromPath(bucket, fileName, filePath, metadata = {})

// Download to buffer
downloadFile(bucket, fileName)

// Get presigned URL for temporary access
getPresignedUrl(bucket, fileName, expirySeconds = 3600)

// Delete file
deleteFile(bucket, fileName)

// List files in bucket
listFiles(bucket, prefix = '')

// Check if file exists
fileExists(bucket, fileName)

// Get file metadata
getFileMetadata(bucket, fileName)
```

### Middleware for File Upload

```javascript
import multer from 'multer';

// Store in memory (small files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

// Usage in route
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  const file = req.file;
  // ... upload to MinIO
});
```

---

## Data Models & Schemas

### User Model

```javascript
// MongoDB Collection: users
{
  _id: ObjectId,
  uuid: "user-uuid",
  email: "priya@tinysteps.dev",
  passwordHash: "bcrypt-hash",
  name: "Priya Sharma",
  verified: true,
  createdAt: ISODate,
  updatedAt: ISODate,
}
```

### Child Model

```javascript
// MongoDB Collection: children
{
  _id: ObjectId,
  uuid: "child-uuid",
  parentId: "parent-uuid",
  name: "Aarav",
  dateOfBirth: ISODate("2026-01-15"),
  gender: "male",
  region: "searo",  // WHO region
  
  measurements: [
    {
      date: ISODate,
      height: 60,  // cm
      weight: 5.8,  // kg
      headCircumference: 42,  // cm
    }
  ],
  
  achievedMilestones: [
    {
      milestoneId: "milestone-uuid",
      achievedDate: ISODate,
      notes: "Observed at home",
    }
  ],
  
  watchedMilestones: [
    { milestoneId: "milestone-uuid" }
  ],
  
  metadata: {
    photoUrl: "http://localhost:9000/profile-photos/uuid.jpg",
    allergies: ["peanuts", "dairy"],
    medicalHistory: "Born via C-section",
  },
  
  createdAt: ISODate,
  updatedAt: ISODate,
}
```

### Milestone Model

```javascript
// MongoDB Collection: milestones
{
  _id: ObjectId,
  uuid: "milestone-uuid",
  title: "Smiles",
  description: "Baby smiles responsively at people",
  domain: "social",  // motor|language|cognitive|social
  subDomain: "smile",
  ageRangeStartMonths: 1,
  ageRangeEndMonths: 4,
  typicalMonths: 2,  // Usually achieved by this age
  source: "WHO",
  tags: ["social-smile", "expression"],
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate,
}
```

### Recipe Model

```javascript
// MongoDB Collection: recipes
{
  _id: ObjectId,
  title: "Sweet Potato Puree",
  description: "Simple first food for babies 6+ months",
  ingredients: [
    { name: "sweet potato", quantity: "1", unit: "medium" }
  ],
  instructions: [
    "Peel and chop sweet potato",
    "Boil until soft",
    "Blend to puree"
  ],
  ageRangeStartMonths: 6,
  ageRangeEndMonths: 12,
  cookingTimeMinutes: 20,
  difficulty: "easy",
  allergies: [],  // Safe for these allergies
  category: "vegetables",
  nutrition: {
    calories: 40,
    protein: 0.9,
    carbs: 9,
    fat: 0.1,
  },
  isSeeded: true,
  isActive: true,
  createdAt: ISODate,
}
```

### Analysis Model

```javascript
// MongoDB Collection: analyses
{
  _id: ObjectId,
  uuid: "analysis-uuid",
  childId: "child-uuid",
  date: ISODate,
  domain: "motor",  // motor|language|cognitive|social
  scores: {
    motor: 75,
    language: 65,
    cognitive: 80,
    social: 72,
  },
  summary: "Good motor development for age",
  recommendations: [
    "Continue tummy time for 15 minutes daily",
    "Practice grasping toys"
  ],
  geminiAnalysis: { /* full Gemini response */ },
  createdAt: ISODate,
}
```

---

## Common Patterns

### Pattern 1: Fetch with Authorization

```javascript
// Check that requesting user owns the data
async function getChild(childUuid, requestingUserId) {
  const child = await Child.findOne({ uuid: childUuid });
  
  if (!child) {
    throw new Error('Child not found');
  }
  
  // Verify ownership
  if (child.parentId !== requestingUserId) {
    throw new Error('Unauthorized - not your child');
  }
  
  return child;
}
```

### Pattern 2: Create Nested Data

```javascript
// Add measurement to child
async function addMeasurement(childId, measurement) {
  return await Child.findByIdAndUpdate(
    childId,
    {
      $push: {
        measurements: {
          date: new Date(),
          height: measurement.height,
          weight: measurement.weight,
        },
      },
    },
    { new: true }
  );
}

// Usage
const updatedChild = await addMeasurement(childId, {
  height: 65,
  weight: 6.2,
});
```

### Pattern 3: Pagination

```javascript
async function getChildren(parentId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const children = await Child.find({ parentId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const total = await Child.countDocuments({ parentId });
  
  return {
    data: children,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
```

### Pattern 4: Search & Filter

```javascript
async function searchMilestones(filters = {}) {
  const query = {};
  
  if (filters.domain) {
    query.domain = filters.domain;
  }
  
  if (filters.ageMonths) {
    query.ageRangeStartMonths = { $lte: filters.ageMonths };
    query.ageRangeEndMonths = { $gte: filters.ageMonths };
  }
  
  if (filters.searchText) {
    query.$text = { $search: filters.searchText };
  }
  
  return await Milestone.find(query)
    .select('uuid title domain ageRangeStartMonths');
}
```

### Pattern 5: Upload & Store with Metadata

```javascript
async function uploadChildPhoto(childId, fileBuffer, mimeType) {
  // Upload to MinIO
  const fileName = `${childId}-${Date.now()}.jpg`;
  const fileUrl = await storageService.uploadFile(
    BUCKETS.PROFILES,
    fileName,
    fileBuffer,
    { 'Content-Type': mimeType }
  );
  
  // Update MongoDB with reference
  const child = await Child.findByIdAndUpdate(
    childId,
    { 'metadata.photoUrl': fileUrl },
    { new: true }
  );
  
  return child;
}
```

---

## Migration System

### Auto-Run Migrations on Startup

When backend starts, `runMigrations()` is called automatically:

```javascript
// backend/src/index.js
import { runMigrations } from './services/migrationRunner.js';

// On startup
try {
  await runMigrations();
  console.log('Migrations completed');
} catch (error) {
  console.error('Migration failed:', error);
  // Backend continues (non-blocking)
}
```

### Create a New Migration

**File**: `backend/src/migrations/010-my-migration.js`

```javascript
import MyModel from '../models/MyModel.js';

export async function up() {
  // Check idempotency - has this migration run before?
  const count = await MyModel.countDocuments();
  if (count > 0) {
    console.log('Migration already applied, skipping');
    return;
  }
  
  // Do work (seed data, schema changes, etc.)
  const docs = await MyModel.insertMany([
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 },
  ]);
  
  console.log(`Seeded ${docs.length} items`);
}
```

### Migration Tracking

```javascript
// Migrations are tracked in MongoDB
db.migrations.find().pretty()

// Output:
// { _id: ..., name: '001-seed-doctors', createdAt: ISODate }
// { _id: ..., name: '002-seed-milestones', createdAt: ISODate }
```

---

## Seed Scripts

### Realistic Seed Script

**File**: `backend/src/seeds/seedRealisticData.js`

Creates 10 sample families with:
- User accounts
- Children
- Milestones achievements
- Growth measurements
- Analyses
- Community posts
- Timeline entries
- Stories

**Run**:
```bash
cd backend
npm run seed:realistic
# or
node src/seeds/seedRealisticData.js
```

**Structure**:
```javascript
async function seed() {
  // 1. Register 10 families
  for (const family of FAMILIES) {
    // POST /api/auth/register
    // Create child profile
  }
  
  // 2. Seed age-appropriate milestones
  // Mark milestones as achieved for each child
  
  // 3. Seed growth measurements
  // Add historical height/weight data
  
  // 4. Seed analyses
  // Create development analyses with Gemini
  
  // 5. Seed community
  // Create posts and comments
  
  // 6. Seed timeline
  // Add notes and photo entries
  
  // 7. Seed stories
  // Direct DB insertion (Gemini would be slow)
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

---

## Best Practices

### 1. Always Use UUIDs for Public IDs

```javascript
// ✅ DO: Use UUID for external IDs
const child = await Child.create({
  uuid: uuidv4(),
  parentId: parentUuid,  // Also UUID
  name: 'Aarav',
});

// API response uses uuid
res.json({ childId: child.uuid });

// ❌ DON'T: Expose MongoDB _id
res.json({ id: child._id });  // Leaks implementation detail
```

### 2. Index Frequently Queried Fields

```javascript
// Common queries that need indexes:
// 1. Find children by parentId
childSchema.index({ parentId: 1 });

// 2. Find user by email
userSchema.index({ email: 1 }, { unique: true });

// 3. Search milestones by age range
milestoneSchema.index({ ageRangeStartMonths: 1, ageRangeEndMonths: 1 });
```

### 3. Validate Before Saving

```javascript
// Use Mongoose validation
childSchema.pre('save', async function(next) {
  // Validate date of birth not in future
  if (this.dateOfBirth > new Date()) {
    throw new Error('Birth date cannot be in future');
  }
  
  // Validate region is valid
  if (!['searo', 'wpro', 'emro'].includes(this.region)) {
    throw new Error('Invalid region');
  }
  
  next();
});
```

### 4. Handle Files Carefully

```javascript
// ✅ DO: Clean up files when deleting
async function deleteChild(childId) {
  const child = await Child.findById(childId);
  
  // Delete from MinIO first
  if (child.metadata.photoUrl) {
    await storageService.deleteFile(BUCKETS.PROFILES, extractFileName(child.metadata.photoUrl));
  }
  
  // Then delete from MongoDB
  await Child.findByIdAndDelete(childId);
}

// ❌ DON'T: Delete from MongoDB without cleaning up MinIO
// This orphans files on S3 and wastes storage
```

### 5. Use Transactions for Related Data

```javascript
// ✅ DO: Use transaction for multi-collection changes
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Create child
  const child = await Child.create([newChild], { session });
  
  // Create timeline entry
  await TimelineEntry.create([{
    childId: child[0].uuid,
    type: 'created',
  }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}

// ❌ DON'T: Separate calls that can partially fail
await Child.create(newChild);  // Succeeds
await TimelineEntry.create(...);  // Fails - child created but no timeline entry
```

### 6. Sanitize User Input

```javascript
// ✅ DO: Validate before querying
const sanitized = {
  name: String(req.body.name).trim().substring(0, 100),
  ageMonths: Math.max(0, Math.min(60, parseInt(req.body.ageMonths))),
  domain: ['motor', 'language', 'cognitive', 'social'].includes(req.body.domain) 
    ? req.body.domain 
    : 'motor',
};

const results = await Milestone.find({
  ageRangeStartMonths: { $lte: sanitized.ageMonths },
  domain: sanitized.domain,
});

// ❌ DON'T: Directly use request params
const results = await Milestone.find({
  domain: req.query.domain,  // Could be injection attack
});
```

### 7. Optimize Database Queries

```javascript
// ✅ DO: Use projection to limit fields
const children = await Child.find({ parentId })
  .select('uuid name dateOfBirth')  // Only these fields
  .lean();  // Don't hydrate full Mongoose objects

// ✅ DO: Batch similar queries
const childIds = [...];
const children = await Child.find({ uuid: { $in: childIds } });

// ❌ DON'T: N+1 queries
for (const childId of childIds) {
  const child = await Child.findById(childId);  // Query inside loop
}
```

### 8. Handle Errors Gracefully

```javascript
// ✅ DO: Catch and log database errors
try {
  const child = await Child.findById(childId);
} catch (error) {
  if (error.name === 'CastError') {
    throw new Error('Invalid child ID format');
  }
  if (error.name === 'ValidationError') {
    throw new Error(`Validation failed: ${error.message}`);
  }
  throw error;
}

// ❌ DON'T: Let raw database errors reach the client
await Child.findById(childId);  // Could throw CastError
```

---

## Performance Tips

### Query Optimization

```javascript
// Before optimization - slow
const children = await Child.find({ parentId });
const enriched = children.map(c => ({
  ...c.toObject(),
  ageMonths: calculateAge(c.dateOfBirth),
}));

// After optimization - fast
const children = await Child.find({ parentId })
  .select('uuid name dateOfBirth')  // Only needed fields
  .lean();  // No Mongoose wrapping

const enriched = children.map(c => ({
  ...c,
  ageMonths: calculateAge(c.dateOfBirth),
}));
```

### Aggregation for Complex Queries

```javascript
// Get milestone stats by domain for a child
const stats = await Milestone.aggregate([
  { $match: { childId: childUuid } },
  { $group: {
    _id: '$domain',
    total: { $sum: 1 },
    achieved: {
      $sum: { $cond: ['$achievedDate', 1, 0] }
    }
  }},
  { $project: {
    domain: '$_id',
    total: 1,
    achieved: 1,
    percentage: { $divide: ['$achieved', '$total'] }
  }}
]);
```

---

## Debugging Tips

### Check Connection Status

```bash
# Is MongoDB running?
docker-compose logs mongo | tail -20

# Is MinIO running?
docker-compose logs minio | tail -20

# Is backend connected?
docker-compose logs backend | grep MongoDB
docker-compose logs backend | grep MinIO
```

### Query from Code

```javascript
// Add debug logging
import Child from './models/Child.js';

const child = await Child.findById(childId);
console.log('Query result:', child);  // See what's returned

// Or connect directly from Node REPL
node
> import('mongoose').then(m => m.default.connect('mongodb://localhost:27017/tinysteps'))
> db.children.find().toArray()
```

### Monitor Migrations

```bash
# See what migrations ran
mongosh "mongodb://localhost:27017/tinysteps"
> db.migrations.find().pretty()

# See migration logs
docker-compose logs backend | grep -i migrat
```

---

## Resources

- [Mongoose Docs](https://mongoosejs.com/)
- [MinIO Node.js SDK](https://min.io/docs/javascript/latest/)
- [MongoDB Query Language](https://docs.mongodb.com/manual/reference/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)


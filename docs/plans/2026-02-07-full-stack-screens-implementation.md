# Little Leap — Full-Stack Screens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 8 new screens (Pediatrician Report, Generated Report, Development Insights, WHO Evidence, Health Hub/Doctors, Improve Motor Skills, Improve Language Skills, Resources Library) to both Flutter and React web apps, backed by new APIs, database models, MinIO storage, and analysis-driven resource caching. Also fix bedtime story image persistence.

**Architecture:** Analysis-driven content caching — when a new analysis runs, Gemini generates personalized improvement resources that are stored in MongoDB and served from cache until the next analysis. MinIO stores all binary assets (images, PDFs). Seeded doctor collection is filtered by analysis results. Reports are generated from analysis data with PDF export. WHO evidence is contextual — filtered by the domain/page the user navigated from. Both Flutter and React web apps consume the same REST APIs. Local storage becomes a cache layer over the DB, not the source of truth.

**Tech Stack:**
- Backend: Node.js/Express, MongoDB/Mongoose, MinIO SDK, pdfkit, Google Generative AI
- Flutter: Provider, fl_chart, http, share_plus, path_provider
- React Web: TypeScript, React Query, Recharts, Framer Motion, react-to-print

---

## Phase 1: Backend Infrastructure

### Task 1: Add MinIO dependency and storage service

**Files:**
- Modify: `backend/package.json` (add `minio` dependency)
- Create: `backend/src/services/storageService.js`
- Modify: `backend/src/.env` (add MinIO config vars)

**Step 1: Install MinIO SDK**

Run:
```bash
cd /Users/shashanksaxena/Documents/Personal/Code/<repo-root>/backend && npm install minio
```

**Step 2: Add MinIO env vars**

Add to `backend/.env`:
```
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_PROFILES=profile-photos
MINIO_BUCKET_STORIES=story-illustrations
MINIO_BUCKET_REPORTS=report-pdfs
```

**Step 3: Create storageService.js**

```javascript
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

const BUCKETS = {
  profiles: process.env.MINIO_BUCKET_PROFILES || 'profile-photos',
  stories: process.env.MINIO_BUCKET_STORIES || 'story-illustrations',
  reports: process.env.MINIO_BUCKET_REPORTS || 'report-pdfs',
};

let minioClient = null;

const storageService = {
  async initialize() {
    minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    // Ensure buckets exist
    for (const bucket of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        // Set public read policy for serving images
        const policy = {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          }],
        };
        await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      }
    }
    console.log('MinIO storage initialized');
  },

  async uploadBuffer(bucket, buffer, mimeType, originalName) {
    const ext = originalName?.split('.').pop() || 'bin';
    const objectName = `${uuidv4()}.${ext}`;
    await minioClient.putObject(BUCKETS[bucket], objectName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return this.getPublicUrl(BUCKETS[bucket], objectName);
  },

  async uploadFile(bucket, filePath, mimeType) {
    const objectName = `${uuidv4()}-${filePath.split('/').pop()}`;
    await minioClient.fPutObject(BUCKETS[bucket], objectName, filePath, {
      'Content-Type': mimeType,
    });
    return this.getPublicUrl(BUCKETS[bucket], objectName);
  },

  getPublicUrl(bucket, objectName) {
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const port = process.env.MINIO_PORT || '9000';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`;
  },

  async deleteObject(bucket, objectName) {
    await minioClient.removeObject(BUCKETS[bucket], objectName);
  },

  async getPresignedUrl(bucket, objectName, expiry = 3600) {
    return minioClient.presignedGetObject(BUCKETS[bucket], objectName, expiry);
  },

  BUCKETS,
};

export default storageService;
```

**Step 4: Initialize MinIO on server start**

Modify `backend/src/index.js` — add after MongoDB connection:
```javascript
import storageService from './services/storageService.js';

// After mongoose.connect(...)
try {
  await storageService.initialize();
} catch (err) {
  console.warn('MinIO connection failed:', err.message);
  console.warn('File uploads will not work without MinIO');
}
```

**Step 5: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/services/storageService.js backend/src/index.js backend/.env
git commit -m "feat: add MinIO storage service for binary asset management"
```

---

### Task 2: Create Doctor model and seed script

**Files:**
- Create: `backend/src/models/Doctor.js`
- Create: `backend/src/scripts/seedDoctors.js`

**Step 1: Create Doctor model**

```javascript
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialty: { type: String, required: true, trim: true },
  subSpecialty: { type: String, trim: true },
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  experienceYears: { type: Number, required: true },
  distance: { type: Number }, // km from user
  consultationFee: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  avatarUrl: { type: String },
  domains: [{ type: String, enum: ['motor', 'language', 'cognitive', 'social', 'general'] }],
  tags: [{ type: String }],
  qualifications: [{ type: String }],
  location: {
    clinic: { type: String },
    address: { type: String },
    city: { type: String, default: 'Bangalore' },
  },
  availableDays: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

doctorSchema.index({ domains: 1, rating: -1 });
doctorSchema.index({ specialty: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
```

**Step 2: Create seed script**

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';

dotenv.config();

const doctors = [
  {
    name: 'Dr. Priya Sharma',
    specialty: 'Speech-Language Pathologist',
    subSpecialty: 'Pediatric Speech Therapy',
    rating: 4.9,
    experienceYears: 12,
    distance: 2.3,
    consultationFee: 800,
    domains: ['language'],
    tags: ['Recommended', 'Language watch area detected'],
    qualifications: ['MASLP', 'RCI Certified'],
    location: { clinic: 'Little Voices Clinic', address: 'Koramangala', city: 'Bangalore' },
    availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
  },
  {
    name: 'Dr. Rajesh Kumar',
    specialty: 'Pediatrician',
    subSpecialty: 'General Pediatrics',
    rating: 4.8,
    experienceYears: 18,
    distance: 1.1,
    consultationFee: 1200,
    domains: ['general', 'motor', 'cognitive'],
    tags: [],
    qualifications: ['MD Pediatrics', 'IAP Fellow'],
    location: { clinic: 'Rainbow Children\'s Hospital', address: 'Indiranagar', city: 'Bangalore' },
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
  },
  {
    name: 'Dr. Ananya Patel',
    specialty: 'Occupational Therapist',
    subSpecialty: 'Pediatric OT',
    rating: 4.7,
    experienceYears: 8,
    distance: 4.5,
    consultationFee: 1000,
    domains: ['motor', 'cognitive'],
    tags: [],
    qualifications: ['MOT', 'Sensory Integration Certified'],
    location: { clinic: 'Grow Together Center', address: 'HSR Layout', city: 'Bangalore' },
    availableDays: ['Tue', 'Wed', 'Thu', 'Sat'],
  },
  {
    name: 'Dr. Meera Krishnan',
    specialty: 'Developmental Pediatrician',
    subSpecialty: 'Neurodevelopmental Assessment',
    rating: 4.9,
    experienceYears: 15,
    distance: 3.2,
    consultationFee: 1500,
    domains: ['motor', 'language', 'cognitive', 'social'],
    tags: [],
    qualifications: ['MD Pediatrics', 'DM Neurology'],
    location: { clinic: 'Milestone Development Center', address: 'Jayanagar', city: 'Bangalore' },
    availableDays: ['Mon', 'Wed', 'Fri'],
  },
  {
    name: 'Dr. Arjun Reddy',
    specialty: 'Child Psychologist',
    subSpecialty: 'Behavioral Development',
    rating: 4.6,
    experienceYears: 10,
    distance: 2.8,
    consultationFee: 900,
    domains: ['social', 'cognitive'],
    tags: [],
    qualifications: ['PhD Clinical Psychology', 'RCI Registered'],
    location: { clinic: 'MindTree Kids', address: 'Whitefield', city: 'Bangalore' },
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  },
  {
    name: 'Dr. Kavitha Nair',
    specialty: 'Pediatrician',
    subSpecialty: 'Growth & Nutrition',
    rating: 4.7,
    experienceYears: 14,
    distance: 1.8,
    consultationFee: 1100,
    domains: ['general'],
    tags: [],
    qualifications: ['MD Pediatrics', 'DCH'],
    location: { clinic: 'KidsCare Clinic', address: 'Marathahalli', city: 'Bangalore' },
    availableDays: ['Mon', 'Tue', 'Thu', 'Sat'],
  },
  {
    name: 'Dr. Sneha Gupta',
    specialty: 'Speech-Language Pathologist',
    subSpecialty: 'Early Language Intervention',
    rating: 4.5,
    experienceYears: 6,
    distance: 5.1,
    consultationFee: 700,
    domains: ['language'],
    tags: [],
    qualifications: ['BASLP', 'MASLP'],
    location: { clinic: 'Speak Easy Clinic', address: 'Electronic City', city: 'Bangalore' },
    availableDays: ['Tue', 'Wed', 'Fri', 'Sat'],
  },
  {
    name: 'Dr. Vikram Singh',
    specialty: 'Physiotherapist',
    subSpecialty: 'Pediatric Physiotherapy',
    rating: 4.8,
    experienceYears: 11,
    distance: 3.5,
    consultationFee: 850,
    domains: ['motor'],
    tags: [],
    qualifications: ['MPT Pediatrics', 'NDT Certified'],
    location: { clinic: 'ActiveKids Physio', address: 'BTM Layout', city: 'Bangalore' },
    availableDays: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  {
    name: 'Dr. Deepa Menon',
    specialty: 'Occupational Therapist',
    subSpecialty: 'Fine Motor & Sensory',
    rating: 4.6,
    experienceYears: 9,
    distance: 2.0,
    consultationFee: 950,
    domains: ['motor', 'cognitive'],
    tags: [],
    qualifications: ['MOT', 'SIPT Certified'],
    location: { clinic: 'Sensory Steps', address: 'JP Nagar', city: 'Bangalore' },
    availableDays: ['Mon', 'Tue', 'Thu', 'Sat'],
  },
  {
    name: 'Dr. Rahul Joshi',
    specialty: 'Pediatric Neurologist',
    subSpecialty: 'Neurodevelopmental Disorders',
    rating: 4.9,
    experienceYears: 20,
    distance: 4.0,
    consultationFee: 2000,
    domains: ['motor', 'cognitive', 'language'],
    tags: [],
    qualifications: ['DM Pediatric Neurology', 'MD Pediatrics'],
    location: { clinic: 'BrainChild Neuro Center', address: 'Malleshwaram', city: 'Bangalore' },
    availableDays: ['Mon', 'Thu', 'Sat'],
  },
  {
    name: 'Dr. Sunita Rao',
    specialty: 'Child Psychologist',
    subSpecialty: 'Play Therapy & Social Skills',
    rating: 4.7,
    experienceYears: 7,
    distance: 3.0,
    consultationFee: 800,
    domains: ['social', 'language'],
    tags: [],
    qualifications: ['MA Clinical Psychology', 'Play Therapy Certified'],
    location: { clinic: 'Happy Hearts Center', address: 'Banashankari', city: 'Bangalore' },
    availableDays: ['Tue', 'Wed', 'Fri'],
  },
  {
    name: 'Dr. Arun Prakash',
    specialty: 'Pediatrician',
    subSpecialty: 'Developmental Screening',
    rating: 4.5,
    experienceYears: 13,
    distance: 1.5,
    consultationFee: 1000,
    domains: ['general', 'motor', 'language'],
    tags: [],
    qualifications: ['MD Pediatrics'],
    location: { clinic: 'TinyTots Health', address: 'Koramangala', city: 'Bangalore' },
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tinysteps');
    console.log('Connected to MongoDB');

    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    const inserted = await Doctor.insertMany(doctors);
    console.log(`Seeded ${inserted.length} doctors`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedDoctors();
```

**Step 3: Run seed script**

```bash
cd /Users/shashanksaxena/Documents/Personal/Code/<repo-root>/backend && node src/scripts/seedDoctors.js
```

**Step 4: Commit**

```bash
git add backend/src/models/Doctor.js backend/src/scripts/seedDoctors.js
git commit -m "feat: add Doctor model with seed data for 12 specialists"
```

---

### Task 3: Create Resource model

**Files:**
- Create: `backend/src/models/Resource.js`

**Step 1: Create Resource model**

```javascript
import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  domain: { type: String, enum: ['motor', 'language', 'cognitive', 'social'], required: true },
  type: { type: String, enum: ['activity', 'book', 'video', 'toy', 'app'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  ageRange: { type: String }, // e.g., "12-18 months"
  duration: { type: String }, // e.g., "10-15 min"
  difficulty: { type: String, enum: ['easy', 'moderate', 'challenging'], default: 'easy' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  imageUrl: { type: String },
  sourceUrl: { type: String },
  whoSources: [{
    title: { type: String },
    url: { type: String },
    domain: { type: String },
  }],
  isCurrent: { type: Boolean, default: true }, // false for older analysis-linked resources
}, { timestamps: true });

resourceSchema.index({ childId: 1, analysisId: 1 });
resourceSchema.index({ childId: 1, domain: 1, isCurrent: 1 });
resourceSchema.index({ childId: 1, type: 1, isCurrent: 1 });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
```

**Step 2: Commit**

```bash
git add backend/src/models/Resource.js
git commit -m "feat: add Resource model for analysis-cached improvement suggestions"
```

---

### Task 4: Create Report model

**Files:**
- Create: `backend/src/models/Report.js`

**Step 1: Create Report model**

```javascript
import mongoose from 'mongoose';

const domainDetailSchema = new mongoose.Schema({
  domain: { type: String, enum: ['motor', 'language', 'cognitive', 'social'], required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  status: { type: String, enum: ['on_track', 'emerging', 'needs_support'], required: true },
  observations: [{ type: String }],
  strengths: [{ type: String }],
  areasToSupport: [{ type: String }],
  whoRange: { type: String }, // e.g., "Walking typically achieved 9-17 months"
  alertLevel: { type: String, enum: ['none', 'watch', 'concern'], default: 'none' },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis', required: true },
  reportNumber: { type: String, required: true }, // e.g., "RPT-2026-0207"
  patientInfo: {
    name: { type: String, required: true },
    gender: { type: String },
    ageMonths: { type: Number, required: true },
    dateOfBirth: { type: Date },
    height: { type: Number },
    weight: { type: Number },
    headCircumference: { type: Number },
  },
  overallScore: { type: Number, min: 0, max: 100, required: true },
  overallStatus: { type: String, enum: ['on_track', 'emerging', 'needs_support'], required: true },
  overallSummary: { type: String, required: true },
  domainAssessments: [domainDetailSchema],
  growthPercentiles: [{
    metric: { type: String, enum: ['weight', 'height', 'headCircumference'] },
    value: { type: Number },
    percentile: { type: Number },
    interpretation: { type: String },
  }],
  recommendations: [{
    priority: { type: Number }, // 1, 2, 3
    text: { type: String },
    domain: { type: String },
  }],
  whoSources: [{
    title: { type: String },
    url: { type: String },
    journal: { type: String },
    year: { type: Number },
    citations: { type: Number },
    domain: { type: String },
    summary: { type: String },
  }],
  pdfUrl: { type: String }, // MinIO URL
  sharedWith: [{
    method: { type: String, enum: ['email', 'link', 'download'] },
    recipient: { type: String },
    sharedAt: { type: Date, default: Date.now },
  }],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

reportSchema.index({ childId: 1, createdAt: -1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ analysisId: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
```

**Step 2: Commit**

```bash
git add backend/src/models/Report.js
git commit -m "feat: add Report model for pediatrician report generation"
```

---

### Task 5: Modify Story model for image persistence

**Files:**
- Modify: `backend/src/models/Story.js`

**Step 1: Add illustrationsGenerated field to Story schema**

Add to the Story schema (after `timesRead` field):
```javascript
illustrationsGenerated: { type: Boolean, default: false },
```

The existing `pages[].illustrationUrl` field already exists in the schema. We just need the boolean flag to track whether illustrations have been generated and stored in MinIO.

**Step 2: Commit**

```bash
git add backend/src/models/Story.js
git commit -m "feat: add illustrationsGenerated flag to Story model"
```

---

## Phase 2: Backend APIs

### Task 6: Image upload endpoint

**Files:**
- Create: `backend/src/routes/upload.js`
- Modify: `backend/src/index.js` (register route)

**Step 1: Create upload route**

```javascript
import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import storageService from '../services/storageService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/upload/image
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bucket = req.body.bucket || 'profiles'; // profiles, stories, reports
    const allowedBuckets = ['profiles', 'stories', 'reports'];
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: 'Invalid bucket' });
    }

    const url = await storageService.uploadBuffer(
      bucket,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.json({ url, bucket, originalName: req.file.originalname });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
```

**Step 2: Register in index.js**

Add to `backend/src/index.js`:
```javascript
import uploadRoutes from './routes/upload.js';
app.use('/api/upload', uploadRoutes);
```

**Step 3: Commit**

```bash
git add backend/src/routes/upload.js backend/src/index.js
git commit -m "feat: add image upload endpoint with MinIO storage"
```

---

### Task 7: Fix story image persistence

**Files:**
- Modify: `backend/src/routes/stories.js`

**Step 1: Modify GET story endpoint to persist illustrations**

In the `GET /:childId/:id` route, after incrementing `timesRead`, add illustration persistence logic:

```javascript
// After finding the story and incrementing timesRead:
// Check if illustrations need to be generated and persisted
if (!story.illustrationsGenerated && story.pages.some(p => p.illustrationPrompt && !p.illustrationUrl)) {
  try {
    const geminiService = (await import('../services/geminiService.js')).default;
    const apiKey = req.user?.geminiApiKey || process.env.GEMINI_API_KEY;
    geminiService.initialize(apiKey);

    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      if (page.illustrationPrompt && !page.illustrationUrl) {
        try {
          const imageBuffer = await geminiService.generateIllustration(page.illustrationPrompt);
          if (imageBuffer) {
            const storageService = (await import('../services/storageService.js')).default;
            const url = await storageService.uploadBuffer(
              'stories',
              imageBuffer,
              'image/png',
              `story-${story._id}-page-${i}.png`
            );
            story.pages[i].illustrationUrl = url;
          }
        } catch (imgErr) {
          console.warn(`Failed to generate illustration for page ${i}:`, imgErr.message);
        }
      }
    }
    story.illustrationsGenerated = true;
    await story.save();
  } catch (err) {
    console.warn('Illustration generation failed:', err.message);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/routes/stories.js
git commit -m "fix: persist story illustrations to MinIO, prevent regeneration"
```

---

### Task 8: Doctor routes

**Files:**
- Create: `backend/src/routes/doctors.js`
- Modify: `backend/src/index.js` (register route)

**Step 1: Create doctor routes**

```javascript
import express from 'express';
import Doctor from '../models/Doctor.js';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/doctors - List all doctors with optional filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { domain, specialty } = req.query;
    const filter = { isActive: true };

    if (domain) filter.domains = domain;
    if (specialty) filter.specialty = new RegExp(specialty, 'i');

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctors/recommended/:childId - Doctors recommended based on latest analysis
router.get('/recommended/:childId', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // Get latest analysis to determine flagged domains
    const latestAnalysis = await Analysis.findOne({ childId }).sort({ createdAt: -1 });

    const flaggedDomains = [];
    const domainScores = {};

    if (latestAnalysis) {
      const assessments = [
        latestAnalysis.motorAssessment,
        latestAnalysis.languageAssessment,
        latestAnalysis.cognitiveAssessment,
        latestAnalysis.socialAssessment,
      ];

      for (const assessment of assessments) {
        if (assessment) {
          domainScores[assessment.domain] = assessment.score;
          if (assessment.status === 'needs_support' || assessment.status === 'emerging') {
            flaggedDomains.push(assessment.domain);
          }
        }
      }
    }

    // Get all active doctors
    const allDoctors = await Doctor.find({ isActive: true }).sort({ rating: -1 });

    // Separate recommended (matching flagged domains) vs other doctors
    const recommended = [];
    const others = [];

    for (const doc of allDoctors) {
      const matchesFlagged = doc.domains.some(d => flaggedDomains.includes(d));
      const doctorObj = doc.toObject();
      doctorObj.isRecommended = matchesFlagged;
      doctorObj.recommendationReason = matchesFlagged
        ? `${flaggedDomains.join(', ')} area${flaggedDomains.length > 1 ? 's' : ''} flagged in assessment`
        : null;

      if (matchesFlagged) {
        recommended.push(doctorObj);
      } else {
        others.push(doctorObj);
      }
    }

    res.json({
      flaggedDomains,
      domainScores,
      childName: child.name,
      recommended,
      others,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

**Step 2: Register in index.js**

```javascript
import doctorRoutes from './routes/doctors.js';
app.use('/api/doctors', doctorRoutes);
```

**Step 3: Commit**

```bash
git add backend/src/routes/doctors.js backend/src/index.js
git commit -m "feat: add doctor routes with analysis-based recommendations"
```

---

### Task 9: Resource routes + Gemini resource generation

**Files:**
- Create: `backend/src/routes/resources.js`
- Modify: `backend/src/services/geminiService.js` (add resource generation method)
- Modify: `backend/src/index.js` (register route)

**Step 1: Add resource generation to Gemini service**

Add to `geminiService.js`:

```javascript
async generateImprovementResources(child, analysis) {
  const ageMonths = child.ageInMonths || Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (30.44 * 24 * 60 * 60 * 1000));

  // Build context from achieved milestones
  const achievedIds = (child.achievedMilestones || []).map(m => m.milestoneId);

  const assessments = [
    { domain: 'motor', data: analysis.motorAssessment },
    { domain: 'language', data: analysis.languageAssessment },
    { domain: 'cognitive', data: analysis.cognitiveAssessment },
    { domain: 'social', data: analysis.socialAssessment },
  ];

  const allResources = [];

  for (const { domain, data } of assessments) {
    if (!data) continue;

    const isFlagged = data.status === 'needs_support' || data.status === 'emerging';
    const count = isFlagged ? 12 : 6;

    const prompt = `You are a child development expert. Generate ${count} improvement resources for a ${ageMonths}-month-old child in the "${domain}" developmental domain.

Current assessment:
- Score: ${data.score}/100
- Status: ${data.status}
- Areas to support: ${(data.areasToSupport || []).join(', ') || 'general improvement'}
- Achieved milestones: ${achievedIds.length > 0 ? achievedIds.join(', ') : 'none tracked'}

IMPORTANT:
- Do NOT suggest resources for already-achieved milestones
- Focus on UPCOMING milestones and areas needing support
- Make resources age-appropriate for ${ageMonths} months
- Include a mix of types: activity, book, video, toy, app

Return a JSON array of objects:
[{
  "type": "activity|book|video|toy|app",
  "title": "Resource name",
  "description": "2-3 sentence description of the resource and how it helps",
  "tags": ["tag1", "tag2"],
  "ageRange": "12-18 months",
  "duration": "10-15 min",
  "difficulty": "easy|moderate|challenging",
  "priority": "high|medium|low"
}]

Return ONLY the JSON array, no other text.`;

    try {
      const result = await this.textModel.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const resources = JSON.parse(jsonMatch[0]);
        for (const r of resources) {
          allResources.push({ ...r, domain });
        }
      }
    } catch (err) {
      console.error(`Resource generation failed for ${domain}:`, err.message);
    }
  }

  return allResources;
},
```

**Step 2: Create resource routes**

```javascript
import express from 'express';
import Resource from '../models/Resource.js';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import geminiService from '../services/geminiService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/resources/:childId - Get cached resources
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const { domain, type } = req.query;

    const filter = { childId, isCurrent: true };
    if (domain) filter.domain = domain;
    if (type) filter.type = type;

    const resources = await Resource.find(filter).sort({ priority: 1, createdAt: -1 });

    // Group by domain for summary counts
    const counts = await Resource.aggregate([
      { $match: { childId: new (await import('mongoose')).default.Types.ObjectId(childId), isCurrent: true } },
      { $group: { _id: { domain: '$domain', type: '$type' }, count: { $sum: 1 } } },
    ]);

    res.json({ resources, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources/:childId/regenerate - Force regenerate resources
router.post('/:childId/regenerate', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const latestAnalysis = await Analysis.findOne({ childId }).sort({ createdAt: -1 });
    if (!latestAnalysis) return res.status(404).json({ error: 'No analysis found' });

    // Mark old resources as not current
    await Resource.updateMany({ childId, isCurrent: true }, { isCurrent: false });

    // Generate new resources
    const apiKey = req.user?.geminiApiKey || process.env.GEMINI_API_KEY;
    geminiService.initialize(apiKey);
    const generated = await geminiService.generateImprovementResources(child, latestAnalysis);

    // Save new resources
    const resources = await Resource.insertMany(
      generated.map(r => ({
        childId,
        analysisId: latestAnalysis._id,
        ...r,
        isCurrent: true,
      }))
    );

    res.json({ count: resources.length, resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

**Step 3: Register in index.js**

```javascript
import resourceRoutes from './routes/resources.js';
app.use('/api/resources', resourceRoutes);
```

**Step 4: Modify analysis route to auto-generate resources**

In `backend/src/routes/analysis.js`, after the analysis is saved (in the POST `/` handler), add:

```javascript
// After analysis is saved successfully:
// Auto-generate improvement resources in background
try {
  const Resource = (await import('../models/Resource.js')).default;
  // Mark old resources as not current
  await Resource.updateMany({ childId: child._id, isCurrent: true }, { isCurrent: false });

  const generated = await geminiService.generateImprovementResources(child, analysis);
  if (generated.length > 0) {
    await Resource.insertMany(
      generated.map(r => ({
        childId: child._id,
        analysisId: analysis._id,
        ...r,
        isCurrent: true,
      }))
    );
    console.log(`Generated ${generated.length} improvement resources`);
  }
} catch (resourceErr) {
  console.warn('Resource generation failed (non-blocking):', resourceErr.message);
}
```

**Step 5: Commit**

```bash
git add backend/src/routes/resources.js backend/src/services/geminiService.js backend/src/routes/analysis.js backend/src/index.js
git commit -m "feat: add resource routes with Gemini generation and analysis auto-trigger"
```

---

### Task 10: Report routes with PDF generation

**Files:**
- Create: `backend/src/routes/reports.js`
- Modify: `backend/src/index.js` (register route)
- Modify: `backend/package.json` (add pdfkit)

**Step 1: Install pdfkit**

```bash
cd /Users/shashanksaxena/Documents/Personal/Code/<repo-root>/backend && npm install pdfkit
```

**Step 2: Create report routes**

```javascript
import express from 'express';
import PDFDocument from 'pdfkit';
import Report from '../models/Report.js';
import Analysis from '../models/Analysis.js';
import Child from '../models/Child.js';
import { authMiddleware } from '../middleware/auth.js';
import storageService from '../services/storageService.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// GET /api/reports/:childId - List reports
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ childId: req.params.childId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/:childId/generate - Generate report from latest analysis
router.post('/:childId/generate', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const analysis = await Analysis.findOne({ childId }).sort({ createdAt: -1 });
    if (!analysis) return res.status(404).json({ error: 'No analysis found. Run an analysis first.' });

    const ageMonths = child.ageInMonths || Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (30.44 * 24 * 60 * 60 * 1000));

    // Generate report number
    const date = new Date();
    const reportNumber = `RPT-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    // Build domain assessments
    const domainAssessments = [];
    const assessmentFields = ['motorAssessment', 'languageAssessment', 'cognitiveAssessment', 'socialAssessment'];

    for (const field of assessmentFields) {
      const a = analysis[field];
      if (!a) continue;

      let alertLevel = 'none';
      if (a.status === 'needs_support') alertLevel = 'concern';
      else if (a.status === 'emerging' || a.score < 80) alertLevel = 'watch';

      // Get WHO range for this domain
      const milestones = whoDataService.getMilestonesByDomain(a.domain, ageMonths);
      const whoRange = milestones.length > 0
        ? `${milestones[0].title} typically achieved ${milestones[0].minMonths}-${milestones[0].maxMonths} months`
        : '';

      domainAssessments.push({
        domain: a.domain,
        score: a.score,
        status: a.status,
        observations: a.observations || [],
        strengths: a.strengths || [],
        areasToSupport: a.areasToSupport || [],
        whoRange,
        alertLevel,
      });
    }

    // Get WHO sources relevant to assessment
    const whoSources = whoDataService.getSources().map(s => ({
      ...s,
      summary: `Referenced for ${s.domain || 'general'} developmental assessment`,
    }));

    // Build recommendations
    const recommendations = (analysis.personalizedTips || []).slice(0, 5).map((tip, i) => ({
      priority: i + 1,
      text: tip,
      domain: 'general',
    }));

    const report = new Report({
      childId,
      userId: req.user._id || req.user.id,
      analysisId: analysis._id,
      reportNumber,
      patientInfo: {
        name: child.name,
        gender: child.gender,
        ageMonths,
        dateOfBirth: child.dateOfBirth,
        height: child.height,
        weight: child.weight,
        headCircumference: child.headCircumference,
      },
      overallScore: analysis.overallScore,
      overallStatus: analysis.overallStatus,
      overallSummary: analysis.summary,
      domainAssessments,
      growthPercentiles: analysis.growthPercentiles || [],
      recommendations,
      whoSources,
    });

    await report.save();

    // Generate PDF in background
    generateReportPDF(report).catch(err => {
      console.warn('PDF generation failed:', err.message);
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:childId/:id - Get specific report
router.get('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, childId: req.params.childId });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:childId/:id/pdf - Get or generate PDF
router.get('/:childId/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, childId: req.params.childId });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (report.pdfUrl) {
      return res.json({ pdfUrl: report.pdfUrl });
    }

    // Generate PDF if not yet created
    const pdfUrl = await generateReportPDF(report);
    res.json({ pdfUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/:childId/:id/share - Track sharing
router.post('/:childId/:id/share', authMiddleware, async (req, res) => {
  try {
    const { method, recipient } = req.body;
    const report = await Report.findOne({ _id: req.params.id, childId: req.params.childId });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    report.sharedWith.push({ method, recipient, sharedAt: new Date() });
    await report.save();

    res.json({ success: true, pdfUrl: report.pdfUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PDF generation helper
async function generateReportPDF(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const url = await storageService.uploadBuffer(
          'reports',
          buffer,
          'application/pdf',
          `report-${report.reportNumber}.pdf`
        );
        report.pdfUrl = url;
        await report.save();
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Little Leap - Development Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Report: ${report.reportNumber} | Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Patient Info
    doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${report.patientInfo.name}`);
    doc.text(`Age: ${report.patientInfo.ageMonths} months | Gender: ${report.patientInfo.gender || 'Not specified'}`);
    doc.text(`Height: ${report.patientInfo.height || 'N/A'} cm | Weight: ${report.patientInfo.weight || 'N/A'} kg | HC: ${report.patientInfo.headCircumference || 'N/A'} cm`);
    doc.moveDown(1);

    // Overall Assessment
    doc.fontSize(14).font('Helvetica-Bold').text('Overall Assessment');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(24).font('Helvetica-Bold').text(`${report.overallScore}/100`, { continued: true });
    doc.fontSize(12).font('Helvetica').text(`  ${report.overallStatus.replace(/_/g, ' ').toUpperCase()}`);
    doc.fontSize(10).text(report.overallSummary);
    doc.moveDown(1);

    // Domain Assessments
    doc.fontSize(14).font('Helvetica-Bold').text('Domain Assessment Details');
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    for (const domain of report.domainAssessments) {
      doc.fontSize(12).font('Helvetica-Bold').text(`${domain.domain.charAt(0).toUpperCase() + domain.domain.slice(1)} — ${domain.score}/100 (${domain.status.replace(/_/g, ' ')})`);
      if (domain.alertLevel !== 'none') {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('red').text(`⚠ ${domain.alertLevel.toUpperCase()} ALERT`);
        doc.fillColor('black');
      }
      for (const obs of domain.observations.slice(0, 3)) {
        doc.fontSize(9).font('Helvetica').text(`  • ${obs}`);
      }
      if (domain.whoRange) {
        doc.fontSize(8).font('Helvetica').fillColor('gray').text(`  WHO Range: ${domain.whoRange}`);
        doc.fillColor('black');
      }
      doc.moveDown(0.5);
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);
      for (const rec of report.recommendations) {
        doc.fontSize(10).font('Helvetica').text(`${rec.priority}. ${rec.text}`);
      }
      doc.moveDown(1);
    }

    // Disclaimer
    doc.moveDown(1);
    doc.fontSize(7).font('Helvetica').fillColor('gray');
    doc.text('DISCLAIMER: This report is generated by AI for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.', { align: 'center' });
    doc.text('Generated by Little Leap | WHO-referenced developmental assessment', { align: 'center' });

    doc.end();
  });
}

export default router;
```

**Step 3: Register in index.js**

```javascript
import reportRoutes from './routes/reports.js';
app.use('/api/reports', reportRoutes);
```

**Step 4: Commit**

```bash
git add backend/src/routes/reports.js backend/src/index.js backend/package.json backend/package-lock.json
git commit -m "feat: add report routes with PDF generation and MinIO storage"
```

---

### Task 11: WHO evidence route

**Files:**
- Modify: `backend/src/routes/recommendations.js`

**Step 1: Enhance the existing `/sources` endpoint for contextual filtering**

Replace the existing `/sources` route in `recommendations.js`:

```javascript
// GET /api/recommendations/sources - Contextual WHO evidence
router.get('/sources', async (req, res) => {
  try {
    const { context, analysisId, region } = req.query;

    let sources = whoDataService.getSources();

    // Add regional sources if specified
    if (region) {
      const regionalSources = whoDataService.getSourcesForRegion(region);
      sources = [...sources, ...regionalSources];
    }

    // Filter by context (domain)
    if (context) {
      const contextDomains = context.split(',');
      sources = sources.filter(s =>
        !s.domain || contextDomains.includes(s.domain) || s.domain === 'general'
      );
    }

    // If analysisId provided, also include analysis-specific sources
    let analysisSources = [];
    if (analysisId) {
      try {
        const Analysis = (await import('../models/Analysis.js')).default;
        const analysis = await Analysis.findById(analysisId);
        if (analysis && analysis.sources) {
          analysisSources = analysis.sources;
        }
      } catch (err) {
        console.warn('Could not load analysis sources:', err.message);
      }
    }

    // Build methodology section
    const methodology = [
      {
        step: 1,
        title: 'Data Collection',
        description: 'Photo/video analysis using Google Gemini AI trained on developmental indicators',
        icon: 'clipboard-list',
      },
      {
        step: 2,
        title: 'WHO Benchmark Comparison',
        description: 'Assessment results compared against WHO Child Growth Standards and CDC Developmental Milestones',
        icon: 'git-compare',
      },
      {
        step: 3,
        title: 'AI-Powered Analysis',
        description: 'Machine learning models identify developmental patterns and generate personalized recommendations',
        icon: 'brain',
      },
    ];

    res.json({
      sources: [...sources, ...analysisSources],
      methodology,
      disclaimer: 'This information is for educational purposes only and does not constitute medical advice.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Commit**

```bash
git add backend/src/routes/recommendations.js
git commit -m "feat: enhance WHO sources endpoint with contextual filtering and methodology"
```

---

## Phase 3: Flutter App — Screens & Navigation

### Task 12: Add new API methods to Flutter ApiService

**Files:**
- Modify: `tinysteps_flutter/lib/services/api_service.dart`

**Step 1: Add doctor, resource, report, upload, and WHO evidence API methods**

Add to the `ApiService` class:

```dart
// === Doctors ===
Future<Map<String, dynamic>> getRecommendedDoctors(String childId) async {
  return await get('/doctors/recommended/$childId');
}

Future<List<dynamic>> getDoctors({String? domain, String? specialty}) async {
  final params = <String, String>{};
  if (domain != null) params['domain'] = domain;
  if (specialty != null) params['specialty'] = specialty;
  final queryString = params.entries.map((e) => '${e.key}=${e.value}').join('&');
  final result = await get('/doctors${queryString.isNotEmpty ? '?$queryString' : ''}');
  return result is List ? result : [];
}

// === Resources ===
Future<Map<String, dynamic>> getResources(String childId, {String? domain, String? type}) async {
  final params = <String, String>{};
  if (domain != null) params['domain'] = domain;
  if (type != null) params['type'] = type;
  final queryString = params.entries.map((e) => '${e.key}=${e.value}').join('&');
  return await get('/resources/$childId${queryString.isNotEmpty ? '?$queryString' : ''}');
}

Future<Map<String, dynamic>> regenerateResources(String childId) async {
  return await post('/resources/$childId/regenerate', {});
}

// === Reports ===
Future<List<dynamic>> getReports(String childId) async {
  final result = await get('/reports/$childId');
  return result is List ? result : [];
}

Future<Map<String, dynamic>> generateReport(String childId) async {
  return await post('/reports/$childId/generate', {});
}

Future<Map<String, dynamic>> getReport(String childId, String reportId) async {
  return await get('/reports/$childId/$reportId');
}

Future<Map<String, dynamic>> getReportPdf(String childId, String reportId) async {
  return await get('/reports/$childId/$reportId/pdf');
}

Future<Map<String, dynamic>> shareReport(String childId, String reportId, String method, {String? recipient}) async {
  return await post('/reports/$childId/$reportId/share', {
    'method': method,
    'recipient': recipient,
  });
}

// === WHO Evidence ===
Future<Map<String, dynamic>> getWHOEvidence({String? context, String? analysisId, String? region}) async {
  final params = <String, String>{};
  if (context != null) params['context'] = context;
  if (analysisId != null) params['analysisId'] = analysisId;
  if (region != null) params['region'] = region;
  final queryString = params.entries.map((e) => '${e.key}=${e.value}').join('&');
  return await get('/recommendations/sources${queryString.isNotEmpty ? '?$queryString' : ''}');
}

// === Upload ===
Future<Map<String, dynamic>> uploadImage(String filePath, String bucket) async {
  final uri = Uri.parse('$baseUrl/upload/image');
  final request = http.MultipartRequest('POST', uri);
  if (_token != null) request.headers['Authorization'] = 'Bearer $_token';
  request.fields['bucket'] = bucket;
  request.files.add(await http.MultipartFile.fromPath('image', filePath));
  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  return json.decode(response.body);
}
```

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/services/api_service.dart
git commit -m "feat: add doctor, resource, report, WHO evidence API methods to Flutter"
```

---

### Task 13: Create generic Improve Domain screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/discover/improve_domain_screen.dart`

**Step 1: Create the screen**

This is a single reusable screen that handles Motor, Language, Cognitive, and Social domains. It receives the domain name, color, and score as parameters. Matches designs `SGl3o` (Motor) and `lbS9B` (Language).

The screen has:
- Gradient header with domain color, score badge, back button
- 4-tab navigation (Activities, Books, Videos, Toys/Apps)
- Featured resource card (highest priority)
- List of additional resources as compact cards
- WHO evidence link

Implementation: Standard Flutter StatefulWidget with TabController. Fetches resources from `GET /api/resources/:childId?domain=X&type=Y`. Each tab filters by resource type.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/discover/improve_domain_screen.dart
git commit -m "feat: add reusable Improve Domain screen for Flutter"
```

---

### Task 14: Create Resources Library screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/discover/resources_library_screen.dart`

**Step 1: Create the screen**

Matches design `k0GJS`. Shows:
- Emerald-teal gradient header with search bar
- "Browse by Domain" grid (4 domain cards with resource counts)
- "Browse by Type" grid (Activities, Books, Videos, Toys)
- "Recently Added" section
- Language domain shows "Focus area" badge when flagged

Fetches resource counts from `GET /api/resources/:childId`. Tapping domain card navigates to `ImproveDomainScreen`. Tapping type card navigates with type filter.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/discover/resources_library_screen.dart
git commit -m "feat: add Resources Library screen for Flutter"
```

---

### Task 15: Create Health Hub / Doctors screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/health/health_hub_screen.dart`

**Step 1: Create the screen**

Matches design `aR3pP`. Shows:
- Red-orange gradient header
- AI recommendation banner based on child's analysis
- Category filter pills (All, Pediatricians, Speech, Therapy)
- Doctor cards sorted by recommended first
- Each card: avatar, name, specialty, rating, experience, distance, fee
- "Book Appointment" buttons (opens external link or shows contact info)

Fetches from `GET /api/doctors/recommended/:childId`. Highlighted card for top recommendation.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/health/health_hub_screen.dart
git commit -m "feat: add Health Hub / Doctors screen for Flutter"
```

---

### Task 16: Create Pediatrician Report screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/reports/pediatrician_report_screen.dart`

**Step 1: Create the screen**

Matches design `14pol`. Shows:
- Teal gradient header with stethoscope icon
- Report status card (Ready/Generate)
- Child info card
- "Generate New Report" button → navigates to Generated Report screen
- Development Summary: overall score, 4 domain progress bars
- Key Findings for Doctor section
- "Consult a Doctor" → navigates to Health Hub
- Schedule Visit card
- Disclaimer

Data source: Latest `Analysis` + existing `Report` if any.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/reports/pediatrician_report_screen.dart
git commit -m "feat: add Pediatrician Report screen for Flutter"
```

---

### Task 17: Create Generated Report screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/reports/generated_report_screen.dart`

**Step 1: Create the screen**

Matches design `tnjUk`. Shows:
- Teal gradient header with share/download icons
- Report date and ID
- Patient info card
- Overall Assessment with score and status badge
- Domain Assessment Details (4 domain cards with observations, WHO ranges)
- Language domain shows amber "WATCH ALERT" when score < 80
- Recommendations section
- Action buttons: "Send to Doctor" (share sheet), "Export PDF" (download)
- Disclaimer

Calls `POST /api/reports/:childId/generate` on entry. PDF via `GET /api/reports/:childId/:id/pdf`.
Uses `share_plus` package for native sharing.

**Step 2: Add share_plus dependency**

```bash
cd /Users/shashanksaxena/Documents/Personal/Code/<repo-root>/tinysteps_flutter && flutter pub add share_plus path_provider
```

**Step 3: Commit**

```bash
git add tinysteps_flutter/lib/screens/reports/generated_report_screen.dart tinysteps_flutter/pubspec.yaml tinysteps_flutter/pubspec.lock
git commit -m "feat: add Generated Report screen with PDF export for Flutter"
```

---

### Task 18: Create Development Insights screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/insights/development_insights_screen.dart`

**Step 1: Create the screen**

Matches design `KfrY2`. Shows:
- Purple gradient header (indigo to purple)
- Time filter pills (1 Week, 1 Month, 3 Months, All Time)
- Development Trend card with line chart (overall score over time using fl_chart)
- 4 domain detail cards with score, trend arrow, percentage change
- Milestone Velocity section (Achieved, In Progress, Upcoming counts)
- Age Comparison card

Data source: All `Analysis` documents for child via `GET /api/analysis/:childId`. Charts built from historical analysis scores.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/insights/development_insights_screen.dart
git commit -m "feat: add Development Insights screen with trend charts for Flutter"
```

---

### Task 19: Create WHO Research Evidence screen (Flutter)

**Files:**
- Create: `tinysteps_flutter/lib/screens/evidence/who_evidence_screen.dart`

**Step 1: Create the screen**

Matches design `PX6SL`. Shows:
- Teal gradient header with book icon
- WHO trust banner
- Source cards filtered by context (domain/feature the user came from)
- Each card: domain tag, study title, journal, citation count, "View Full Study" link
- "Our Methodology" section with 3 steps
- Disclaimer

Receives `context` parameter (domain name or feature) and optional `analysisId`.
Fetches from `GET /api/recommendations/sources?context=X&analysisId=Y`.
"View Full Study" opens URL in external browser via `url_launcher`.

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/screens/evidence/who_evidence_screen.dart
git commit -m "feat: add contextual WHO Research Evidence screen for Flutter"
```

---

### Task 20: Wire navigation in Flutter

**Files:**
- Modify: `tinysteps_flutter/lib/screens/home/home_screen.dart`

**Step 1: Add navigation entry points**

In the Home Dashboard, add these new entry points:
- Tap "Development Score" card → `PediatricianReportScreen`
- Tap development domain cards → `DevelopmentInsightsScreen`
- Add "Health" card to discover section → `HealthHubScreen`
- Add "Resources" card to discover section → `ResourcesLibraryScreen`

**Step 2: Wire cross-screen navigation**

- `PediatricianReportScreen` → "Generate Report" → `GeneratedReportScreen`
- `PediatricianReportScreen` → "Consult Doctor" → `HealthHubScreen`
- `DevelopmentInsightsScreen` → domain card tap → `ImproveDomainScreen`
- `ResourcesLibraryScreen` → domain card tap → `ImproveDomainScreen`
- Any WHO citation link → `WHOEvidenceScreen(context: domainName)`
- `HealthHubScreen` accessible from Report screen "Schedule Visit"

**Step 3: Commit**

```bash
git add tinysteps_flutter/lib/screens/home/home_screen.dart
git commit -m "feat: wire all new screens into Flutter navigation flow"
```

---

### Task 21: Update Flutter StorageService to be DB-first cache

**Files:**
- Modify: `tinysteps_flutter/lib/services/storage_service.dart`

**Step 1: Refactor to cache-over-API pattern**

Change StorageService methods to:
1. Try API call first
2. On success: update local cache, return data
3. On failure (offline): return cached data if available
4. On write: POST/PUT to API, then update cache

Key changes:
- `getChildren()` → calls `ApiService.getChildren()`, caches result
- `getCurrentChild()` → calls API, falls back to cache
- `getLatestAnalysis()` → calls API, caches
- `saveChild()` → POST to API, then cache locally
- Add sync queue for offline writes

**Step 2: Commit**

```bash
git add tinysteps_flutter/lib/services/storage_service.dart
git commit -m "refactor: make StorageService a cache layer over API, DB is source of truth"
```

---

## Phase 4: React Web App — Screens & Navigation

### Task 22: Add new API hooks for React

**Files:**
- Create: `tinysteps-ai/src/hooks/useDoctors.ts`
- Create: `tinysteps-ai/src/hooks/useResources.ts`
- Create: `tinysteps-ai/src/hooks/useReports.ts`
- Create: `tinysteps-ai/src/hooks/useWHOEvidence.ts`

**Step 1: Create React Query hooks for all new endpoints**

Each hook wraps the corresponding API call with React Query for caching, loading states, and error handling. Pattern:

```typescript
export function useRecommendedDoctors(childId: string) {
  return useQuery(['doctors', 'recommended', childId], () =>
    apiService.get(`/doctors/recommended/${childId}`)
  );
}
```

**Step 2: Commit**

```bash
git add tinysteps-ai/src/hooks/
git commit -m "feat: add React Query hooks for doctors, resources, reports, WHO evidence"
```

---

### Task 23: Create Improve Domain screen (React)

**Files:**
- Create: `tinysteps-ai/src/screens/ImproveDomainScreen.tsx`

**Step 1: Create the screen component**

Same layout as Flutter version. Uses React state for active tab. Fetches resources via `useResources` hook. Domain color, name, and score passed via route params or props.

Uses Framer Motion for animations, Recharts for any embedded charts.

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/ImproveDomainScreen.tsx
git commit -m "feat: add Improve Domain screen for React web"
```

---

### Task 24: Create Resources Library screen (React)

**Files:**
- Create: `tinysteps-ai/src/screens/ResourcesLibraryScreen.tsx`

**Step 1: Create matching the k0GJS design with React components**

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/ResourcesLibraryScreen.tsx
git commit -m "feat: add Resources Library screen for React web"
```

---

### Task 25: Create Health Hub / Doctors screen (React)

**Files:**
- Create: `tinysteps-ai/src/screens/HealthHubScreen.tsx`

**Step 1: Create matching the aR3pP design**

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/HealthHubScreen.tsx
git commit -m "feat: add Health Hub / Doctors screen for React web"
```

---

### Task 26: Create Pediatrician Report + Generated Report screens (React)

**Files:**
- Create: `tinysteps-ai/src/screens/PediatricianReportScreen.tsx`
- Create: `tinysteps-ai/src/screens/GeneratedReportScreen.tsx`

**Step 1: Create both screens matching 14pol and tnjUk designs**

PDF download via `window.open(pdfUrl)`. Share via Web Share API if available, fallback to copy-link.

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/PediatricianReportScreen.tsx tinysteps-ai/src/screens/GeneratedReportScreen.tsx
git commit -m "feat: add Pediatrician Report and Generated Report screens for React web"
```

---

### Task 27: Create Development Insights screen (React)

**Files:**
- Create: `tinysteps-ai/src/screens/DevelopmentInsightsScreen.tsx`

**Step 1: Create matching KfrY2 design with Recharts for trend visualization**

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/DevelopmentInsightsScreen.tsx
git commit -m "feat: add Development Insights screen with Recharts for React web"
```

---

### Task 28: Create WHO Research Evidence screen (React)

**Files:**
- Create: `tinysteps-ai/src/screens/WHOEvidenceScreen.tsx`

**Step 1: Create matching PX6SL design**

Receives context via URL query params: `/who-evidence?context=motor&analysisId=xxx`.

**Step 2: Commit**

```bash
git add tinysteps-ai/src/screens/WHOEvidenceScreen.tsx
git commit -m "feat: add contextual WHO Research Evidence screen for React web"
```

---

### Task 29: Wire React navigation and update routing

**Files:**
- Modify: `tinysteps-ai/src/App.tsx` (or router config)
- Modify: `tinysteps-ai/src/screens/HomeScreen.tsx` (add entry points)

**Step 1: Add routes for all new screens**

```typescript
<Route path="/reports/:childId" element={<PediatricianReportScreen />} />
<Route path="/reports/:childId/:reportId" element={<GeneratedReportScreen />} />
<Route path="/insights/:childId" element={<DevelopmentInsightsScreen />} />
<Route path="/who-evidence" element={<WHOEvidenceScreen />} />
<Route path="/health-hub/:childId" element={<HealthHubScreen />} />
<Route path="/improve/:childId/:domain" element={<ImproveDomainScreen />} />
<Route path="/resources/:childId" element={<ResourcesLibraryScreen />} />
```

**Step 2: Add dashboard entry points**

Add "Health" and "Resources" cards to discover section. Wire development score to reports. Wire domain cards to insights.

**Step 3: Commit**

```bash
git add tinysteps-ai/src/App.tsx tinysteps-ai/src/screens/HomeScreen.tsx
git commit -m "feat: wire all new screens into React web navigation"
```

---

## Phase 5: Integration & Polish

### Task 30: End-to-end testing

**Step 1: Start all services**

```bash
# Terminal 1: MinIO
docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"

# Terminal 2: MongoDB
mongod --dbname tinysteps

# Terminal 3: Backend
cd backend && npm run dev

# Terminal 4: Seed doctors
cd backend && node src/scripts/seedDoctors.js
```

**Step 2: Test the full flow**

1. Create a child profile
2. Run an analysis → verify resources auto-generated
3. Open Resources Library → verify cached resources appear
4. Open Improve Motor Skills → verify filtered resources
5. Open Health Hub → verify recommended doctors appear
6. Open Pediatrician Report → verify analysis summary
7. Generate Report → verify PDF created in MinIO
8. Share Report → verify share tracking
9. Open WHO Evidence from different screens → verify contextual filtering
10. Open Development Insights → verify trend charts with historical data
11. Generate a bedtime story, view it → verify illustrations saved to MinIO
12. View same story again → verify illustrations loaded from MinIO (no regeneration)

### Task 31: Verify bedtime story image fix

1. Generate a new story
2. Open the story (first view) → illustrations generate and save
3. Check MinIO `story-illustrations` bucket → verify images stored
4. Open same story again → verify images load instantly (no Gemini call)
5. Check backend logs → no illustration generation on second view

### Task 32: Verify DB-first architecture

1. Create child in Flutter → verify it exists in MongoDB
2. Run analysis in Flutter → verify Analysis + Resources in MongoDB
3. Kill Flutter app, relaunch → verify all data loads from API
4. Same verification in React web app

### Task 33: Final commit and cleanup

```bash
git add -A
git commit -m "feat: complete full-stack implementation of 8 new screens with MinIO, reports, resources, and doctor recommendations"
```

---

## Navigation Map (Final)

```
App Launch
├── Onboarding → Profile Setup → Home
└── Home (4-tab navigation)
    ├── Tab 0: Dashboard
    │   ├── Development Score → Pediatrician Report
    │   │   ├── Generate Report → Generated Report
    │   │   │   ├── Send to Doctor (share sheet)
    │   │   │   ├── Export PDF (download)
    │   │   │   └── WHO citations → WHO Evidence (context: report)
    │   │   ├── Consult a Doctor → Health Hub
    │   │   └── Schedule Visit → Health Hub
    │   ├── Domain cards → Development Insights
    │   │   ├── Domain card → Improve [Domain]
    │   │   │   └── WHO citations → WHO Evidence (context: domain)
    │   │   └── WHO citations → WHO Evidence (context: insights)
    │   ├── Discover: Health → Health Hub
    │   ├── Discover: Resources → Resources Library
    │   │   ├── Domain card → Improve [Domain]
    │   │   └── Type card → Filtered resource list
    │   ├── Discover: Recipes → Recipes Screen
    │   ├── Discover: Milestones → Milestones Screen
    │   └── Discover: Growth Charts → Growth Charts Screen
    ├── Tab 1: Timeline
    ├── Tab 2: Stories (with persistent illustrations)
    └── Tab 3: Profile
```

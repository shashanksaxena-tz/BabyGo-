# Realistic Seed Data Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a seed script that populates the database with 10 realistic families — complete with children at different ages, developmental analyses, milestone tracking, growth measurements, community interactions, and bedtime stories — all routed through the actual backend API where possible to ensure data consistency.

**Architecture:** A single Node.js seed script (`backend/src/seeds/seedRealisticData.js`) that calls the running backend API (http://localhost:3001) for most data creation, falling back to direct MongoDB insertion only for stories (which require Gemini). The script is idempotent — it checks for existing seed users before re-running.

**Tech Stack:** Node.js, native fetch (Node 18+), MongoDB/Mongoose (direct for stories only)

---

## Prerequisites

- Backend must be running on `http://localhost:3001`
- MongoDB must be accessible
- Milestones must already be seeded (migration 002/004 completed)

---

### Task 1: Create the seed script scaffold with API helper and family definitions

**Files:**
- Create: `backend/src/seeds/seedRealisticData.js`

**Step 1: Create the seed script with HTTP helper and 10 family definitions**

The script needs:
- `apiCall(method, path, body, token)` — wrapper around fetch to `http://localhost:3001/api`
- 10 family objects, each with parent info + child info + usage personality

```javascript
// backend/src/seeds/seedRealisticData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_BASE = process.env.SEED_API_URL || 'http://localhost:3001/api';

async function apiCall(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${method} ${endpoint} failed (${res.status}): ${JSON.stringify(data)}`);
  return data;
}

// ──── FAMILY DEFINITIONS ────
// Each family: parent (email, name, password) + child (name, dob, gender, weight, height, region)
// dateOfBirth computed relative to today so ages stay correct regardless of when script runs

const today = new Date();
function monthsAgo(months) {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const FAMILIES = [
  {
    parent: { name: 'Priya Sharma', email: 'priya@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Aarav', dateOfBirth: monthsAgo(3), gender: 'male', weight: 5.8, height: 60, region: 'searo' },
    personality: 'anxious_tracker', // tracks everything, frequent notes
  },
  {
    parent: { name: 'Meera Reddy', email: 'meera@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Ananya', dateOfBirth: monthsAgo(5), gender: 'female', weight: 6.5, height: 63, region: 'searo' },
    personality: 'casual', // occasional updates
  },
  {
    parent: { name: 'Rahul Patel', email: 'rahul@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Vihaan', dateOfBirth: monthsAgo(9), gender: 'male', weight: 8.2, height: 71, region: 'searo' },
    personality: 'data_driven', // frequent measurements, charts-focused
  },
  {
    parent: { name: 'Sneha Iyer', email: 'sneha@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Diya', dateOfBirth: monthsAgo(12), gender: 'female', weight: 8.9, height: 74, region: 'searo' },
    personality: 'milestone_focused', // first birthday milestone flurry
  },
  {
    parent: { name: 'Amit Gupta', email: 'amit@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Kabir', dateOfBirth: monthsAgo(18), gender: 'male', weight: 10.5, height: 81, region: 'searo' },
    personality: 'active_parent', // motor-skill focus, lots of activities
  },
  {
    parent: { name: 'Neha Joshi', email: 'neha@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Ishani', dateOfBirth: monthsAgo(24), gender: 'female', weight: 11.2, height: 85, region: 'searo' },
    personality: 'language_focused', // language explosion phase
  },
  {
    parent: { name: 'Arjun Nair', email: 'arjun@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Reyansh', dateOfBirth: monthsAgo(30), gender: 'male', weight: 12.8, height: 91, region: 'searo' },
    personality: 'community_active', // lots of posts and comments
  },
  {
    parent: { name: 'Kavya Singh', email: 'kavya@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Anika', dateOfBirth: monthsAgo(36), gender: 'female', weight: 13.5, height: 95, region: 'searo' },
    personality: 'balanced', // well-rounded tracking
  },
  {
    parent: { name: 'Vikram Das', email: 'vikram@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Arnav', dateOfBirth: monthsAgo(48), gender: 'male', weight: 15.8, height: 103, region: 'searo' },
    personality: 'power_user', // rich history, many analyses
  },
  {
    parent: { name: 'Ritu Banerjee', email: 'ritu@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Myra', dateOfBirth: monthsAgo(56), gender: 'female', weight: 17.2, height: 108, region: 'searo' },
    personality: 'journey_complete', // full developmental journey
  },
];
```

**Step 2: Add the main orchestration function**

```javascript
async function seed() {
  console.log('🌱 Starting realistic data seed...\n');

  const familyContexts = []; // Will hold { token, parentId, childId, family }

  // Phase 1: Register users & create children (via API)
  for (const family of FAMILIES) {
    const ctx = await seedFamily(family);
    familyContexts.push(ctx);
  }

  // Phase 2: Seed milestones for each child (via API)
  await seedAllMilestones(familyContexts);

  // Phase 3: Seed growth measurements (via API)
  await seedAllMeasurements(familyContexts);

  // Phase 4: Seed analyses (via API /analysis/save — Gemini resource gen will fail gracefully)
  await seedAllAnalyses(familyContexts);

  // Phase 5: Seed community posts & interactions (via API)
  await seedCommunityContent(familyContexts);

  // Phase 6: Seed timeline notes & photo entries (via API)
  await seedTimelineNotes(familyContexts);

  // Phase 7: Seed stories (direct DB — requires Gemini otherwise)
  await seedStories(familyContexts);

  console.log('\n✅ Seed complete!');
}
```

**Step 3: Verify scaffold runs**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Script starts, prints "Starting realistic data seed..."

**Step 4: Commit**

```bash
git add backend/src/seeds/seedRealisticData.js
git commit -m "feat: scaffold realistic seed data script with 10 family definitions"
```

---

### Task 2: Implement user registration and child creation via API

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Implement seedFamily()**

```javascript
async function seedFamily(family) {
  const { parent, child } = family;
  let token, userId;

  // Try register, fall back to login if user exists
  try {
    const regRes = await apiCall('POST', '/auth/register', parent);
    token = regRes.token;
    userId = regRes.user?._id || regRes.userId;
    console.log(`  ✅ Registered ${parent.name}`);
  } catch (e) {
    // User likely exists, try login
    const loginRes = await apiCall('POST', '/auth/login', { email: parent.email, password: parent.password });
    token = loginRes.token;
    userId = loginRes.user?._id || loginRes.userId;
    console.log(`  ♻️  ${parent.name} already exists, logged in`);
  }

  // Check if child already exists
  const childrenRes = await apiCall('GET', '/children', null, token);
  let childId;
  const existingChild = childrenRes.children?.find(c => c.name === child.name);

  if (existingChild) {
    childId = existingChild._id;
    console.log(`  ♻️  Child ${child.name} already exists`);
  } else {
    const childRes = await apiCall('POST', '/children', child, token);
    childId = childRes.child._id;
    console.log(`  ✅ Created child ${child.name} (${child.dateOfBirth})`);
  }

  return { token, userId, childId, family };
}
```

**Step 2: Test with backend running**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: 10 users registered, 10 children created. Re-running should show "already exists" messages.

**Step 3: Commit**

```bash
git commit -am "feat: seed user registration and child creation via API"
```

---

### Task 3: Seed age-appropriate milestones via API

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Implement milestone seeding**

The script must:
1. Fetch milestones from `GET /analysis/milestones/:age` for each child's age
2. Mark ~60-80% of age-appropriate milestones as achieved (realistic — not all milestones hit)
3. Use backdated `achievedDate` values that spread across the child's life
4. Each POST to `/children/:childId/milestones/:milestoneId` auto-creates timeline entries

```javascript
async function seedAllMilestones(familyContexts) {
  console.log('\n📊 Seeding milestones...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);

    // Check existing milestones
    const existing = await apiCall('GET', `/children/${childId}/milestones`, null, token);
    if (existing.achievedMilestones?.length > 5) {
      console.log(`  ♻️  ${family.child.name} already has ${existing.achievedMilestones.length} milestones`);
      continue;
    }

    // Fetch milestones for ages up to child's current age
    // Query milestones at the child's age — the endpoint returns current + nearby milestones
    const milestonesRes = await apiCall('GET', `/analysis/milestones/${childAge}?childId=${childId}`, null, token);
    const allMilestones = milestonesRes.milestones || [];

    // Filter to milestones that should be achieved by this age (typicalMonths <= current age)
    const ageAppropriate = allMilestones.filter(m => (m.typicalMonths || m.minMonths) <= childAge);

    // Achieve 60-80% of them (realistic — some kids are ahead, some behind)
    const achieveRate = family.personality === 'milestone_focused' ? 0.85 :
                        family.personality === 'casual' ? 0.60 : 0.72;
    const toAchieve = shuffleArray(ageAppropriate).slice(0, Math.floor(ageAppropriate.length * achieveRate));

    let count = 0;
    for (const milestone of toAchieve) {
      const milestoneId = milestone.id || milestone.uuid || milestone.legacyId;
      // Backdate: achieved around the typicalMonths age (with some variance ±2 months)
      const typicalAge = milestone.typicalMonths || milestone.minMonths || 1;
      const variance = Math.floor(Math.random() * 4) - 2; // -2 to +1 months
      const achievedAgeMonths = Math.max(1, Math.min(childAge, typicalAge + variance));
      const achievedDate = monthsAgoDate(childAge - achievedAgeMonths);

      try {
        await apiCall('POST', `/children/${childId}/milestones/${milestoneId}`, {
          achievedDate: achievedDate.toISOString(),
          confirmedBy: Math.random() > 0.3 ? 'parent' : 'analysis',
          notes: getRandomMilestoneNote(milestone, family.child.name),
        }, token);
        count++;
      } catch (e) {
        // Milestone might already be marked — continue
      }
    }
    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${count} milestones achieved`);
  }
}

function getChildAgeMonths(dob) {
  const d = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function monthsAgoDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  // Add some daily variance
  d.setDate(d.getDate() - Math.floor(Math.random() * 14));
  return d;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Realistic parent notes for milestones
function getRandomMilestoneNote(milestone, childName) {
  const notes = [
    '', '', '', // 30% chance of no note
    `${childName} did this for the first time today!`,
    'Noticed during playtime',
    'Confirmed by pediatrician during checkup',
    `So proud of ${childName}!`,
    'Been practicing this for a few weeks',
    'Happened naturally during play',
    'Was playing with older cousin when this happened',
    'Grandma noticed it first',
    '',
    'Recorded a video of this',
    `${childName} was so happy when they did it`,
    'Need to tell the doctor about this at next visit',
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}
```

**Step 2: Test milestone seeding**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Each child gets age-appropriate milestones marked with backdated dates. Timeline entries auto-created by the API.

**Step 3: Commit**

```bash
git commit -am "feat: seed age-appropriate milestones via API with backdated dates"
```

---

### Task 4: Seed realistic growth measurements over time

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Implement growth measurement seeding**

Growth measurements should follow realistic WHO growth curves. Each POST to `/timeline/measurement` auto-updates child profile weight/height AND creates a timeline entry.

```javascript
// WHO-approximate growth data (50th percentile, simplified)
const GROWTH_CURVES = {
  male: {
    weight: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 10.0, 10.4, 10.7, 11.0, 11.3, 11.5, 12.0, 12.4, 12.7, 12.9, 13.1, 13.3, 13.7, 14.0, 14.3, 14.5, 14.7, 14.9, 15.3, 15.6, 15.9, 16.1, 16.3, 16.5, 16.9, 17.2, 17.5, 17.7, 17.9, 18.1, 18.4, 18.6, 18.8, 19.0, 19.2, 19.4, 19.7, 19.9, 20.1, 20.3, 20.5, 20.7, 20.9, 21.1, 21.3, 21.5, 21.7, 21.9],
    height: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 77.0, 78.7, 80.2, 81.7, 83.0, 84.2, 86.0, 87.5, 88.8, 90.0, 91.2, 92.4, 94.2, 95.8, 97.3, 98.7, 100.0, 101.2, 102.9, 104.4, 105.8, 107.0, 108.2, 109.4, 110.8, 112.0, 113.2, 114.3, 115.4, 116.4, 117.5, 118.5, 119.5, 120.4, 121.3, 122.2, 123.1, 123.9, 124.8, 125.6, 126.4, 127.1, 127.9, 128.6, 129.3, 130.0, 130.7, 131.4],
    head: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3, 44.0, 44.5, 45.0, 45.4, 45.8, 46.1, 46.5, 46.9, 47.2, 47.4, 47.6, 47.8, 48.1, 48.3, 48.5, 48.7, 48.9, 49.0],
  },
  female: {
    weight: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.3, 9.6, 9.9, 10.2, 10.5, 10.8, 11.3, 11.7, 12.0, 12.2, 12.4, 12.6, 13.0, 13.4, 13.7, 14.0, 14.3, 14.5, 14.9, 15.2, 15.5, 15.8, 16.0, 16.2, 16.6, 16.9, 17.2, 17.5, 17.7, 17.9, 18.2, 18.4, 18.6, 18.8, 19.0, 19.2, 19.5, 19.7, 19.9, 20.1, 20.3, 20.5, 20.7, 20.9, 21.1, 21.3, 21.5, 21.7],
    height: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.5, 77.1, 78.5, 80.0, 81.2, 82.3, 84.0, 85.5, 87.0, 88.3, 89.5, 90.7, 92.5, 94.0, 95.4, 96.7, 98.0, 99.1, 100.8, 102.2, 103.5, 104.8, 106.0, 107.2, 108.5, 109.7, 110.9, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 118.9, 119.8, 120.7, 121.6, 122.4, 123.2, 124.0, 124.8, 125.6, 126.3, 127.0, 127.7, 128.4, 129.1],
    head: [33.9, 36.5, 38.3, 39.5, 40.6, 41.5, 42.2, 42.8, 43.4, 43.8, 44.2, 44.6, 44.9, 45.2, 45.6, 45.9, 46.1, 46.2, 46.4, 46.6, 46.8, 47.0, 47.2, 47.3, 47.5],
  },
};

async function seedAllMeasurements(familyContexts) {
  console.log('\n📏 Seeding growth measurements...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);
    const gender = family.child.gender;
    const curves = GROWTH_CURVES[gender === 'other' ? 'female' : gender];

    // Check existing measurements
    const existingMeasurements = await apiCall('GET', `/timeline/measurements/${childId}`, null, token);
    if (existingMeasurements.measurements?.length > 3) {
      console.log(`  ♻️  ${family.child.name} already has ${existingMeasurements.measurements.length} measurements`);
      continue;
    }

    // Determine measurement frequency based on personality
    // Younger kids get measured more often
    const intervals = [];
    if (childAge <= 6) {
      // Monthly for infants
      for (let m = 0; m <= childAge; m++) intervals.push(m);
    } else if (childAge <= 12) {
      // Monthly until 6mo, then every 2 months
      for (let m = 0; m <= 6; m++) intervals.push(m);
      for (let m = 8; m <= childAge; m += 2) intervals.push(m);
    } else if (childAge <= 24) {
      // Monthly until 6mo, every 2mo until 12, then every 3mo
      for (let m = 0; m <= 6; m++) intervals.push(m);
      for (let m = 8; m <= 12; m += 2) intervals.push(m);
      for (let m = 15; m <= childAge; m += 3) intervals.push(m);
    } else {
      // Monthly until 6, every 2 until 12, every 3 until 24, every 6 after
      for (let m = 0; m <= 6; m++) intervals.push(m);
      for (let m = 8; m <= 12; m += 2) intervals.push(m);
      for (let m = 15; m <= 24; m += 3) intervals.push(m);
      for (let m = 30; m <= childAge; m += 6) intervals.push(m);
    }

    let count = 0;
    for (const ageAtMeasurement of intervals) {
      const idx = Math.min(ageAtMeasurement, curves.weight.length - 1);
      // Add realistic variance (±5%)
      const variance = () => 1 + (Math.random() * 0.1 - 0.05);
      const weight = +(curves.weight[idx] * variance()).toFixed(1);
      const height = +(curves.height[idx] * variance()).toFixed(1);
      const headIdx = Math.min(ageAtMeasurement, curves.head.length - 1);
      const headCircumference = ageAtMeasurement < curves.head.length
        ? +(curves.head[headIdx] * variance()).toFixed(1) : undefined;

      const measureDate = monthsAgoDate(childAge - ageAtMeasurement);

      try {
        await apiCall('POST', '/timeline/measurement', {
          childId,
          weight,
          height,
          headCircumference,
          date: measureDate.toISOString(),
          notes: ageAtMeasurement % 6 === 0 ? 'Regular checkup measurement' : '',
        }, token);
        count++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${count} measurements`);
  }
}
```

**Step 2: Test measurement seeding**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Growth measurements created with realistic WHO-curve values. Timeline entries auto-created. Child profile updated with latest weight/height.

**Step 3: Commit**

```bash
git commit -am "feat: seed realistic growth measurements following WHO curves"
```

---

### Task 5: Seed developmental analyses with pre-written realistic content

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Create analysis data generator**

Each analysis needs realistic domain scores, observations, tips. Older children have more analyses showing progression over time. Uses `POST /analysis/save` which auto-creates timeline entries.

```javascript
// Pre-written realistic analysis content per age range
function generateAnalysisData(childAge, gender, childName, analysisNumber, totalAnalyses) {
  // Scores generally improve over time (earlier analyses slightly lower)
  const progression = analysisNumber / totalAnalyses; // 0 to 1
  const baseScore = 55 + Math.floor(progression * 20) + Math.floor(Math.random() * 10);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Domain-specific scoring with natural variance
  const domainScore = (base) => clamp(base + Math.floor(Math.random() * 15 - 7), 20, 98);

  const motorScore = domainScore(baseScore + (childAge < 12 ? -3 : 2));
  const langScore = domainScore(baseScore + (childAge < 18 ? -5 : 5));
  const cogScore = domainScore(baseScore);
  const socialScore = domainScore(baseScore + 3);

  const statusFor = (score) =>
    score >= 80 ? 'ahead' : score >= 65 ? 'on_track' : score >= 50 ? 'on_track_with_monitoring' : score >= 35 ? 'emerging' : 'needs_support';

  const OBSERVATIONS = {
    motor: {
      infant: ['Shows good head control during tummy time', 'Reaching for objects with both hands', 'Starting to roll from tummy to back', 'Grasps rattle when placed in hand'],
      baby: ['Sitting without support for extended periods', 'Crawling confidently across the room', 'Pulling to stand using furniture', 'Transferring objects between hands smoothly', 'Beginning to use pincer grasp'],
      toddler: ['Walking independently with good balance', 'Starting to run with wide stance', 'Climbing on furniture and playground equipment', 'Stacking 3-4 blocks', 'Using spoon with increasing accuracy', 'Scribbling with crayons'],
      preschool: ['Running and jumping with coordination', 'Pedaling a tricycle', 'Drawing recognizable shapes', 'Cutting with scissors along a line', 'Catching a bounced ball', 'Buttoning and unbuttoning clothes'],
      older: ['Hopping on one foot', 'Writing some letters', 'Tying shoelaces with minimal help', 'Riding balance bike confidently', 'Drawing people with body parts'],
    },
    language: {
      infant: ['Cooing and making vowel sounds', 'Responding to familiar voices', 'Turning toward sounds', 'Making different cries for different needs'],
      baby: ['Babbling with consonant sounds (ba-ba, da-da)', 'Responding to own name consistently', 'Understanding "no" and simple instructions', 'Pointing to indicate wants', 'First words emerging'],
      toddler: ['Vocabulary of 50+ words', 'Combining two words together', 'Following two-step instructions', 'Naming familiar objects', 'Starting to use pronouns', 'Enjoys being read to'],
      preschool: ['Speaking in 3-4 word sentences', 'Asking "why" questions frequently', 'Telling simple stories', 'Understanding prepositions (in, on, under)', 'Vocabulary growing rapidly', 'Using past tense'],
      older: ['Speaking in complete sentences', 'Retelling stories with details', 'Understanding complex instructions', 'Beginning to recognize written words', 'Engaging in back-and-forth conversations'],
    },
    cognitive: {
      infant: ['Tracking moving objects with eyes', 'Showing interest in faces', 'Beginning to explore cause and effect', 'Recognizing familiar people'],
      baby: ['Object permanence developing', 'Exploring objects by banging and mouthing', 'Imitating simple actions', 'Showing curiosity about how things work', 'Simple problem solving (pulling cloth to get toy)'],
      toddler: ['Sorting shapes and colors', 'Engaging in pretend play', 'Understanding "same" and "different"', 'Completing simple puzzles (3-4 pieces)', 'Following simple routines'],
      preschool: ['Counting to 10', 'Identifying some colors and shapes', 'Understanding concept of time (morning, night)', 'Building elaborate pretend play scenarios', 'Asking many questions about the world'],
      older: ['Counting to 20+', 'Understanding basic addition', 'Drawing pictures that tell a story', 'Sorting objects by multiple properties', 'Planning and completing multi-step tasks'],
    },
    social: {
      infant: ['Social smiling at caregivers', 'Enjoying being held and comforted', 'Beginning to show stranger awareness', 'Calming with familiar routines'],
      baby: ['Waving bye-bye', 'Playing peek-a-boo', 'Showing separation anxiety (healthy attachment)', 'Imitating facial expressions', 'Enjoying social games'],
      toddler: ['Parallel play alongside other children', 'Showing empathy when others are upset', 'Beginning to share with prompting', 'Asserting independence ("me do it!")', 'Showing a range of emotions'],
      preschool: ['Cooperative play with peers', 'Taking turns with support', 'Expressing emotions verbally', 'Showing preference for certain friends', 'Understanding basic rules of games'],
      older: ['Engaging in complex cooperative play', 'Resolving simple conflicts with words', 'Showing concern for others feelings', 'Following game rules independently', 'Developing close friendships'],
    },
  };

  const TIPS = {
    infant: [
      { title: 'Tummy Time Practice', description: 'Increase tummy time to 15-20 minutes daily to strengthen neck and core muscles', category: 'motor' },
      { title: 'Talk and Narrate', description: 'Describe what you are doing throughout the day to boost language exposure', category: 'language' },
      { title: 'Black and White Patterns', description: 'Use high-contrast images to stimulate visual development', category: 'cognitive' },
    ],
    baby: [
      { title: 'Encourage Crawling', description: 'Place favorite toys just out of reach to motivate movement', category: 'motor' },
      { title: 'Read Together Daily', description: 'Point at pictures and name objects to build vocabulary', category: 'language' },
      { title: 'Container Play', description: 'Let baby practice putting objects in and taking them out of containers', category: 'cognitive' },
    ],
    toddler: [
      { title: 'Outdoor Active Play', description: 'At least 30 minutes of active play outdoors for motor development', category: 'motor' },
      { title: 'Expand Words', description: 'When your child says "ball", respond with "Yes, the red ball is bouncing!"', category: 'language' },
      { title: 'Simple Chores', description: 'Let your toddler help with age-appropriate tasks like putting toys away', category: 'social' },
    ],
    preschool: [
      { title: 'Arts and Crafts', description: 'Drawing, cutting, and pasting activities strengthen fine motor skills', category: 'motor' },
      { title: 'Story Retelling', description: 'After reading a book, ask your child to retell the story in their own words', category: 'language' },
      { title: 'Playdates', description: 'Regular social interactions help develop sharing and turn-taking skills', category: 'social' },
    ],
    older: [
      { title: 'Sports Introduction', description: 'Try age-appropriate sports like swimming or t-ball for coordination', category: 'motor' },
      { title: 'Writing Practice', description: 'Encourage letter writing through fun activities like writing to grandparents', category: 'language' },
      { title: 'Board Games', description: 'Simple board games teach counting, strategy, and good sportsmanship', category: 'cognitive' },
    ],
  };

  const ageGroup = childAge < 6 ? 'infant' : childAge < 12 ? 'baby' : childAge < 24 ? 'toddler' : childAge < 42 ? 'preschool' : 'older';

  // Pick 3-4 observations per domain
  const pickObs = (domain) => shuffleArray(OBSERVATIONS[domain][ageGroup] || OBSERVATIONS[domain].preschool).slice(0, 3 + Math.floor(Math.random() * 2));

  const headlines = [
    `${childName} is developing well across all areas`,
    `Good progress observed in ${childName}'s development`,
    `${childName} shows strong development with some areas to watch`,
    `Positive developmental trajectory for ${childName}`,
    `${childName} is hitting key milestones for their age`,
  ];

  return {
    overallScore: clamp(Math.floor((motorScore + langScore + cogScore + socialScore) / 4), 25, 95),
    overallStatus: statusFor(Math.floor((motorScore + langScore + cogScore + socialScore) / 4)),
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    reassurance: `At ${childAge} months, ${childName} is showing healthy development patterns. Continue engaging in age-appropriate activities and maintaining regular check-ups.`,
    motorSkills: {
      score: motorScore,
      status: statusFor(motorScore),
      observations: pickObs('motor'),
      recommendations: ['Continue providing opportunities for active play', 'Introduce age-appropriate fine motor activities'],
    },
    languageSkills: {
      score: langScore,
      status: statusFor(langScore),
      observations: pickObs('language'),
      recommendations: ['Read together daily for at least 15 minutes', 'Engage in conversation, responding to all communication attempts'],
    },
    cognitiveSkills: {
      score: cogScore,
      status: statusFor(cogScore),
      observations: pickObs('cognitive'),
      recommendations: ['Provide puzzles and problem-solving toys', 'Encourage curiosity by answering questions patiently'],
    },
    socialEmotional: {
      score: socialScore,
      status: statusFor(socialScore),
      observations: pickObs('social'),
      recommendations: ['Arrange regular play opportunities with peers', 'Model and name emotions throughout the day'],
    },
    physicalGrowth: {
      weightPercentile: 40 + Math.floor(Math.random() * 30),
      heightPercentile: 35 + Math.floor(Math.random() * 35),
      description: 'Growth measurements are within healthy range for age and gender',
    },
    tips: (TIPS[ageGroup] || TIPS.preschool),
    sources: [
      { title: 'WHO Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards', type: 'guideline' },
      { title: 'CDC Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html', type: 'guideline' },
    ],
    childAgeMonths: childAge,
  };
}

async function seedAllAnalyses(familyContexts) {
  console.log('\n🔬 Seeding analyses...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);

    // Check existing analyses
    try {
      const existingAnalyses = await apiCall('GET', `/analysis/${childId}`, null, token);
      if (existingAnalyses.analyses?.length > 1) {
        console.log(`  ♻️  ${family.child.name} already has ${existingAnalyses.analyses.length} analyses`);
        continue;
      }
    } catch (e) { /* continue */ }

    // Number of analyses based on age and personality
    const numAnalyses = family.personality === 'power_user' ? 6 :
                        family.personality === 'casual' ? 2 :
                        family.personality === 'anxious_tracker' ? 4 :
                        childAge < 6 ? 2 : childAge < 12 ? 3 : childAge < 24 ? 3 : childAge < 36 ? 4 : 5;

    // Space analyses evenly across the child's life (starting from ~2 months old)
    const startAge = Math.min(2, childAge);
    const interval = Math.max(1, Math.floor((childAge - startAge) / numAnalyses));

    let count = 0;
    for (let i = 0; i < numAnalyses; i++) {
      const analysisAge = startAge + (i * interval);
      if (analysisAge > childAge) break;

      const analysisData = generateAnalysisData(
        analysisAge, family.child.gender, family.child.name, i, numAnalyses
      );

      try {
        await apiCall('POST', '/analysis/save', {
          childId,
          analysisData,
        }, token);
        count++;
      } catch (e) {
        console.error(`    ⚠️  Analysis save failed for ${family.child.name}: ${e.message}`);
      }
    }
    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${count} analyses`);
  }
}
```

**Step 2: Test analysis seeding**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Analyses created with realistic scores and observations. Timeline entries auto-created. Gemini resource generation fails silently (no API key needed).

**Step 3: Commit**

```bash
git commit -am "feat: seed realistic developmental analyses with pre-written content"
```

---

### Task 6: Seed community posts and interactions between parents

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Create community content with cross-parent interactions**

```javascript
const COMMUNITY_POSTS = [
  {
    authorIndex: 0, // Priya (anxious new parent)
    title: 'Is 3 months too early to worry about tummy time?',
    content: 'My son Aarav hates tummy time and cries after just a minute. I have been trying different positions and toys but nothing seems to work. Any tips from experienced parents? My pediatrician says not to worry but I cannot help it.',
    category: 'motor-skills',
    comments: [
      { authorIndex: 4, content: 'Totally normal! Kabir was the same way. Try laying him on your chest instead of the floor — it is more comforting and still counts as tummy time.' },
      { authorIndex: 7, content: 'Anika hated it too until we got a tummy time water mat. Game changer! Also, try after a nap when they are in a good mood.' },
      { authorIndex: 3, content: 'Diya did 10 seconds at 3 months and is now crawling at 12 months. They all get there in their own time.' },
    ],
  },
  {
    authorIndex: 2, // Rahul (data-driven dad)
    title: 'How often do you track growth measurements?',
    content: 'I have been measuring Vihaan weekly and charting everything. My wife thinks I am overdoing it. What is a reasonable frequency? I love seeing the growth curves but wondering if monthly would be sufficient.',
    category: 'milestones',
    comments: [
      { authorIndex: 8, content: 'Monthly is plenty! Weekly measurements have too much noise from things like clothing, time of day, etc. Our pediatrician does it every 3 months and that is perfectly fine.' },
      { authorIndex: 5, content: 'I was the same way with Ishani! Now at 24 months I do it monthly. The trends matter more than individual data points.' },
    ],
  },
  {
    authorIndex: 5, // Neha (language-focused)
    title: 'Language explosion at 24 months — our experience',
    content: 'Ishani went from about 30 words to easily 200+ in the last three months. She is now combining words and even making small sentences. For anyone worried about late talkers — reading together every single day made a huge difference for us. We read at least 5 books before bedtime.',
    category: 'language',
    comments: [
      { authorIndex: 0, content: 'This gives me so much hope! Aarav is only 3 months but I have already started reading to him. How early did you start?' },
      { authorIndex: 6, content: 'Same experience with Reyansh! The "word explosion" is real. He went from barely talking to full sentences seemingly overnight around 26 months.' },
      { authorIndex: 9, content: 'Reading is SO important. Myra is now telling us stories. All those bedtime books really paid off.' },
      { authorIndex: 3, content: 'Diya just started saying mama and dada consistently at 12 months. Hoping the explosion comes soon!' },
    ],
  },
  {
    authorIndex: 4, // Amit (active parent)
    title: 'Best outdoor activities for an 18-month-old?',
    content: 'Kabir has so much energy and loves being outside. Looking for ideas beyond just going to the park. He is walking well and starting to run. What activities have worked for your toddlers?',
    category: 'motor-skills',
    comments: [
      { authorIndex: 6, content: 'Sandbox play is amazing for sensory development too. Reyansh loved it at that age. Also, try letting him walk on different surfaces — grass, sand, smooth paths.' },
      { authorIndex: 7, content: 'We got a small slide and climbing frame for the backyard. Anika spent hours on it at 18 months. Great for gross motor skills and confidence.' },
      { authorIndex: 8, content: 'Nature walks with "treasure hunts" — picking up leaves, stones, flowers. Arnav still loves this at 4 years old.' },
    ],
  },
  {
    authorIndex: 3, // Sneha (milestone-focused)
    title: 'First birthday milestones — what to expect?',
    content: 'Diya is turning 1 next week! She is pulling to stand but not walking yet. She says mama and dada but not much else. Is this normal? I see other babies her age already walking and saying more words.',
    category: 'milestones',
    comments: [
      { authorIndex: 9, content: 'Perfectly normal! Myra did not walk until 14 months and she is now the most active kid. Every child has their own timeline.' },
      { authorIndex: 5, content: 'Ishani was exactly the same at 12 months. Focus on what she CAN do rather than comparing. Pulling to stand is a great sign!' },
      { authorIndex: 2, content: 'The research shows walking anywhere from 9 to 18 months is within normal range. Diya sounds like she is right on track.' },
    ],
  },
  {
    authorIndex: 9, // Ritu (journey complete)
    title: 'Lessons learned from tracking development for 4+ years',
    content: 'Myra is almost 5 and starting school soon. Looking back at our developmental journey, here is what I wish I knew earlier: 1) Every child develops differently and that is OK. 2) Consistent routines matter more than any single activity. 3) Your pediatrician is your best resource, not Google. 4) Take photos and videos — you will treasure them.',
    category: 'general',
    comments: [
      { authorIndex: 0, content: 'Thank you for sharing this. As a new parent, I needed to hear point number 3 especially.' },
      { authorIndex: 4, content: 'So true about routines! Kabir thrives on consistency. What was the hardest age for you?' },
      { authorIndex: 9, content: 'The terrible twos were tough but also magical. Myra started showing her personality so strongly around 2.5 years. Would not trade it for anything.' },
    ],
  },
  {
    authorIndex: 6, // Arjun (community active)
    title: 'Managing screen time for a 2.5 year old',
    content: 'Reyansh has started asking for the tablet constantly. We currently limit to 30 minutes of educational content per day but grandparents are more lenient. How do you all handle screen time boundaries, especially with family?',
    category: 'cognitive',
    comments: [
      { authorIndex: 7, content: 'We had the exact same issue with grandparents. We set a family rule: no screens during meals and 30 min max. Once it was a "family rule" it was easier for everyone to follow.' },
      { authorIndex: 8, content: 'We use a visual timer so Arnav can see when screen time is ending. Reduced the meltdowns significantly.' },
      { authorIndex: 1, content: 'Following this thread! Ananya is only 5 months but I know this will be an issue soon. Good to plan ahead.' },
    ],
  },
  {
    authorIndex: 8, // Vikram (power user)
    title: 'How Little Leap analysis helped us identify a speech delay early',
    content: 'I have been using Little Leap to track Arnav since he was about 12 months old. Around 24 months, the analysis consistently flagged language as "emerging" while other domains were "on track." This prompted us to get a speech evaluation. Turns out he had a mild speech delay that responded really well to early intervention. At 4 years old now, he is completely caught up. Early identification was key.',
    category: 'language',
    comments: [
      { authorIndex: 0, content: 'This is exactly why I track everything. Stories like this make me feel validated in being a detail-oriented parent.' },
      { authorIndex: 5, content: 'Early intervention is everything! So glad Arnav is caught up. Ishani had a similar experience with motor skills.' },
      { authorIndex: 6, content: 'This is really helpful to hear. I have been worried about Reyansh pronunciation. Maybe I should get an evaluation too.' },
    ],
  },
  {
    authorIndex: 7, // Kavya (balanced)
    title: 'Favorite bedtime story themes for preschoolers?',
    content: 'Anika loves the bedtime stories feature! Her favorites are the animal and magic themes. We read one every night and she is starting to retell them to her stuffed animals. What themes do your kids love?',
    category: 'general',
    comments: [
      { authorIndex: 8, content: 'Arnav is all about space stories! He now wants to be an astronaut. The personalization makes it so special.' },
      { authorIndex: 6, content: 'Dinosaurs! Reyansh cannot get enough. We must have generated 10 dinosaur stories by now.' },
      { authorIndex: 3, content: 'Diya just started enjoying stories at 12 months. She loves the pictures more than the text right now but still great for bonding.' },
    ],
  },
  {
    authorIndex: 1, // Meera (casual)
    title: 'Sleeping through the night at 5 months?',
    content: 'Ananya has been sleeping through the night for about 2 weeks now. I almost feel guilty saying this because I know so many parents struggle. Is this normal at 5 months or should I be waking her for feeds?',
    category: 'sleep',
    comments: [
      { authorIndex: 2, content: 'If she is gaining weight well and your pediatrician is happy, enjoy it! Vihaan did not sleep through until 11 months.' },
      { authorIndex: 4, content: 'Do NOT wake a sleeping baby! Ha. But seriously, as long as she is growing fine, this is a gift. Enjoy it.' },
      { authorIndex: 0, content: 'Aarav wakes up every 2 hours still at 3 months. Counting down to this blessed milestone!' },
    ],
  },
  {
    authorIndex: 6, // Arjun (community active)
    title: 'Introducing solid foods — our journey so far',
    content: 'We started Reyansh on solids at 6 months. Now at 30 months he eats almost everything we eat. Our approach was baby-led weaning mixed with purees. The mess was real but worth it! Happy to share our progression if anyone is interested.',
    category: 'nutrition',
    comments: [
      { authorIndex: 1, content: 'Yes please share! Ananya is 5 months and we are starting to research. Did you start with rice cereal or vegetables?' },
      { authorIndex: 6, content: 'We started with avocado and banana, then quickly moved to dal rice and khichdi. The recipe suggestions in the app were super helpful for Indian family-friendly options.' },
      { authorIndex: 3, content: 'BLW was terrifying at first but Diya took to it so well. The gagging vs choking distinction was important to learn.' },
    ],
  },
  {
    authorIndex: 2, // Rahul (data-driven)
    title: 'Growth percentiles — when should you worry?',
    content: 'Vihaan has been consistently in the 35th percentile for weight. My mother-in-law keeps saying he is too thin but the doctor says he is fine as long as he is following his own curve. How do you all handle well-meaning but anxiety-inducing family comments about size?',
    category: 'milestones',
    comments: [
      { authorIndex: 9, content: 'Consistency on the curve matters more than the actual percentile number. Myra was 25th percentile and perfectly healthy. Share the WHO charts with family — data helps!' },
      { authorIndex: 7, content: 'We dealt with the same thing. I started saying "the doctor is really happy with her growth" and that usually ends the conversation.' },
      { authorIndex: 8, content: 'The growth charts in the app really helped me show my parents visually that Arnav was tracking well even though he was not the chubbiest baby.' },
    ],
  },
];

async function seedCommunityContent(familyContexts) {
  console.log('\n💬 Seeding community content...');

  // Check if posts already exist
  try {
    const existingPosts = await apiCall('GET', '/community/posts?limit=5');
    if (existingPosts.posts?.length >= 5) {
      console.log(`  ♻️  Community already has ${existingPosts.total || existingPosts.posts.length} posts`);
      return;
    }
  } catch (e) { /* continue */ }

  for (const postData of COMMUNITY_POSTS) {
    const authorCtx = familyContexts[postData.authorIndex];
    try {
      const postRes = await apiCall('POST', '/community/posts', {
        title: postData.title,
        content: postData.content,
        category: postData.category,
      }, authorCtx.token);

      const postId = postRes.post._id;

      // Add comments from other parents
      for (const comment of postData.comments) {
        const commenterCtx = familyContexts[comment.authorIndex];
        try {
          await apiCall('POST', `/community/posts/${postId}/comments`, {
            content: comment.content,
          }, commenterCtx.token);
        } catch (e) { /* skip */ }
      }

      // Add likes from random parents (2-5 likes per post)
      const likerCount = 2 + Math.floor(Math.random() * 4);
      const likers = shuffleArray(familyContexts.filter((_, i) => i !== postData.authorIndex)).slice(0, likerCount);
      for (const liker of likers) {
        try {
          await apiCall('POST', `/community/posts/${postId}/like`, {}, liker.token);
        } catch (e) { /* skip */ }
      }

      console.log(`  ✅ Post: "${postData.title.substring(0, 40)}..." (${postData.comments.length} comments, ${likerCount} likes)`);
    } catch (e) {
      console.error(`  ⚠️  Post failed: ${e.message}`);
    }
  }
}
```

**Step 2: Test community seeding**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: 12 posts with cross-parent comments and likes. Posts span multiple categories.

**Step 3: Commit**

```bash
git commit -am "feat: seed community posts with cross-parent interactions"
```

---

### Task 7: Seed timeline notes and photo entries

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Add personal timeline entries**

These are manual notes/photo entries parents would add — first smile, funny moments, doctor visits, etc.

```javascript
function generateTimelineNotes(childName, childAge, personality) {
  const notes = [];
  const addNote = (ageMonths, title, description, type = 'note') => {
    if (ageMonths <= childAge) {
      notes.push({ ageMonths, title, description, type });
    }
  };

  // Universal notes most parents would add
  addNote(0, `${childName} is here!`, `Welcome to the world, ${childName}! Born healthy and beautiful.`, 'photo');
  if (childAge >= 1) addNote(1, 'First real smile', `${childName} gave us the biggest smile today. Melted our hearts!`, 'note');
  if (childAge >= 2) addNote(2, 'Two month checkup', 'Doctor says everything looks great. Vaccinations went well.', 'note');
  if (childAge >= 3) addNote(3, 'Discovering hands', `${childName} found their hands today and cannot stop staring at them!`, 'photo');
  if (childAge >= 4) addNote(4, 'First laugh!', `The most beautiful sound — ${childName} laughed for the first time!`, 'note');
  if (childAge >= 6) addNote(6, 'Starting solids', `First taste of food today! ${childName} made the funniest face with the banana.`, 'photo');
  if (childAge >= 8) addNote(8, 'First tooth!', `Spotted ${childName}'s first tooth today. That explains the drooling!`, 'note');
  if (childAge >= 10) addNote(10, 'Standing up!', `${childName} pulled to stand for the first time using the coffee table.`, 'photo');
  if (childAge >= 12) addNote(12, 'Happy first birthday!', `One year old today! Time flies. ${childName} smashed the cake beautifully.`, 'photo');
  if (childAge >= 14) addNote(14, 'First steps!', `${childName} took 3 wobbly steps today between mama and papa!`, 'photo');
  if (childAge >= 18) addNote(18, '18-month checkup', 'All milestones on track. Doctor is happy with growth and development.', 'note');
  if (childAge >= 24) addNote(24, 'Two years old!', `Happy 2nd birthday ${childName}! Already such a little person with big opinions.`, 'photo');
  if (childAge >= 30) addNote(30, 'Potty training begins', 'Started potty training this week. Some successes, some accidents. Staying patient!', 'note');
  if (childAge >= 36) addNote(36, 'Three years old!', `${childName} turns 3 today! Party with friends at the park.`, 'photo');
  if (childAge >= 36) addNote(37, 'First playdate alone', `${childName} went to a friend's house for a playdate without us. Cried (we did, not them).`, 'note');
  if (childAge >= 42) addNote(42, 'Starting preschool', `Big day! ${childName}'s first day of preschool. Only a few tears at drop-off.`, 'photo');
  if (childAge >= 48) addNote(48, 'Four years old!', `${childName} is 4! Wanted a dinosaur-themed party. Drew their own invitations.`, 'photo');
  if (childAge >= 54) addNote(54, 'School readiness assessment', 'Teacher says readiness skills are developing well. Reading interest is growing.', 'note');

  // Personality-specific bonus notes
  if (personality === 'anxious_tracker') {
    addNote(1, 'Tracking sleep patterns', 'Started a sleep log. Averaging 14 hours total with 3 naps.', 'note');
    addNote(2, 'Weight gain check', 'Weighed at pharmacy — gaining well. Relief!', 'note');
  }
  if (personality === 'community_active') {
    if (childAge >= 20) addNote(20, 'Playgroup started', 'Joined a local parent-toddler group. Great for socializing!', 'note');
    if (childAge >= 28) addNote(28, 'Park friends', 'We now have a regular park crew of 4 families. Kids love it.', 'note');
  }

  return notes;
}

async function seedTimelineNotes(familyContexts) {
  console.log('\n📝 Seeding timeline notes...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);

    const notes = generateTimelineNotes(family.child.name, childAge, family.personality);
    let count = 0;

    for (const note of notes) {
      const noteDate = monthsAgoDate(childAge - note.ageMonths);
      try {
        await apiCall('POST', '/timeline', {
          childId,
          type: note.type,
          title: note.title,
          description: note.description,
          date: noteDate.toISOString(),
        }, token);
        count++;
      } catch (e) {
        // Skip duplicates or errors
      }
    }
    console.log(`  ✅ ${family.child.name}: ${count} timeline entries`);
  }
}
```

**Step 2: Test timeline notes**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Personal notes and photo entries created with backdated dates for each child.

**Step 3: Commit**

```bash
git commit -am "feat: seed personal timeline notes and photo entries"
```

---

### Task 8: Seed bedtime stories (direct DB insertion)

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`

**Step 1: Add direct MongoDB story insertion + timeline entries**

Stories require Gemini for generation, so we insert directly. Must also manually create timeline entries (normally auto-created by the route).

```javascript
async function seedStories(familyContexts) {
  console.log('\n📖 Seeding stories (direct DB)...');

  // Connect to MongoDB for direct insertion
  await mongoose.connect(process.env.MONGODB_URI);

  const Story = mongoose.model('Story', new mongoose.Schema({}, { strict: false, collection: 'stories' }));
  const TimelineModel = mongoose.model('TimelineSeed', new mongoose.Schema({}, { strict: false, collection: 'timelineentries' }));

  const STORY_THEMES = [
    { id: 'adventure', name: 'Adventure', emoji: '🏔️', colorHex: '#F59E0B' },
    { id: 'animals', name: 'Animals', emoji: '🦁', colorHex: '#10B981' },
    { id: 'space', name: 'Space', emoji: '🚀', colorHex: '#6366F1' },
    { id: 'ocean', name: 'Ocean', emoji: '🌊', colorHex: '#0EA5E9' },
    { id: 'magic', name: 'Magic', emoji: '✨', colorHex: '#A855F7' },
    { id: 'dinosaurs', name: 'Dinosaurs', emoji: '🦕', colorHex: '#84CC16' },
    { id: 'dreams', name: 'Dreams', emoji: '🌙', colorHex: '#8B5CF6' },
    { id: 'friendship', name: 'Friendship', emoji: '🤝', colorHex: '#EC4899' },
  ];

  // Pre-written stories per theme (simplified 3-page stories)
  const STORY_TEMPLATES = {
    adventure: {
      title: (name) => `${name} and the Mountain of Wonders`,
      moral: 'Bravery and curiosity lead to wonderful discoveries',
      pages: (name) => [
        { pageNumber: 1, text: `Once upon a time, ${name} found a glowing map in the garden. It showed a path to the Mountain of Wonders, where the most amazing treasures waited. With a brave heart, ${name} packed a small bag and began the journey.`, illustrationPrompt: `A young child named ${name} finding a glowing treasure map in a sunny garden, whimsical children's book style`, readingTimeSeconds: 30 },
        { pageNumber: 2, text: `Along the way, ${name} crossed a rainbow bridge and befriended a talking blue bird who knew all the shortcuts. Together they climbed higher and higher, past clouds that tasted like cotton candy and trees that hummed lullabies.`, illustrationPrompt: `A child and a blue bird crossing a rainbow bridge in the sky, magical clouds, children's book illustration`, readingTimeSeconds: 30 },
        { pageNumber: 3, text: `At the top, ${name} discovered the greatest treasure was not gold or jewels — it was the beautiful view of home far below, and the wonderful friends made along the way. ${name} smiled and whispered, "The real adventure was the journey." And with that, our little explorer headed home for dinner and dreams.`, illustrationPrompt: `A child on a mountain top at sunset looking at a beautiful view, warm golden light, children's book style`, readingTimeSeconds: 35 },
      ],
    },
    animals: {
      title: (name) => `${name}'s Animal Friends`,
      moral: 'Kindness to all creatures makes the world a better place',
      pages: (name) => [
        { pageNumber: 1, text: `${name} loved visiting the garden where all the animals lived. Today, a tiny rabbit hopped up with worried eyes. "The baby birds have lost their way home," whispered the rabbit. ${name} knew just what to do.`, illustrationPrompt: `A child kneeling in a garden talking to a cute rabbit, surrounded by flowers, children's book illustration`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `With gentle hands, ${name} scooped up each baby bird and followed the mother bird's song through the meadow. The butterfly showed the way, and the ladybug lit the path with her tiny red wings.`, illustrationPrompt: `A child carrying baby birds through a meadow with butterflies and ladybugs, soft pastel colors, children's book`, readingTimeSeconds: 25 },
        { pageNumber: 3, text: `Soon, the baby birds were safe in their nest, singing a thank-you song. All the garden animals gathered around ${name} for a group hug. "You are our best friend," they said. And ${name} fell asleep that night dreaming of all the wonderful animals, knowing tomorrow would bring another adventure.`, illustrationPrompt: `A child surrounded by garden animals — rabbits, birds, butterflies — in a warm group hug, dreamy style`, readingTimeSeconds: 35 },
      ],
    },
    space: {
      title: (name) => `${name}'s Journey to the Stars`,
      moral: 'The universe is full of wonders waiting to be explored',
      pages: (name) => [
        { pageNumber: 1, text: `One starry night, ${name} built a rocket ship from a big cardboard box. To everyone's surprise, it actually flew! Up, up, up through the clouds and into the sparkling darkness of space. The moon waved hello.`, illustrationPrompt: `A child in a cardboard rocket ship flying through space past the moon, whimsical children's book style`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `${name} visited a planet made entirely of bouncy clouds and another where the rivers flowed with chocolate milk. A friendly alien named Zorp invited ${name} to a cosmic dance party with stars twinkling to the beat.`, illustrationPrompt: `A child dancing with a cute alien on a colorful planet, stars twinkling, fun space scene, children's illustration`, readingTimeSeconds: 30 },
        { pageNumber: 3, text: `After the most amazing space adventure, ${name} steered the rocket back home. "I will be back soon," ${name} promised the stars. Tucked into bed, ${name} looked at the night sky through the window and smiled, knowing that friends were twinkling back from far away. Goodnight, little astronaut.`, illustrationPrompt: `A child in bed looking at stars through a window, cozy bedroom, moonlight, peaceful children's book ending`, readingTimeSeconds: 35 },
      ],
    },
    magic: {
      title: (name) => `${name} and the Enchanted Garden`,
      moral: 'Magic is everywhere when you look with wonder',
      pages: (name) => [
        { pageNumber: 1, text: `Behind ${name}'s house was a garden gate that only opened on nights when the moon was full. Tonight was that night! ${name} turned the golden handle and stepped into a world where flowers sang and fireflies wrote messages in the air.`, illustrationPrompt: `A child opening a magical garden gate at night, glowing flowers and fireflies, enchanted atmosphere, children's book`, readingTimeSeconds: 30 },
        { pageNumber: 2, text: `A wise old owl perched on a mushroom handed ${name} a tiny wand made of starlight. "One wish," hooted the owl. ${name} thought carefully. Not toys, not sweets — ${name} wished for the garden to bloom forever so everyone could enjoy its magic.`, illustrationPrompt: `A child holding a glowing starlight wand talking to a wise owl on a mushroom, magical garden, children's illustration`, readingTimeSeconds: 30 },
        { pageNumber: 3, text: `The garden burst into the most beautiful colors anyone had ever seen. Flowers of every kind bloomed, and the magic spread beyond the gate into the whole neighborhood. ${name} smiled, knowing that sharing magic makes it grow. And every full moon, the garden gate would open again for another adventure. Sweet dreams, little one.`, illustrationPrompt: `A magical garden in full bloom with rainbow flowers spreading across a neighborhood, child smiling, dreamy children's book`, readingTimeSeconds: 35 },
      ],
    },
    dinosaurs: {
      title: (name) => `${name} and the Friendly Dinosaur`,
      moral: 'Even the biggest friends can be the gentlest',
      pages: (name) => [
        { pageNumber: 1, text: `${name} was digging in the sandbox when something enormous appeared — a baby dinosaur! A real, actual, very friendly brontosaurus named Stompy. Stompy was lost and looking for home. "I will help you!" said ${name} bravely.`, illustrationPrompt: `A child in a sandbox meeting a cute baby brontosaurus dinosaur, surprised and happy, children's book illustration`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `Together, ${name} and Stompy went on a quest through the neighborhood. Stompy accidentally knocked over the mailbox (oops!) and drank all the water from the kiddie pool (so thirsty!). But everyone loved the gentle giant.`, illustrationPrompt: `A child walking through a neighborhood with a friendly brontosaurus, funny scene with knocked over mailbox, children's book`, readingTimeSeconds: 25 },
        { pageNumber: 3, text: `They found a hidden valley right behind the big hill, where Stompy's dinosaur family was waiting. Stompy gave ${name} the biggest dinosaur hug, which was very, very big indeed. "Visit anytime!" rumbled Stompy. And every night, ${name} dreamed of dinosaur adventures, knowing the best friends come in all sizes. Goodnight, little explorer.`, illustrationPrompt: `A child hugging a baby dinosaur in a beautiful hidden valley with more dinosaurs in background, heartwarming scene`, readingTimeSeconds: 35 },
      ],
    },
    dreams: {
      title: (name) => `${name}'s Dreamy Night`,
      moral: 'Beautiful dreams await when you close your eyes',
      pages: (name) => [
        { pageNumber: 1, text: `As ${name}'s eyes grew heavy, the bedroom ceiling turned into a sky full of soft, fluffy clouds. A friendly moon reached down a silver ladder and whispered, "Come up, little dreamer. The Night Garden is waiting."`, illustrationPrompt: `A child's bedroom transforming, ceiling becoming clouds with a smiling moon and silver ladder, dreamy children's illustration`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `In the Night Garden, everything glowed softly. Teddy bears danced with bunny rabbits, and lullabies played from flowers that chimed like tiny bells. ${name} floated on a cloud shaped like a boat, sailing through a sea of stars.`, illustrationPrompt: `A child floating on a cloud boat through a sea of stars, teddy bears and bunnies dancing below, soft glowing nighttime scene`, readingTimeSeconds: 30 },
        { pageNumber: 3, text: `The moon tucked ${name} into the coziest cloud bed and sang the sweetest lullaby. "Sleep well, dear ${name}. Tomorrow is a brand new day full of wonderful things." And with a smile, ${name} drifted into the deepest, happiest sleep, wrapped in starlight and love. Goodnight.`, illustrationPrompt: `A child sleeping peacefully on a cloud bed, moon watching over them, stars and soft light, gentle bedtime illustration`, readingTimeSeconds: 30 },
      ],
    },
    friendship: {
      title: (name) => `${name} Makes a New Friend`,
      moral: 'True friendship starts with a simple hello',
      pages: (name) => [
        { pageNumber: 1, text: `At the park, ${name} noticed a new child sitting alone on the bench, looking a bit shy. ${name} walked over with a big smile and said, "Hi! Want to play?" The new friend's face lit up like sunshine.`, illustrationPrompt: `A confident child approaching a shy child sitting alone on a park bench, warm sunny park scene, children's book`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `They played on the swings, built the tallest sandcastle in the world, and shared apple slices. They discovered they both loved dinosaurs AND space. "We are like the same person!" they giggled.`, illustrationPrompt: `Two children building a sandcastle together in a park, laughing and having fun, bright cheerful children's illustration`, readingTimeSeconds: 25 },
        { pageNumber: 3, text: `When it was time to go home, they promised to play again tomorrow. ${name} waved goodbye feeling warm inside. Making a friend is one of the best things in the whole wide world. And that night, ${name} fell asleep with a happy heart, dreaming about all the adventures they would have together. Goodnight, little friend-maker.`, illustrationPrompt: `Two children waving goodbye at sunset in a park, warm golden light, happy expressions, heartwarming children's book ending`, readingTimeSeconds: 30 },
      ],
    },
    ocean: {
      title: (name) => `${name}'s Underwater Adventure`,
      moral: 'The world beneath the waves is full of wonder',
      pages: (name) => [
        { pageNumber: 1, text: `${name} found a magical seashell on the beach. Holding it to one ear, a tiny voice said, "Come explore with us!" Suddenly, ${name} could breathe underwater and dove into the sparkling ocean.`, illustrationPrompt: `A child on a beach holding a glowing seashell, ocean waves sparkling, magical moment, children's book illustration`, readingTimeSeconds: 25 },
        { pageNumber: 2, text: `Below the waves, ${name} met Coral the seahorse and Bubbles the octopus. They swam through rainbow coral reefs, played hide and seek with the clownfish, and rode on the back of a gentle sea turtle.`, illustrationPrompt: `A child swimming underwater with a seahorse and octopus, colorful coral reef, tropical fish, children's ocean illustration`, readingTimeSeconds: 30 },
        { pageNumber: 3, text: `The ocean friends gave ${name} a pearl necklace to remember them by. "Visit us whenever you find a seashell," they said. Back on the beach, ${name} held the pearl close and smiled. The ocean has the best secrets. And tonight, ${name} will dream of waves and wonderful friends beneath the sea. Sleep tight, little diver.`, illustrationPrompt: `A child back on the beach at sunset holding a pearl, ocean waves in background, peaceful ending, children's book style`, readingTimeSeconds: 30 },
      ],
    },
  };

  // Assign stories to children based on age (older kids get more stories)
  const STORY_ASSIGNMENTS = [
    { familyIndex: 0, themes: ['dreams'] }, // 3mo — just 1 gentle story
    { familyIndex: 1, themes: ['dreams'] }, // 5mo
    { familyIndex: 2, themes: ['animals', 'dreams'] }, // 9mo
    { familyIndex: 3, themes: ['animals', 'friendship'] }, // 12mo
    { familyIndex: 4, themes: ['dinosaurs', 'animals', 'adventure'] }, // 18mo
    { familyIndex: 5, themes: ['magic', 'animals', 'friendship'] }, // 24mo
    { familyIndex: 6, themes: ['dinosaurs', 'space', 'adventure', 'ocean'] }, // 30mo
    { familyIndex: 7, themes: ['magic', 'animals', 'space', 'friendship'] }, // 36mo
    { familyIndex: 8, themes: ['adventure', 'space', 'dinosaurs', 'magic', 'ocean'] }, // 48mo
    { familyIndex: 9, themes: ['adventure', 'animals', 'space', 'ocean', 'magic', 'friendship'] }, // 56mo
  ];

  for (const assignment of STORY_ASSIGNMENTS) {
    const ctx = familyContexts[assignment.familyIndex];
    const { childId, userId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);
    const childName = family.child.name;

    // Check if stories already seeded
    const existingStories = await Story.countDocuments({ childId });
    if (existingStories > 0) {
      console.log(`  ♻️  ${childName} already has ${existingStories} stories`);
      continue;
    }

    let count = 0;
    for (let i = 0; i < assignment.themes.length; i++) {
      const themeId = assignment.themes[i];
      const theme = STORY_THEMES.find(t => t.id === themeId);
      const template = STORY_TEMPLATES[themeId];

      // Backdate story creation
      const storyAge = Math.max(3, childAge - (assignment.themes.length - i) * 3);
      const createdDate = monthsAgoDate(childAge - storyAge);

      const story = new Story({
        childId,
        userId,
        title: template.title(childName),
        theme: { id: theme.id, name: theme.name, emoji: theme.emoji, colorHex: theme.colorHex },
        isCustom: false,
        pages: template.pages(childName),
        moral: template.moral,
        childAgeAtCreation: storyAge,
        illustrationsGenerated: false,
        isFavorite: Math.random() > 0.6,
        timesRead: Math.floor(Math.random() * 8) + 1,
        createdAt: createdDate,
      });

      await story.save();

      // Create matching timeline entry
      const timelineEntry = new TimelineModel({
        childId,
        userId,
        type: 'story',
        title: `New story: ${template.title(childName)}`,
        description: `A ${theme.name.toLowerCase()}-themed bedtime story was created for ${childName}`,
        date: createdDate,
        data: { storyId: story._id.toString(), theme: themeId },
        createdAt: createdDate,
      });
      await timelineEntry.save();
      count++;
    }
    console.log(`  ✅ ${childName}: ${count} stories`);
  }
}
```

**Step 2: Test story seeding**

Run: `cd backend && node src/seeds/seedRealisticData.js`
Expected: Stories created directly in DB with matching timeline entries. Different children get different themes and counts.

**Step 3: Commit**

```bash
git commit -am "feat: seed bedtime stories with pre-written content via direct DB"
```

---

### Task 9: Add npm script, cleanup handler, and final integration

**Files:**
- Modify: `backend/src/seeds/seedRealisticData.js`
- Modify: `backend/package.json`

**Step 1: Add cleanup and MongoDB disconnect to seed script**

```javascript
// Add at the end of the seed() function, before the closing brace:
  // Disconnect mongoose (only connected for stories)
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

// Add to bottom of file:
seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
```

**Step 2: Add npm script to package.json**

In `backend/package.json`, add to the `"scripts"` section:

```json
"seed:realistic": "node src/seeds/seedRealisticData.js"
```

**Step 3: Test full end-to-end seed**

1. Start backend: `cd backend && npm run dev`
2. In another terminal: `cd backend && npm run seed:realistic`
3. Expected output:

```
🌱 Starting realistic data seed...

  ✅ Registered Priya Sharma
  ✅ Created child Aarav (2026-XX-XX)
  ... (10 families)

📊 Seeding milestones...
  ✅ Aarav (3mo): ~50 milestones achieved
  ✅ Ananya (5mo): ~70 milestones achieved
  ... (progressively more for older kids)

📏 Seeding growth measurements...
  ✅ Aarav (3mo): 4 measurements
  ✅ Myra (56mo): ~18 measurements

🔬 Seeding analyses...
  ✅ Aarav (3mo): 2 analyses
  ✅ Arnav (48mo): 6 analyses

💬 Seeding community content...
  ✅ Post: "Is 3 months too early to worry abo..." (3 comments, 4 likes)
  ... (12 posts)

📝 Seeding timeline notes...
  ✅ Aarav: 5 timeline entries
  ✅ Myra: 18 timeline entries

📖 Seeding stories (direct DB)...
  ✅ Aarav: 1 stories
  ✅ Myra: 6 stories

✅ Seed complete!
```

4. Login to desktop app with `priya@tinysteps.dev` / `Test1234!` and verify data appears
5. Check community tab for posts and interactions
6. Switch between different child profiles to see different data sets

**Step 4: Commit**

```bash
git commit -am "feat: complete realistic seed data script with npm command"
```

---

### Task 10: Run seed, verify in desktop app, and fix any issues

**Step 1: Start backend and run seed**

```bash
cd backend && npm run dev  # in one terminal
cd backend && npm run seed:realistic  # in another
```

**Step 2: Verify in desktop app**

- Login as each parent, verify children appear with correct ages
- Check milestones tab — age-appropriate milestones should show as achieved
- Check growth charts — measurements should form realistic curves
- Check analysis history — multiple analyses with different scores
- Check timeline — mix of analyses, milestones, measurements, notes
- Check stories — appropriate number per child, readable content
- Check community — posts with comments from different parents

**Step 3: Fix any API mismatches or data issues discovered**

Common things to check:
- Date formats accepted by API
- Token expiry during long seed runs
- Field name mismatches between seed data and API expectations
- Community post category enum values match schema

**Step 4: Final commit**

```bash
git commit -am "fix: resolve seed data issues found during verification"
```

---

## Login Credentials

| Parent | Email | Password |
|--------|-------|----------|
| Priya Sharma | priya@tinysteps.dev | Test1234! |
| Meera Reddy | meera@tinysteps.dev | Test1234! |
| Rahul Patel | rahul@tinysteps.dev | Test1234! |
| Sneha Iyer | sneha@tinysteps.dev | Test1234! |
| Amit Gupta | amit@tinysteps.dev | Test1234! |
| Neha Joshi | neha@tinysteps.dev | Test1234! |
| Arjun Nair | arjun@tinysteps.dev | Test1234! |
| Kavya Singh | kavya@tinysteps.dev | Test1234! |
| Vikram Das | vikram@tinysteps.dev | Test1234! |
| Ritu Banerjee | ritu@tinysteps.dev | Test1234! |

All passwords: `Test1234!`

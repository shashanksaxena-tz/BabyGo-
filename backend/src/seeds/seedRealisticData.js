/**
 * Realistic seed data — 10 families with children, milestones, growth
 * measurements, analyses, community posts, timeline notes, and bedtime stories.
 *
 * Uses direct MongoDB/Mongoose writes — no HTTP API calls, no rate limiting.
 *
 * Usage (from within the backend pod or locally with MONGODB_URI set):
 *   node src/seeds/seedRealisticData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── MODELS ──────────────────────────────────────────────────────────────────

import User       from '../models/User.js';
import Child      from '../models/Child.js';
import Milestone  from '../models/Milestone.js';
import Measurement from '../models/Measurement.js';
import Analysis   from '../models/Analysis.js';
import Timeline   from '../models/Timeline.js';
import Post       from '../models/Post.js';
import Comment    from '../models/Comment.js';
import Story      from '../models/Story.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const today = new Date();

function monthsAgoStr(months) {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

function monthsAgoDate(months, jitterDays = 10) {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  d.setDate(d.getDate() - Math.floor(Math.random() * jitterDays));
  return d;
}

function getAgeMonths(dobStr) {
  const dob = new Date(dobStr);
  return (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── FAMILY DEFINITIONS ──────────────────────────────────────────────────────

const FAMILIES = [
  {
    parent: { name: 'Priya Sharma',  email: 'priya@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Aarav',   dateOfBirth: monthsAgoStr(3),  gender: 'male',   weight: 5.8,  height: 60,  region: 'searo' },
    personality: 'anxious_tracker',
  },
  {
    parent: { name: 'Meera Reddy',   email: 'meera@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Ananya',  dateOfBirth: monthsAgoStr(5),  gender: 'female', weight: 6.5,  height: 63,  region: 'searo' },
    personality: 'casual',
  },
  {
    parent: { name: 'Rahul Patel',   email: 'rahul@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Vihaan',  dateOfBirth: monthsAgoStr(9),  gender: 'male',   weight: 8.2,  height: 71,  region: 'searo' },
    personality: 'data_driven',
  },
  {
    parent: { name: 'Sneha Iyer',    email: 'sneha@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Diya',    dateOfBirth: monthsAgoStr(12), gender: 'female', weight: 8.9,  height: 74,  region: 'searo' },
    personality: 'milestone_focused',
  },
  {
    parent: { name: 'Amit Gupta',    email: 'amit@tinysteps.dev',   password: 'Test1234!' },
    child:  { name: 'Kabir',   dateOfBirth: monthsAgoStr(18), gender: 'male',   weight: 10.5, height: 81,  region: 'searo' },
    personality: 'active_parent',
  },
  {
    parent: { name: 'Neha Joshi',    email: 'neha@tinysteps.dev',   password: 'Test1234!' },
    child:  { name: 'Ishani',  dateOfBirth: monthsAgoStr(24), gender: 'female', weight: 11.2, height: 85,  region: 'searo' },
    personality: 'language_focused',
  },
  {
    parent: { name: 'Arjun Nair',    email: 'arjun@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Reyansh', dateOfBirth: monthsAgoStr(30), gender: 'male',   weight: 12.8, height: 91,  region: 'searo' },
    personality: 'community_active',
  },
  {
    parent: { name: 'Kavya Singh',   email: 'kavya@tinysteps.dev',  password: 'Test1234!' },
    child:  { name: 'Anika',   dateOfBirth: monthsAgoStr(36), gender: 'female', weight: 13.5, height: 95,  region: 'searo' },
    personality: 'balanced',
  },
  {
    parent: { name: 'Vikram Das',    email: 'vikram@tinysteps.dev', password: 'Test1234!' },
    child:  { name: 'Arnav',   dateOfBirth: monthsAgoStr(48), gender: 'male',   weight: 15.8, height: 103, region: 'searo' },
    personality: 'power_user',
  },
  {
    parent: { name: 'Ritu Banerjee', email: 'ritu@tinysteps.dev',   password: 'Test1234!' },
    child:  { name: 'Myra',    dateOfBirth: monthsAgoStr(56), gender: 'female', weight: 17.2, height: 108, region: 'searo' },
    personality: 'journey_complete',
  },
];

// ─── PHASE 1: USERS + CHILDREN ───────────────────────────────────────────────

async function seedFamilies() {
  console.log('👨‍👩‍👧 Creating users and children...');
  const contexts = [];

  for (const family of FAMILIES) {
    const { parent, child } = family;

    // Upsert user
    let user = await User.findOne({ email: parent.email.toLowerCase() });
    if (user) {
      console.log(`  ♻️  User exists: ${parent.name}`);
    } else {
      user = new User({ name: parent.name, email: parent.email, password: parent.password });
      await user.save(); // pre-save hook hashes password
      console.log(`  ✅ Created user: ${parent.name}`);
    }

    // Upsert child
    let childDoc = await Child.findOne({ userId: String(user._id), name: child.name });
    if (childDoc) {
      console.log(`  ♻️  Child exists: ${child.name}`);
    } else {
      childDoc = new Child({ ...child, userId: String(user._id) });
      await childDoc.save();
      console.log(`  ✅ Created child: ${child.name} (DOB ${child.dateOfBirth})`);
    }

    contexts.push({ userId: String(user._id), userName: parent.name, childId: String(childDoc._id), childDoc, family });
  }

  return contexts;
}

// ─── PHASE 2: MILESTONES ─────────────────────────────────────────────────────

function milestoneNote(name) {
  const pool = [
    '', '', '',
    `${name} did this for the first time today!`,
    'Noticed during playtime',
    'Confirmed by pediatrician at checkup',
    `So proud of ${name}!`,
    'Been practicing for a few weeks',
    'Happened naturally during play',
    'Grandma noticed it first',
    'Recorded a video of this',
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function seedMilestones(contexts) {
  console.log('\n📊 Seeding milestones...');

  // Load all milestones from DB once
  const allMilestones = await Milestone.find({ isActive: true }).lean();
  if (allMilestones.length === 0) {
    console.log('  ⚠️  No milestones in DB — skipping (run migrations first)');
    return;
  }

  for (const ctx of contexts) {
    const { childDoc, family } = ctx;
    const childAge = getAgeMonths(family.child.dateOfBirth);

    if (childDoc.achievedMilestones?.length > 5) {
      console.log(`  ♻️  ${family.child.name}: already has ${childDoc.achievedMilestones.length} milestones`);
      continue;
    }

    // Filter to milestones appropriate for this child's age
    const ageAppropriate = allMilestones.filter(m =>
      (m.typicalMonths ?? m.ageRangeStartMonths ?? 0) <= childAge
    );

    const rate = family.personality === 'milestone_focused' ? 0.85
               : family.personality === 'casual'            ? 0.60
               : 0.72;
    const toAchieve = shuffleArray(ageAppropriate).slice(0, Math.floor(ageAppropriate.length * rate));

    const achieved = toAchieve.map(m => {
      const milestoneId = m.uuid || m.legacyId || String(m._id);
      const typicalAge  = m.typicalMonths ?? m.ageRangeStartMonths ?? 1;
      const variance    = Math.floor(Math.random() * 4) - 2;
      const achievedAge = Math.max(1, Math.min(childAge, typicalAge + variance));
      return {
        milestoneId,
        achievedDate: monthsAgoDate(childAge - achievedAge),
        confirmedBy: Math.random() > 0.3 ? 'parent' : 'analysis',
        notes: milestoneNote(family.child.name),
      };
    });

    childDoc.achievedMilestones = achieved;
    await childDoc.save();

    // Timeline entries for milestones (batch insert)
    const timelineEntries = achieved.slice(0, 20).map(a => ({  // cap at 20 to keep timeline clean
      childId: ctx.childId,
      userId: ctx.userId,
      type: 'milestone',
      date: a.achievedDate,
      title: 'Milestone achieved',
      description: a.notes || 'Developmental milestone reached',
      data: { milestoneId: a.milestoneId },
      createdAt: a.achievedDate,
    }));
    if (timelineEntries.length > 0) await Timeline.insertMany(timelineEntries, { ordered: false }).catch(() => {});

    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${achieved.length} milestones`);
  }
}

// ─── PHASE 3: GROWTH MEASUREMENTS ───────────────────────────────────────────

const GROWTH_CURVES = {
  male: {
    weight: [3.3,4.5,5.6,6.4,7.0,7.5,7.9,8.3,8.6,8.9,9.2,9.4,9.6,10.0,10.4,10.7,11.0,11.3,11.5,12.0,12.4,12.7,12.9,13.1,13.3,13.7,14.0,14.3,14.5,14.7,14.9,15.3,15.6,15.9,16.1,16.3,16.5,16.9,17.2,17.5,17.7,17.9,18.1,18.4,18.6,18.8,19.0,19.2,19.4,19.7,19.9,20.1,20.3,20.5,20.7,20.9,21.1,21.3,21.5,21.7,21.9],
    height: [49.9,54.7,58.4,61.4,63.9,65.9,67.6,69.2,70.6,72.0,73.3,74.5,75.7,77.0,78.7,80.2,81.7,83.0,84.2,86.0,87.5,88.8,90.0,91.2,92.4,94.2,95.8,97.3,98.7,100.0,101.2,102.9,104.4,105.8,107.0,108.2,109.4,110.8,112.0,113.2,114.3,115.4,116.4,117.5,118.5,119.5,120.4,121.3,122.2,123.1,123.9,124.8,125.6,126.4,127.1,127.9,128.6,129.3,130.0,130.7,131.4],
    head: [34.5,37.3,39.1,40.5,41.6,42.6,43.3,44.0,44.5,45.0,45.4,45.8,46.1,46.5,46.9,47.2,47.4,47.6,47.8,48.1,48.3,48.5,48.7,48.9,49.0],
  },
  female: {
    weight: [3.2,4.2,5.1,5.8,6.4,6.9,7.3,7.6,7.9,8.2,8.5,8.7,8.9,9.3,9.6,9.9,10.2,10.5,10.8,11.3,11.7,12.0,12.2,12.4,12.6,13.0,13.4,13.7,14.0,14.3,14.5,14.9,15.2,15.5,15.8,16.0,16.2,16.6,16.9,17.2,17.5,17.7,17.9,18.2,18.4,18.6,18.8,19.0,19.2,19.5,19.7,19.9,20.1,20.3,20.5,20.7,20.9,21.1,21.3,21.5,21.7],
    height: [49.1,53.7,57.1,59.8,62.1,64.0,65.7,67.3,68.7,70.1,71.5,72.8,74.0,75.5,77.1,78.5,80.0,81.2,82.3,84.0,85.5,87.0,88.3,89.5,90.7,92.5,94.0,95.4,96.7,98.0,99.1,100.8,102.2,103.5,104.8,106.0,107.2,108.5,109.7,110.9,112.0,113.0,114.0,115.0,116.0,117.0,118.0,118.9,119.8,120.7,121.6,122.4,123.2,124.0,124.8,125.6,126.3,127.0,127.7,128.4,129.1],
    head: [33.9,36.5,38.3,39.5,40.6,41.5,42.2,42.8,43.4,43.8,44.2,44.6,44.9,45.2,45.6,45.9,46.1,46.2,46.4,46.6,46.8,47.0,47.2,47.3,47.5],
  },
};

function buildMeasurementIntervals(ageMonths) {
  const intervals = [];
  if (ageMonths <= 6) {
    for (let m = 0; m <= ageMonths; m++) intervals.push(m);
  } else if (ageMonths <= 12) {
    for (let m = 0; m <= 6; m++) intervals.push(m);
    for (let m = 8; m <= ageMonths; m += 2) intervals.push(m);
  } else if (ageMonths <= 24) {
    for (let m = 0; m <= 6; m++) intervals.push(m);
    for (let m = 8; m <= 12; m += 2) intervals.push(m);
    for (let m = 15; m <= ageMonths; m += 3) intervals.push(m);
  } else {
    for (let m = 0; m <= 6; m++) intervals.push(m);
    for (let m = 8; m <= 12; m += 2) intervals.push(m);
    for (let m = 15; m <= 24; m += 3) intervals.push(m);
    for (let m = 30; m <= ageMonths; m += 6) intervals.push(m);
  }
  return intervals;
}

async function seedMeasurements(contexts) {
  console.log('\n📏 Seeding growth measurements...');
  for (const ctx of contexts) {
    const { childId, userId, childDoc, family } = ctx;
    const childAge = getAgeMonths(family.child.dateOfBirth);
    const existing = await Measurement.countDocuments({ childId });
    if (existing > 3) { console.log(`  ♻️  ${family.child.name}: ${existing} measurements already`); continue; }

    const gender = family.child.gender === 'other' ? 'female' : family.child.gender;
    const curves = GROWTH_CURVES[gender];
    const intervals = buildMeasurementIntervals(childAge);
    const vary = () => 1 + (Math.random() * 0.1 - 0.05);

    const measurements = intervals.map(ageAt => {
      const idx    = Math.min(ageAt, curves.weight.length - 1);
      const hIdx   = Math.min(ageAt, curves.head.length - 1);
      const date   = monthsAgoDate(childAge - ageAt);
      return {
        childId, userId,
        date,
        weight: +(curves.weight[idx] * vary()).toFixed(1),
        height: +(curves.height[idx] * vary()).toFixed(1),
        headCircumference: ageAt < curves.head.length ? +(curves.head[hIdx] * vary()).toFixed(1) : undefined,
        notes: ageAt % 6 === 0 ? 'Regular checkup measurement' : '',
      };
    });

    await Measurement.insertMany(measurements, { ordered: false });

    // Update child's latest measurements
    const latest = measurements[measurements.length - 1];
    childDoc.weight = latest.weight;
    childDoc.height = latest.height;
    if (latest.headCircumference) childDoc.headCircumference = latest.headCircumference;
    await childDoc.save();

    // Timeline entries for every 6-month measurement
    const checkupEntries = measurements
      .filter((_, i) => intervals[i] % 6 === 0)
      .map(m => ({
        childId, userId,
        type: 'measurement',
        date: m.date,
        title: 'Growth measurement recorded',
        description: `Weight: ${m.weight}kg, Height: ${m.height}cm`,
        data: { weight: m.weight, height: m.height },
        createdAt: m.date,
      }));
    if (checkupEntries.length > 0) await Timeline.insertMany(checkupEntries, { ordered: false }).catch(() => {});

    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${measurements.length} measurements`);
  }
}

// ─── PHASE 4: ANALYSES ───────────────────────────────────────────────────────

const OBS = {
  motor: {
    infant:    ['Shows good head control during tummy time', 'Reaching for objects with both hands', 'Starting to roll from tummy to back'],
    baby:      ['Sitting without support', 'Crawling confidently', 'Pulling to stand', 'Pincer grasp emerging'],
    toddler:   ['Walking independently', 'Starting to run', 'Stacking 4+ blocks', 'Using spoon with accuracy'],
    preschool: ['Running and jumping with coordination', 'Drawing recognizable shapes', 'Cutting with scissors'],
    older:     ['Hopping on one foot', 'Writing letters', 'Riding balance bike confidently'],
  },
  language: {
    infant:    ['Cooing and making vowel sounds', 'Responding to familiar voices', 'Turning toward sounds'],
    baby:      ['Babbling with consonant sounds', 'Responding to own name', 'First words emerging', 'Pointing to indicate wants'],
    toddler:   ['Vocabulary of 50+ words', 'Combining two words', 'Following two-step instructions'],
    preschool: ['Speaking in 3-4 word sentences', 'Asking "why" questions frequently', 'Using past tense'],
    older:     ['Complete sentences', 'Retelling stories with details', 'Beginning to read simple words'],
  },
  cognitive: {
    infant:    ['Tracking moving objects', 'Interest in faces', 'Exploring cause and effect'],
    baby:      ['Object permanence developing', 'Imitating simple actions', 'Simple problem solving'],
    toddler:   ['Sorting shapes and colors', 'Engaging in pretend play', 'Completing simple puzzles'],
    preschool: ['Counting to 10', 'Understanding time concepts', 'Elaborate pretend play'],
    older:     ['Counting to 20+', 'Basic addition', 'Planning multi-step tasks'],
  },
  social: {
    infant:    ['Social smiling', 'Enjoying being held', 'Beginning stranger awareness'],
    baby:      ['Waving bye-bye', 'Playing peek-a-boo', 'Separation anxiety (healthy)'],
    toddler:   ['Parallel play', 'Showing empathy', 'Beginning to share'],
    preschool: ['Cooperative play', 'Taking turns', 'Expressing emotions verbally'],
    older:     ['Complex cooperative play', 'Resolving conflicts with words', 'Close friendships'],
  },
};

const TIPS_BY_AGE = {
  infant:    [{title:'Tummy Time',description:'15-20 mins daily for neck and core strength',category:'motor'},{title:'Talk Constantly',description:'Narrate your day to boost language exposure',category:'language'},{title:'High-contrast visuals',description:'Black and white patterns stimulate vision',category:'cognitive'}],
  baby:      [{title:'Encourage Crawling',description:'Place toys just out of reach to motivate movement',category:'motor'},{title:'Read Together',description:'Point at pictures and name objects',category:'language'},{title:'Container Play',description:'In/out of containers builds cognitive development',category:'cognitive'}],
  toddler:   [{title:'Active Outdoor Play',description:'30 minutes outdoors daily for motor development',category:'motor'},{title:'Expand Words',description:'Respond to "ball" with "the red ball is bouncing!"',category:'language'},{title:'Simple Chores',description:'Age-appropriate tasks build confidence',category:'social'}],
  preschool: [{title:'Arts and Crafts',description:'Drawing and cutting strengthen fine motor skills',category:'motor'},{title:'Story Retelling',description:'Ask child to retell stories for language development',category:'language'},{title:'Playdates',description:'Regular social interactions develop sharing',category:'social'}],
  older:     [{title:'Intro to Sports',description:'Swimming or t-ball for coordination',category:'motor'},{title:'Writing Practice',description:'Letter writing through fun real-world activities',category:'language'},{title:'Board Games',description:'Games teach counting, strategy, sportsmanship',category:'cognitive'}],
};

function makeAnalysis(childId, userId, childAge, childName, num, total, createdAt) {
  const prog  = num / Math.max(total - 1, 1);
  const base  = 55 + Math.floor(prog * 20) + Math.floor(Math.random() * 10);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ds    = (b) => clamp(b + Math.floor(Math.random() * 15 - 7), 20, 98);

  const motor  = ds(base + (childAge < 12 ? -3 : 2));
  const lang   = ds(base + (childAge < 18 ? -5 : 5));
  const cog    = ds(base);
  const social = ds(base + 3);

  const statusFor = (s) => s >= 80 ? 'ahead' : s >= 65 ? 'on_track' : s >= 50 ? 'on_track_with_monitoring' : s >= 35 ? 'emerging' : 'needs_support';
  const ag   = childAge < 6 ? 'infant' : childAge < 12 ? 'baby' : childAge < 24 ? 'toddler' : childAge < 42 ? 'preschool' : 'older';
  const pick = (domain) => shuffleArray(OBS[domain][ag] || OBS[domain].preschool).slice(0, 3);
  const tips = TIPS_BY_AGE[ag] || TIPS_BY_AGE.preschool;

  return {
    childId, userId,
    overallScore: clamp(Math.floor((motor + lang + cog + social) / 4), 25, 95),
    overallStatus: statusFor(Math.floor((motor + lang + cog + social) / 4)),
    summary: `${childName} is developing well across all areas at ${childAge} months.`,
    motorAssessment:    { domain: 'motor',     score: motor,  status: statusFor(motor),  observations: pick('motor'),    strengths: pick('motor').slice(0,2),    areasToSupport: ['Continue active play'],      activities: ['Tummy time','Ball play'] },
    languageAssessment: { domain: 'language',  score: lang,   status: statusFor(lang),   observations: pick('language'), strengths: pick('language').slice(0,2),  areasToSupport: ['Read together daily'],       activities: ['Story time','Naming games'] },
    cognitiveAssessment:{ domain: 'cognitive', score: cog,    status: statusFor(cog),    observations: pick('cognitive'),strengths: pick('cognitive').slice(0,2), areasToSupport: ['Provide puzzles'],           activities: ['Shape sorters','Stacking'] },
    socialAssessment:   { domain: 'social',    score: social, status: statusFor(social), observations: pick('social'),   strengths: pick('social').slice(0,2),    areasToSupport: ['Arrange peer play'],         activities: ['Playdates','Group activities'] },
    growthPercentiles: [
      { metric: 'weight', value: 0, percentile: 40 + Math.floor(Math.random() * 30), interpretation: 'Within healthy range' },
      { metric: 'height', value: 0, percentile: 35 + Math.floor(Math.random() * 35), interpretation: 'Within healthy range' },
    ],
    personalizedTips: tips.map(t => t.title),
    activities: tips.map(t => t.description),
    sources: [{ title: 'WHO Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards', type: 'guideline' }],
    childAgeAtAnalysis: childAge,
    createdAt,
  };
}

async function seedAnalyses(contexts) {
  console.log('\n🔬 Seeding analyses...');
  for (const ctx of contexts) {
    const { childId, userId, family } = ctx;
    const childAge = getAgeMonths(family.child.dateOfBirth);
    const existing = await Analysis.countDocuments({ childId });
    if (existing > 1) { console.log(`  ♻️  ${family.child.name}: ${existing} analyses already`); continue; }

    const total = family.personality === 'power_user'      ? 6
                : family.personality === 'casual'          ? 2
                : family.personality === 'anxious_tracker' ? 4
                : childAge < 6 ? 2 : childAge < 24 ? 3 : childAge < 36 ? 4 : 5;

    const start    = Math.min(2, childAge);
    const interval = Math.max(1, Math.floor((childAge - start) / Math.max(total, 1)));
    const analyses = [];
    const tEntries = [];

    for (let i = 0; i < total; i++) {
      const ageAt = start + i * interval;
      if (ageAt > childAge) break;
      const createdAt = monthsAgoDate(childAge - ageAt);
      const doc = makeAnalysis(childId, userId, ageAt, family.child.name, i, total, createdAt);
      analyses.push(doc);
      tEntries.push({
        childId, userId, type: 'analysis',
        date: createdAt, createdAt,
        title: 'Development Analysis',
        description: doc.summary,
        data: { score: doc.overallScore, status: doc.overallStatus },
      });
    }

    await Analysis.insertMany(analyses, { ordered: false });
    await Timeline.insertMany(tEntries, { ordered: false }).catch(() => {});
    console.log(`  ✅ ${family.child.name} (${childAge}mo): ${analyses.length} analyses`);
  }
}

// ─── PHASE 5: COMMUNITY POSTS ────────────────────────────────────────────────

const POSTS = [
  { ai:0, title:'Is 3 months too early to worry about tummy time?', content:'My son Aarav hates tummy time and cries after just a minute. Any tips?', comments:[{ai:4,c:'Try laying him on your chest — more comforting and still counts.'},{ai:7,c:'A tummy time water mat was a game changer!'},{ai:3,c:'Diya did 10 seconds at 3 months and now crawls at 12. They all get there.'}] },
  { ai:2, title:'How often do you track growth measurements?', content:'I measure Vihaan weekly and chart everything. Wife thinks I am overdoing it — what is reasonable?', comments:[{ai:8,c:'Monthly is plenty! Weekly has too much noise from clothing and time of day.'},{ai:5,c:'Trends matter more than individual data points.'}] },
  { ai:5, title:'Language explosion at 24 months — our experience', content:'Ishani went from 30 words to 200+ in three months. Reading together every day made the biggest difference.', comments:[{ai:0,c:'This gives me hope! I have started reading to Aarav already.'},{ai:6,c:'Same with Reyansh — full sentences overnight around 26 months.'},{ai:9,c:'Myra now tells us stories. All those bedtime books paid off.'}] },
  { ai:4, title:'Best outdoor activities for an 18-month-old?', content:'Kabir has so much energy. He is walking well and starting to run — looking for ideas.', comments:[{ai:6,c:'Sandbox play is great for sensory development too.'},{ai:7,c:'A small slide and climbing frame — Anika spent hours on it.'},{ai:8,c:'Nature walks with treasure hunts — picking leaves and stones.'}] },
  { ai:3, title:'First birthday milestones — what to expect?', content:'Diya is turning 1 next week! Pulling to stand but not walking yet. Is this normal?', comments:[{ai:9,c:'Myra did not walk until 14 months and is the most active kid now.'},{ai:5,c:'Focus on what she CAN do. Pulling to stand is a great sign!'},{ai:2,c:'Walking anywhere from 9-18 months is normal range.'}] },
  { ai:9, title:'Lessons from tracking development for 4+ years', content:'Myra is almost 5. Key lessons: 1) Every child is different. 2) Consistent routines matter. 3) Pediatrician beats Google. 4) Take photos and videos.', comments:[{ai:0,c:'As a new parent I needed to hear point 3 especially.'},{ai:4,c:'So true about routines! What was the hardest age for you?'}] },
  { ai:6, title:'Managing screen time for a 2.5 year old', content:'Reyansh asks for the tablet constantly. We limit to 30 min but grandparents are lenient. How do you handle it?', comments:[{ai:7,c:'Once it was a "family rule" it was easier for grandparents to follow.'},{ai:8,c:'We use a visual timer — reduced meltdowns significantly.'},{ai:1,c:'Following this — Ananya is only 5 months but good to plan ahead.'}] },
  { ai:8, title:'How Little Leap helped us catch a speech delay early', content:'The analysis flagged language as "emerging" while other domains were on track. This prompted an evaluation — mild delay caught early. At 4 he is completely caught up.', comments:[{ai:0,c:'Stories like this validate being a detail-oriented parent.'},{ai:5,c:'Early intervention is everything! So glad Arnav caught up.'}] },
  { ai:7, title:'Favorite bedtime story themes for preschoolers?', content:'Anika loves the bedtime stories feature! She retells them to her stuffed animals. What themes do your kids love?', comments:[{ai:8,c:'Arnav is obsessed with space. He now wants to be an astronaut.'},{ai:6,c:'Dinosaurs! We must have generated 10 dinosaur stories already.'}] },
  { ai:1, title:'Sleeping through the night at 5 months?', content:'Ananya has been sleeping through for 2 weeks. Should I be waking her for feeds or just enjoy it?', comments:[{ai:2,c:'If she is gaining weight well, enjoy it!'},{ai:4,c:'Do NOT wake a sleeping baby! This is a gift.'},{ai:0,c:'Aarav wakes every 2 hours still. Counting down to this milestone!'}] },
  { ai:6, title:'Introducing solid foods — our journey', content:'Started Reyansh at 6 months with baby-led weaning. Now at 30 months he eats almost everything. Happy to share our approach.', comments:[{ai:1,c:'Yes please! Did you start with cereal or vegetables?'},{ai:3,c:'BLW was terrifying at first but Diya took to it so well.'}] },
  { ai:2, title:'Growth percentiles — when should you worry?', content:'Vihaan is consistently 35th percentile. Mother-in-law says too thin but doctor says fine as long as he follows his curve.', comments:[{ai:9,c:'Consistency on the curve matters more than the percentile number.'},{ai:7,c:'I just say "the doctor is really happy" and that ends the conversation.'}] },
];

async function seedCommunity(contexts) {
  console.log('\n💬 Seeding community posts...');
  const existing = await Post.countDocuments();
  if (existing >= 5) { console.log(`  ♻️  Community already has ${existing} posts`); return; }

  for (const postDef of POSTS) {
    const author = contexts[postDef.ai];
    if (!author) continue;

    const post = await new Post({
      userId: author.userId,
      authorName: author.userName,
      title: postDef.title,
      content: postDef.content,
      category: 'general',
      likes: 2 + Math.floor(Math.random() * 5),
      likedBy: shuffleArray(contexts.filter((_, i) => i !== postDef.ai)).slice(0, 3).map(c => c.userId),
      replyCount: postDef.comments.length,
    }).save();

    const comments = postDef.comments.map(cd => {
      const commenter = contexts[cd.ai];
      if (!commenter) return null;
      return { postId: String(post._id), userId: commenter.userId, authorName: commenter.userName, content: cd.c };
    }).filter(Boolean);

    if (comments.length > 0) await Comment.insertMany(comments, { ordered: false });
    console.log(`  ✅ "${postDef.title.substring(0, 50)}..."`);
  }
}

// ─── PHASE 6: TIMELINE NOTES ─────────────────────────────────────────────────

function buildNotes(childId, userId, childName, childAge, personality) {
  const add = (ageAt, type, title, description) =>
    ageAt <= childAge ? { childId, userId, type, title, description, date: monthsAgoDate(childAge - ageAt, 5), createdAt: monthsAgoDate(childAge - ageAt, 5) } : null;

  return [
    add(0,  'note',  `${childName} is here!`,        `Welcome to the world, ${childName}!`),
    add(1,  'note',  'First real smile',              `${childName} gave us the biggest smile today.`),
    add(2,  'note',  'Two month checkup',             'Doctor says everything looks great.'),
    add(3,  'photo', 'Discovering hands',             `${childName} found their hands and cannot stop staring!`),
    add(4,  'note',  'First laugh!',                  `The most beautiful sound — ${childName} laughed!`),
    add(6,  'photo', 'Starting solids',               `First taste of food! ${childName} made the funniest face.`),
    add(8,  'note',  'First tooth!',                  `${childName}'s first tooth! That explains the drooling.`),
    add(10, 'photo', 'Standing up!',                  `${childName} pulled to stand using the coffee table.`),
    add(12, 'photo', 'Happy first birthday!',         `One year old! ${childName} smashed the cake beautifully.`),
    add(14, 'photo', 'First steps!',                  `${childName} took 3 wobbly steps between mama and papa!`),
    add(18, 'note',  '18-month checkup',              'All milestones on track. Doctor happy with growth.'),
    add(24, 'photo', 'Two years old!',                `Happy 2nd birthday ${childName}! Such a little person with big opinions.`),
    add(30, 'note',  'Potty training begins',         'Some successes, some accidents. Staying patient!'),
    add(36, 'photo', 'Three years old!',              `${childName} turns 3! Party at the park.`),
    add(42, 'photo', 'Starting preschool',            `Big day! ${childName}'s first day of preschool.`),
    add(48, 'photo', 'Four years old!',               `${childName} is 4! Dinosaur-themed party.`),
    add(54, 'note',  'School readiness',              'Teacher says readiness skills developing well.'),
    personality === 'anxious_tracker' ? add(1, 'note', 'Tracking sleep', 'Started a sleep log. Averaging 14 hours with 3 naps.') : null,
    personality === 'anxious_tracker' ? add(2, 'note', 'Weight check',   'Weighed at pharmacy — gaining well. Relief!') : null,
    personality === 'community_active' && childAge >= 20 ? add(20, 'note', 'Playgroup started', 'Joined a local parent-toddler group.') : null,
    personality === 'community_active' && childAge >= 28 ? add(28, 'note', 'Park friends',       'Regular park crew of 4 families.') : null,
  ].filter(Boolean);
}

async function seedTimeline(contexts) {
  console.log('\n📝 Seeding timeline notes...');
  for (const ctx of contexts) {
    const { childId, userId, family } = ctx;
    const childAge = getAgeMonths(family.child.dateOfBirth);
    const notes = buildNotes(childId, userId, family.child.name, childAge, family.personality);
    await Timeline.insertMany(notes, { ordered: false }).catch(() => {});
    console.log(`  ✅ ${family.child.name}: ${notes.length} notes`);
  }
}

// ─── PHASE 7: BEDTIME STORIES ────────────────────────────────────────────────

const STORY_TEMPLATES = {
  adventure: {
    title: (n) => `${n} and the Mountain of Wonders`,
    moral: 'Bravery and curiosity lead to wonderful discoveries',
    pages: (n) => [
      { pageNumber:1, text:`Once upon a time, ${n} found a glowing map in the garden. It showed a path to the Mountain of Wonders. With a brave heart, ${n} packed a small bag and began the journey.`, readingTimeSeconds:30 },
      { pageNumber:2, text:`Along the way, ${n} crossed a rainbow bridge and befriended a talking blue bird. Together they climbed past clouds that tasted like cotton candy.`, readingTimeSeconds:30 },
      { pageNumber:3, text:`At the top, ${n} discovered the greatest treasure was the beautiful view of home and the wonderful friends made along the way. Goodnight, little explorer.`, readingTimeSeconds:35 },
    ],
  },
  animals: {
    title: (n) => `${n}'s Animal Friends`,
    moral: 'Kindness to all creatures makes the world a better place',
    pages: (n) => [
      { pageNumber:1, text:`${n} loved the garden where all the animals lived. A tiny rabbit hopped up with worried eyes. "The baby birds have lost their way home," it whispered.`, readingTimeSeconds:25 },
      { pageNumber:2, text:`With gentle hands, ${n} scooped up each baby bird and followed the mother bird's song through the meadow, with butterflies lighting the way.`, readingTimeSeconds:25 },
      { pageNumber:3, text:`Soon the baby birds were safe in their nest. All the garden animals gathered for a group hug. "${n} is our best friend," they said.`, readingTimeSeconds:35 },
    ],
  },
  space: {
    title: (n) => `${n}'s Journey to the Stars`,
    moral: 'The universe is full of wonders waiting to be explored',
    pages: (n) => [
      { pageNumber:1, text:`One starry night, ${n} built a rocket ship from a cardboard box. To everyone's surprise, it actually flew! The moon waved hello.`, readingTimeSeconds:25 },
      { pageNumber:2, text:`${n} visited a planet of bouncy clouds and a friendly alien named Zorp who invited ${n} to a cosmic dance party with twinkling stars.`, readingTimeSeconds:30 },
      { pageNumber:3, text:`After the most amazing adventure, ${n} steered home. "I will be back," ${n} promised the stars. Goodnight, little astronaut.`, readingTimeSeconds:35 },
    ],
  },
  magic: {
    title: (n) => `${n} and the Enchanted Garden`,
    moral: 'Magic is everywhere when you look with wonder',
    pages: (n) => [
      { pageNumber:1, text:`Behind ${n}'s house was a garden gate that only opened on full moon nights. ${n} stepped into a world where flowers sang and fireflies wrote messages in the air.`, readingTimeSeconds:30 },
      { pageNumber:2, text:`A wise owl handed ${n} a wand made of starlight. "One wish," hooted the owl. ${n} wished for the garden to bloom forever so everyone could enjoy its magic.`, readingTimeSeconds:30 },
      { pageNumber:3, text:`The garden burst into the most beautiful colors. The magic spread into the whole neighborhood. Sweet dreams, little one.`, readingTimeSeconds:35 },
    ],
  },
  dinosaurs: {
    title: (n) => `${n} and the Friendly Dinosaur`,
    moral: 'Even the biggest friends can be the gentlest',
    pages: (n) => [
      { pageNumber:1, text:`${n} was digging in the sandbox when a baby brontosaurus appeared! Real, friendly — named Stompy. Stompy was lost. "I will help you!" said ${n} bravely.`, readingTimeSeconds:25 },
      { pageNumber:2, text:`Together, ${n} and Stompy went on a quest. Stompy accidentally knocked over the mailbox and drank all the water from the paddling pool. But everyone loved the gentle giant.`, readingTimeSeconds:25 },
      { pageNumber:3, text:`They found a hidden valley where Stompy's family was waiting. Stompy gave ${n} the biggest dinosaur hug ever. "Visit anytime!" rumbled Stompy. Goodnight, little explorer.`, readingTimeSeconds:35 },
    ],
  },
  dreams: {
    title: (n) => `${n}'s Dreamy Night`,
    moral: 'Beautiful dreams await when you close your eyes',
    pages: (n) => [
      { pageNumber:1, text:`As ${n}'s eyes grew heavy, the bedroom ceiling turned into a sky full of fluffy clouds. The moon reached down a silver ladder and whispered, "Come up, little dreamer."`, readingTimeSeconds:25 },
      { pageNumber:2, text:`In the Night Garden, teddy bears danced with bunny rabbits and lullabies played from flowers. ${n} floated on a cloud boat through a sea of stars.`, readingTimeSeconds:30 },
      { pageNumber:3, text:`The moon tucked ${n} into the coziest cloud bed. "Sleep well. Tomorrow is full of wonderful things." And with a smile, ${n} drifted into the happiest sleep. Goodnight.`, readingTimeSeconds:30 },
    ],
  },
  friendship: {
    title: (n) => `${n} Makes a New Friend`,
    moral: 'True friendship starts with a simple hello',
    pages: (n) => [
      { pageNumber:1, text:`At the park, ${n} noticed a new child sitting alone. ${n} walked over with a big smile and said, "Hi! Want to play?" The new friend's face lit up.`, readingTimeSeconds:25 },
      { pageNumber:2, text:`They played on the swings, built the tallest sandcastle in the world, and shared apple slices. "We like the same things!" they giggled.`, readingTimeSeconds:25 },
      { pageNumber:3, text:`When it was time to go home, they promised to play again tomorrow. ${n} felt warm inside. Making a friend is one of the best things in the world. Goodnight.`, readingTimeSeconds:30 },
    ],
  },
  ocean: {
    title: (n) => `${n}'s Underwater Adventure`,
    moral: 'The world beneath the waves is full of wonder',
    pages: (n) => [
      { pageNumber:1, text:`${n} found a magical seashell on the beach. A tiny voice said, "Come explore!" Suddenly ${n} could breathe underwater and dove into the sparkling ocean.`, readingTimeSeconds:25 },
      { pageNumber:2, text:`${n} met Coral the seahorse and Bubbles the octopus. They swam through rainbow coral reefs and played hide-and-seek with clownfish.`, readingTimeSeconds:30 },
      { pageNumber:3, text:`The ocean friends gave ${n} a pearl to remember them by. "Visit whenever you find a seashell." Tonight, ${n} will dream of waves. Sleep tight, little diver.`, readingTimeSeconds:30 },
    ],
  },
};

const THEME_META = {
  adventure:  { name:'Adventure',  emoji:'🏔️', colorHex:'#F59E0B' },
  animals:    { name:'Animals',    emoji:'🦁', colorHex:'#10B981' },
  space:      { name:'Space',      emoji:'🚀', colorHex:'#6366F1' },
  ocean:      { name:'Ocean',      emoji:'🌊', colorHex:'#0EA5E9' },
  magic:      { name:'Magic',      emoji:'✨', colorHex:'#A855F7' },
  dinosaurs:  { name:'Dinosaurs',  emoji:'🦕', colorHex:'#84CC16' },
  dreams:     { name:'Dreams',     emoji:'🌙', colorHex:'#8B5CF6' },
  friendship: { name:'Friendship', emoji:'🤝', colorHex:'#EC4899' },
};

const STORY_ASSIGNMENTS = [
  { fi:0, themes:['dreams'] },
  { fi:1, themes:['dreams'] },
  { fi:2, themes:['animals','dreams'] },
  { fi:3, themes:['animals','friendship'] },
  { fi:4, themes:['dinosaurs','animals','adventure'] },
  { fi:5, themes:['magic','animals','friendship'] },
  { fi:6, themes:['dinosaurs','space','adventure','ocean'] },
  { fi:7, themes:['magic','animals','space','friendship'] },
  { fi:8, themes:['adventure','space','dinosaurs','magic','ocean'] },
  { fi:9, themes:['adventure','animals','space','ocean','magic','friendship'] },
];

async function seedStories(contexts) {
  console.log('\n📖 Seeding stories...');
  const storyDocs   = [];
  const storyTLines = [];

  for (const { fi, themes } of STORY_ASSIGNMENTS) {
    const ctx = contexts[fi];
    if (!ctx) continue;
    const { childId, userId, family } = ctx;
    const childAge  = getAgeMonths(family.child.dateOfBirth);
    const childName = family.child.name;

    const existingCount = await Story.countDocuments({ childId });
    if (existingCount > 0) { console.log(`  ♻️  ${childName}: ${existingCount} stories already`); continue; }

    for (let i = 0; i < themes.length; i++) {
      const themeId   = themes[i];
      const meta      = THEME_META[themeId];
      const tpl       = STORY_TEMPLATES[themeId];
      const storyAge  = Math.max(3, childAge - (themes.length - i) * 3);
      const createdAt = monthsAgoDate(childAge - storyAge);

      const story = new Story({
        childId, userId,
        title: tpl.title(childName),
        theme: { id: themeId, name: meta.name, emoji: meta.emoji, colorHex: meta.colorHex },
        isCustom: false,
        pages: tpl.pages(childName),
        moral: tpl.moral,
        childAgeAtCreation: storyAge,
        illustrationsGenerated: false,
        isFavorite: Math.random() > 0.6,
        timesRead: Math.floor(Math.random() * 8) + 1,
        createdAt,
      });
      await story.save();

      storyTLines.push({
        childId, userId, type: 'story',
        title: `New story: ${tpl.title(childName)}`,
        description: `A ${meta.name.toLowerCase()}-themed bedtime story for ${childName}`,
        date: createdAt, createdAt,
        data: { storyId: String(story._id), theme: themeId },
      });
    }
    console.log(`  ✅ ${childName}: ${themes.length} stories`);
  }

  if (storyTLines.length > 0) await Timeline.insertMany(storyTLines, { ordered: false }).catch(() => {});
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting realistic data seed (direct DB)...\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const contexts = await seedFamilies();
  console.log(`\n   ${contexts.length}/${FAMILIES.length} families ready.\n`);

  await seedMilestones(contexts);
  await seedMeasurements(contexts);
  await seedAnalyses(contexts);
  await seedCommunity(contexts);
  await seedTimeline(contexts);
  await seedStories(contexts);

  await mongoose.disconnect();

  console.log('\n✅ Seed complete!\n');
  console.log('─── Login credentials (password for all: Test1234!) ────────────');
  for (const f of FAMILIES) {
    console.log(`  ${f.parent.email.padEnd(30)} → ${f.child.name} (${getAgeMonths(f.child.dateOfBirth)}mo)`);
  }
  console.log('────────────────────────────────────────────────────────────────');
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});

/**
 * Realistic Seed Data Script
 *
 * Creates 10 families with children at different ages (0-60 months),
 * complete with analyses, milestones, growth measurements, community
 * posts, bedtime stories, and timeline entries.
 *
 * PREREQUISITES:
 * - Backend running on http://localhost:3001
 * - MongoDB accessible (for direct story insertion)
 * - Milestones already seeded (migrations 002/004)
 *
 * USAGE: cd backend && node src/seeds/seedRealisticData.js
 *
 * LOGIN: Any parent email (e.g. priya@tinysteps.dev) with password Test1234!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_BASE = process.env.SEED_API_URL || 'http://localhost:3001/api';

// ──── HTTP HELPER (with rate-limit retry) ────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let requestCount = 0;

async function apiCall(method, endpoint, body = null, token = null, retries = 3) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  // Throttle: small delay every few requests to stay under rate limit
  requestCount++;
  if (requestCount % 10 === 0) await sleep(200);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    if (res.status === 429) {
      const waitMs = Math.min(2000 * (attempt + 1), 10000);
      console.log(`    (rate limited, waiting ${waitMs}ms...)`);
      await sleep(waitMs);
      continue;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(`API ${method} ${endpoint} failed (${res.status}): ${JSON.stringify(data)}`);
    return data;
  }
  throw new Error(`API ${method} ${endpoint} failed after ${retries} retries (429)`);
}

// ──── UTILITY FUNCTIONS ────

const today = new Date();

function monthsAgo(months) {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

function monthsAgoDate(months) {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  d.setDate(d.getDate() - Math.floor(Math.random() * 14));
  return d;
}

function daysAgoDate(days) {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d;
}

function getChildAgeMonths(dob) {
  const d = new Date(dob);
  return (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ──── AVATAR / IMAGE URLS ────

// DiceBear avatars for child profile photos (cartoon style, no real photos needed)
function childAvatarUrl(name, gender) {
  const style = 'adventurer-neutral';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// Placeholder activity images for analysis media (varied, deterministic per seed)
function analysisMediaUrl(seed, width = 400, height = 300) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

// ──── 10 FAMILY DEFINITIONS ────

const FAMILIES = [
  {
    parent: { name: 'Priya Sharma', email: 'priya@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Aarav', dateOfBirth: monthsAgo(3), gender: 'male', weight: 5.8, height: 60, region: 'searo' },
    personality: 'anxious_tracker',
  },
  {
    parent: { name: 'Meera Reddy', email: 'meera@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Ananya', dateOfBirth: monthsAgo(5), gender: 'female', weight: 6.5, height: 63, region: 'searo' },
    personality: 'casual',
  },
  {
    parent: { name: 'Rahul Patel', email: 'rahul@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Vihaan', dateOfBirth: monthsAgo(9), gender: 'male', weight: 8.2, height: 71, region: 'searo' },
    personality: 'data_driven',
  },
  {
    parent: { name: 'Sneha Iyer', email: 'sneha@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Diya', dateOfBirth: monthsAgo(12), gender: 'female', weight: 8.9, height: 74, region: 'searo' },
    personality: 'milestone_focused',
  },
  {
    parent: { name: 'Amit Gupta', email: 'amit@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Kabir', dateOfBirth: monthsAgo(18), gender: 'male', weight: 10.5, height: 81, region: 'searo' },
    personality: 'active_parent',
  },
  {
    parent: { name: 'Neha Joshi', email: 'neha@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Ishani', dateOfBirth: monthsAgo(24), gender: 'female', weight: 11.2, height: 85, region: 'searo' },
    personality: 'language_focused',
  },
  {
    parent: { name: 'Arjun Nair', email: 'arjun@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Reyansh', dateOfBirth: monthsAgo(30), gender: 'male', weight: 12.8, height: 91, region: 'searo' },
    personality: 'community_active',
  },
  {
    parent: { name: 'Kavya Singh', email: 'kavya@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Anika', dateOfBirth: monthsAgo(36), gender: 'female', weight: 13.5, height: 95, region: 'searo' },
    personality: 'balanced',
  },
  {
    parent: { name: 'Vikram Das', email: 'vikram@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Arnav', dateOfBirth: monthsAgo(48), gender: 'male', weight: 15.8, height: 103, region: 'searo' },
    personality: 'power_user',
  },
  {
    parent: { name: 'Ritu Banerjee', email: 'ritu@tinysteps.dev', password: 'Test1234!' },
    child: { name: 'Myra', dateOfBirth: monthsAgo(56), gender: 'female', weight: 17.2, height: 108, region: 'searo' },
    personality: 'journey_complete',
  },
];

// ──── PHASE 1: REGISTER USERS & CREATE CHILDREN ────

async function seedFamily(family) {
  const { parent, child } = family;
  let token, userId;

  try {
    const regRes = await apiCall('POST', '/auth/register', parent);
    token = regRes.token;
    userId = regRes.user?.id || regRes.user?._id;
    console.log(`  + Registered ${parent.name} (${userId})`);
  } catch (e) {
    const loginRes = await apiCall('POST', '/auth/login', { email: parent.email, password: parent.password });
    token = loginRes.token;
    userId = loginRes.user?.id || loginRes.user?._id;
    console.log(`  ~ ${parent.name} already exists, logged in (${userId})`);
  }

  // Check if child exists
  const childrenRes = await apiCall('GET', '/children', null, token);
  let childId;
  const existingChild = childrenRes.children?.find(c => c.name === child.name);

  if (existingChild) {
    childId = existingChild._id;
    console.log(`  ~ Child ${child.name} already exists`);
  } else {
    const childRes = await apiCall('POST', '/children', child, token);
    childId = childRes.child._id;
    console.log(`  + Created child ${child.name}`);
  }

  // Set profile photo URL
  const avatarUrl = childAvatarUrl(child.name, child.gender);
  try {
    await apiCall('PUT', `/children/${childId}`, { profilePhotoUrl: avatarUrl }, token);
  } catch (e) { /* non-critical */ }

  return { token, userId, childId, family };
}

// ──── PHASE 2: MILESTONES ────

function getRandomMilestoneNote(childName) {
  const notes = [
    '', '', '',
    `${childName} did this for the first time today!`,
    'Noticed during playtime',
    'Confirmed by pediatrician during checkup',
    `So proud of ${childName}!`,
    'Been practicing this for a few weeks',
    'Happened naturally during play',
    'Was playing with older cousin when this happened',
    'Grandma noticed it first',
    '', '',
    'Recorded a video of this',
    `${childName} was so happy after`,
  ];
  return pick(notes);
}

async function seedAllMilestones(familyContexts) {
  console.log('\n--- Seeding milestones...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);

    // Check existing
    const existing = await apiCall('GET', `/children/${childId}/milestones`, null, token);
    if (existing.achievedMilestones?.length > 5) {
      console.log(`  ~ ${family.child.name} already has ${existing.achievedMilestones.length} milestones`);
      continue;
    }

    // Fetch milestones from API for this age
    let allMilestones;
    try {
      const milestonesRes = await apiCall('GET', `/analysis/milestones/${childAge}?childId=${childId}`, null, token);
      allMilestones = milestonesRes.milestones || [];
    } catch (e) {
      console.log(`  ! Could not fetch milestones for age ${childAge}: ${e.message}`);
      continue;
    }

    // Filter to milestones that should be achieved by now
    const ageAppropriate = allMilestones.filter(m => (m.typicalMonths || m.minMonths || 0) <= childAge);

    // Achieve 60-85% based on personality
    const achieveRate = family.personality === 'milestone_focused' ? 0.85 :
                        family.personality === 'casual' ? 0.60 : 0.72;
    const toAchieve = shuffleArray(ageAppropriate).slice(0, Math.floor(ageAppropriate.length * achieveRate));

    let count = 0;
    for (const milestone of toAchieve) {
      const milestoneId = milestone.id || milestone.uuid || milestone.legacyId;
      if (!milestoneId) continue;

      const typicalAge = milestone.typicalMonths || milestone.minMonths || 1;
      const variance = Math.floor(Math.random() * 4) - 2;
      const achievedAgeMonths = Math.max(1, Math.min(childAge, typicalAge + variance));
      const achievedDate = monthsAgoDate(childAge - achievedAgeMonths);

      try {
        await apiCall('POST', `/children/${childId}/milestones/${milestoneId}`, {
          achievedDate: achievedDate.toISOString(),
          confirmedBy: Math.random() > 0.3 ? 'parent' : 'analysis',
          notes: getRandomMilestoneNote(family.child.name),
        }, token);
        count++;
      } catch (e) { /* skip duplicates */ }
    }
    console.log(`  + ${family.child.name} (${childAge}mo): ${count} milestones achieved`);
  }
}

// ──── PHASE 3: GROWTH MEASUREMENTS ────

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

async function seedAllMeasurements(familyContexts) {
  console.log('\n--- Seeding growth measurements...');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);
    const gender = family.child.gender === 'other' ? 'female' : family.child.gender;
    const curves = GROWTH_CURVES[gender];

    // Check existing
    try {
      const existing = await apiCall('GET', `/timeline/measurements/${childId}`, null, token);
      if (existing.measurements?.length > 3) {
        console.log(`  ~ ${family.child.name} already has ${existing.measurements.length} measurements`);
        continue;
      }
    } catch (e) { /* continue */ }

    // Build measurement schedule based on age
    const intervals = [];
    for (let m = 0; m <= Math.min(6, childAge); m++) intervals.push(m);
    for (let m = 8; m <= Math.min(12, childAge); m += 2) intervals.push(m);
    for (let m = 15; m <= Math.min(24, childAge); m += 3) intervals.push(m);
    for (let m = 30; m <= childAge; m += 6) intervals.push(m);

    let count = 0;
    for (const ageAt of intervals) {
      const idx = Math.min(ageAt, curves.weight.length - 1);
      const v = () => 1 + (Math.random() * 0.1 - 0.05); // ±5%
      const weight = +(curves.weight[idx] * v()).toFixed(1);
      const height = +(curves.height[idx] * v()).toFixed(1);
      const headIdx = Math.min(ageAt, curves.head.length - 1);
      const headCircumference = ageAt < curves.head.length ? +(curves.head[headIdx] * v()).toFixed(1) : undefined;
      const measureDate = monthsAgoDate(childAge - ageAt);

      try {
        await apiCall('POST', '/timeline/measurement', {
          childId,
          weight,
          height,
          headCircumference,
          date: measureDate.toISOString(),
          notes: ageAt % 6 === 0 ? 'Regular checkup measurement' : '',
        }, token);
        count++;
      } catch (e) { /* skip */ }
    }
    console.log(`  + ${family.child.name} (${childAge}mo): ${count} measurements`);
  }
}

// ──── PHASE 4: ANALYSES ────

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
    baby: ['Object permanence developing', 'Exploring objects by banging and mouthing', 'Imitating simple actions', 'Showing curiosity about how things work', 'Simple problem solving'],
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

const TIPS_BY_AGE = {
  infant: [
    { title: 'Tummy Time Practice', description: 'Increase tummy time to 15-20 minutes daily to strengthen neck and core muscles', category: 'motor' },
    { title: 'Talk and Narrate', description: 'Describe what you are doing throughout the day to boost language exposure', category: 'language' },
    { title: 'High-Contrast Patterns', description: 'Use black and white images to stimulate visual development', category: 'cognitive' },
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

function generateAnalysisData(childAge, gender, childName, analysisNumber, totalAnalyses) {
  const progression = analysisNumber / totalAnalyses;
  const baseScore = 55 + Math.floor(progression * 20) + Math.floor(Math.random() * 10);
  const domainScore = (base) => clamp(base + Math.floor(Math.random() * 15 - 7), 20, 98);

  const motorScore = domainScore(baseScore + (childAge < 12 ? -3 : 2));
  const langScore = domainScore(baseScore + (childAge < 18 ? -5 : 5));
  const cogScore = domainScore(baseScore);
  const socialScore = domainScore(baseScore + 3);

  const statusFor = (score) =>
    score >= 80 ? 'ahead' : score >= 65 ? 'on_track' : score >= 50 ? 'on_track_with_monitoring' : score >= 35 ? 'emerging' : 'needs_support';

  const ageGroup = childAge < 6 ? 'infant' : childAge < 12 ? 'baby' : childAge < 24 ? 'toddler' : childAge < 42 ? 'preschool' : 'older';
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
    headline: pick(headlines),
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
    tips: TIPS_BY_AGE[ageGroup] || TIPS_BY_AGE.preschool,
    sources: [
      { title: 'WHO Child Growth Standards', url: 'https://www.who.int/tools/child-growth-standards', type: 'guideline' },
      { title: 'CDC Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html', type: 'guideline' },
    ],
    childAgeMonths: childAge,
  };
}

async function seedAllAnalyses(familyContexts) {
  console.log('\n--- Seeding analyses...');

  // Connect mongoose for adding mediaFiles after API save
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  const AnalysisModel = mongoose.connection.collection('analyses');

  for (const ctx of familyContexts) {
    const { token, childId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);

    // Check existing
    try {
      const existing = await apiCall('GET', `/analysis/${childId}`, null, token);
      if (existing.analyses?.length > 1) {
        console.log(`  ~ ${family.child.name} already has ${existing.analyses.length} analyses`);
        continue;
      }
    } catch (e) { /* continue */ }

    const numAnalyses = family.personality === 'power_user' ? 6 :
                        family.personality === 'casual' ? 2 :
                        family.personality === 'anxious_tracker' ? 4 :
                        childAge < 6 ? 2 : childAge < 12 ? 3 : childAge < 24 ? 3 : childAge < 36 ? 4 : 5;

    const startAge = Math.min(2, childAge);
    const interval = Math.max(1, Math.floor((childAge - startAge) / numAnalyses));

    let count = 0;
    for (let i = 0; i < numAnalyses; i++) {
      const analysisAge = startAge + (i * interval);
      if (analysisAge > childAge) break;

      const analysisData = generateAnalysisData(analysisAge, family.child.gender, family.child.name, i, numAnalyses);

      try {
        const res = await apiCall('POST', '/analysis/save', { childId, analysisData }, token);
        const analysisId = res.analysis?._id;

        // Add media files directly to the analysis document (API /save doesn't accept media)
        if (analysisId) {
          const mediaCount = 1 + Math.floor(Math.random() * 2); // 1-2 images per analysis
          const mediaFiles = [];
          for (let m = 0; m < mediaCount; m++) {
            mediaFiles.push({
              url: analysisMediaUrl(`${family.child.name}-analysis-${i}-img-${m}`, 640, 480),
              type: 'image',
              filename: `${family.child.name.toLowerCase()}_activity_${analysisAge}mo_${m + 1}.jpg`,
            });
          }
          await AnalysisModel.updateOne(
            { _id: new mongoose.Types.ObjectId(analysisId) },
            { $set: { mediaFiles } }
          );
        }
        count++;
      } catch (e) {
        console.error(`  ! Analysis save failed for ${family.child.name}: ${e.message}`);
      }
    }
    console.log(`  + ${family.child.name} (${childAge}mo): ${count} analyses`);
  }
}

// ──── PHASE 5: COMMUNITY POSTS ────

const COMMUNITY_POSTS = [
  {
    authorIndex: 0,
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
    authorIndex: 2,
    title: 'How often do you track growth measurements?',
    content: 'I have been measuring Vihaan weekly and charting everything. My wife thinks I am overdoing it. What is a reasonable frequency? I love seeing the growth curves but wondering if monthly would be sufficient.',
    category: 'milestones',
    comments: [
      { authorIndex: 8, content: 'Monthly is plenty! Weekly measurements have too much noise from things like clothing, time of day, etc. Our pediatrician does it every 3 months.' },
      { authorIndex: 5, content: 'I was the same way with Ishani! Now at 24 months I do it monthly. The trends matter more than individual data points.' },
    ],
  },
  {
    authorIndex: 5,
    title: 'Language explosion at 24 months — our experience',
    content: 'Ishani went from about 30 words to easily 200+ in the last three months. She is now combining words and even making small sentences. For anyone worried about late talkers — reading together every single day made a huge difference for us.',
    category: 'language',
    comments: [
      { authorIndex: 0, content: 'This gives me so much hope! Aarav is only 3 months but I have already started reading to him. How early did you start?' },
      { authorIndex: 6, content: 'Same experience with Reyansh! The "word explosion" is real. He went from barely talking to full sentences seemingly overnight around 26 months.' },
      { authorIndex: 9, content: 'Reading is SO important. Myra is now telling us stories. All those bedtime books really paid off.' },
      { authorIndex: 3, content: 'Diya just started saying mama and dada consistently at 12 months. Hoping the explosion comes soon!' },
    ],
  },
  {
    authorIndex: 4,
    title: 'Best outdoor activities for an 18-month-old?',
    content: 'Kabir has so much energy and loves being outside. Looking for ideas beyond just going to the park. He is walking well and starting to run. What activities have worked for your toddlers?',
    category: 'motor-skills',
    comments: [
      { authorIndex: 6, content: 'Sandbox play is amazing for sensory development too. Reyansh loved it at that age. Also, try letting him walk on different surfaces — grass, sand, smooth paths.' },
      { authorIndex: 7, content: 'We got a small slide and climbing frame for the backyard. Anika spent hours on it at 18 months. Great for gross motor skills and confidence.' },
      { authorIndex: 8, content: 'Nature walks with "treasure hunts" — picking up leaves, stones, flowers. Arnav still loves this at 4.' },
    ],
  },
  {
    authorIndex: 3,
    title: 'First birthday milestones — what to expect?',
    content: 'Diya is turning 1 next week! She is pulling to stand but not walking yet. She says mama and dada but not much else. Is this normal? I see other babies her age already walking and saying more words.',
    category: 'milestones',
    comments: [
      { authorIndex: 9, content: 'Perfectly normal! Myra did not walk until 14 months and she is now the most active kid. Every child has their own timeline.' },
      { authorIndex: 5, content: 'Ishani was exactly the same at 12 months. Focus on what she CAN do rather than comparing. Pulling to stand is a great sign!' },
      { authorIndex: 2, content: 'The research shows walking anywhere from 9 to 18 months is within normal range. Diya sounds right on track.' },
    ],
  },
  {
    authorIndex: 9,
    title: 'Lessons learned from tracking development for 4+ years',
    content: 'Myra is almost 5 and starting school soon. Looking back at our developmental journey, here is what I wish I knew earlier: 1) Every child develops differently and that is OK. 2) Consistent routines matter more than any single activity. 3) Your pediatrician is your best resource, not Google. 4) Take photos and videos.',
    category: 'general',
    comments: [
      { authorIndex: 0, content: 'Thank you for sharing this. As a new parent, I needed to hear point number 3 especially.' },
      { authorIndex: 4, content: 'So true about routines! Kabir thrives on consistency. What was the hardest age for you?' },
      { authorIndex: 9, content: 'The terrible twos were tough but also magical. Myra started showing her personality so strongly around 2.5 years.' },
    ],
  },
  {
    authorIndex: 6,
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
    authorIndex: 8,
    title: 'How TinySteps analysis helped us identify a speech delay early',
    content: 'I have been using TinySteps to track Arnav since he was about 12 months old. Around 24 months, the analysis consistently flagged language as "emerging" while other domains were "on track." This prompted us to get a speech evaluation. Early identification was key.',
    category: 'language',
    comments: [
      { authorIndex: 0, content: 'This is exactly why I track everything. Stories like this make me feel validated in being a detail-oriented parent.' },
      { authorIndex: 5, content: 'Early intervention is everything! So glad Arnav is caught up. Ishani had a similar experience with motor skills.' },
      { authorIndex: 6, content: 'This is really helpful to hear. I have been worried about Reyansh pronunciation. Maybe I should get an evaluation too.' },
    ],
  },
  {
    authorIndex: 7,
    title: 'Favorite bedtime story themes for preschoolers?',
    content: 'Anika loves the bedtime stories feature! Her favorites are the animal and magic themes. We read one every night and she is starting to retell them to her stuffed animals. What themes do your kids love?',
    category: 'general',
    comments: [
      { authorIndex: 8, content: 'Arnav is all about space stories! He now wants to be an astronaut. The personalization makes it so special.' },
      { authorIndex: 6, content: 'Dinosaurs! Reyansh cannot get enough. We must have generated 10 dinosaur stories by now.' },
      { authorIndex: 3, content: 'Diya just started enjoying stories at 12 months. She loves the pictures more than the text right now.' },
    ],
  },
  {
    authorIndex: 1,
    title: 'Sleeping through the night at 5 months?',
    content: 'Ananya has been sleeping through the night for about 2 weeks now. I almost feel guilty saying this because I know so many parents struggle. Is this normal at 5 months or should I be waking her for feeds?',
    category: 'sleep',
    comments: [
      { authorIndex: 2, content: 'If she is gaining weight well and your pediatrician is happy, enjoy it! Vihaan did not sleep through until 11 months.' },
      { authorIndex: 4, content: 'Do NOT wake a sleeping baby! As long as she is growing fine, this is a gift. Enjoy it.' },
      { authorIndex: 0, content: 'Aarav wakes up every 2 hours still at 3 months. Counting down to this milestone!' },
    ],
  },
  {
    authorIndex: 6,
    title: 'Introducing solid foods — our journey so far',
    content: 'We started Reyansh on solids at 6 months. Now at 30 months he eats almost everything we eat. Our approach was baby-led weaning mixed with purees. The mess was real but worth it!',
    category: 'nutrition',
    comments: [
      { authorIndex: 1, content: 'Would love to hear more! Ananya is 5 months and we are starting to research. Did you start with rice cereal or vegetables?' },
      { authorIndex: 6, content: 'We started with avocado and banana, then quickly moved to dal rice and khichdi. The recipe suggestions in the app were super helpful for Indian family-friendly options.' },
      { authorIndex: 3, content: 'BLW was terrifying at first but Diya took to it so well. The gagging vs choking distinction was important to learn.' },
    ],
  },
  {
    authorIndex: 2,
    title: 'Growth percentiles — when should you worry?',
    content: 'Vihaan has been consistently in the 35th percentile for weight. My mother-in-law keeps saying he is too thin but the doctor says he is fine as long as he follows his own curve. How do you handle well-meaning family comments about size?',
    category: 'milestones',
    comments: [
      { authorIndex: 9, content: 'Consistency on the curve matters more than the actual percentile number. Myra was 25th percentile and perfectly healthy. Share the WHO charts with family!' },
      { authorIndex: 7, content: 'We dealt with the same thing. I started saying "the doctor is really happy with her growth" and that usually ends the conversation.' },
      { authorIndex: 8, content: 'The growth charts in the app really helped me show my parents visually that Arnav was tracking well even though he was not the chubbiest baby.' },
    ],
  },
];

async function seedCommunityContent(familyContexts) {
  console.log('\n--- Seeding community content...');

  try {
    const existing = await apiCall('GET', '/community/posts?limit=1');
    if (existing.posts?.length >= 1 && (existing.total || 0) >= 5) {
      console.log(`  ~ Community already has ${existing.total} posts`);
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

      // Add comments
      for (const comment of postData.comments) {
        const commenterCtx = familyContexts[comment.authorIndex];
        try {
          await apiCall('POST', `/community/posts/${postId}/comments`, { content: comment.content }, commenterCtx.token);
        } catch (e) { /* skip */ }
      }

      // Add likes from random parents
      const likerCount = 2 + Math.floor(Math.random() * 4);
      const likers = shuffleArray(familyContexts.filter((_, i) => i !== postData.authorIndex)).slice(0, likerCount);
      for (const liker of likers) {
        try { await apiCall('POST', `/community/posts/${postId}/like`, {}, liker.token); } catch (e) { /* skip */ }
      }

      console.log(`  + "${postData.title.substring(0, 45)}..." (${postData.comments.length} comments)`);
    } catch (e) {
      console.error(`  ! Post failed: ${e.message}`);
    }
  }
}

// ──── PHASE 6: TIMELINE NOTES ────

function generateTimelineNotes(childName, childAge, personality) {
  const notes = [];
  const add = (age, title, desc, type = 'note') => {
    if (age <= childAge) notes.push({ ageMonths: age, title, description: desc, type });
  };

  add(0, `${childName} is here!`, `Welcome to the world, ${childName}! Born healthy and beautiful.`, 'photo');
  add(1, 'First real smile', `${childName} gave us the biggest smile today. Melted our hearts!`, 'note');
  add(2, 'Two month checkup', 'Doctor says everything looks great. Vaccinations went well.', 'note');
  add(3, 'Discovering hands', `${childName} found their hands today and cannot stop staring at them!`, 'photo');
  add(4, 'First laugh!', `The most beautiful sound — ${childName} laughed for the first time!`, 'note');
  add(6, 'Starting solids', `First taste of food today! ${childName} made the funniest face.`, 'photo');
  add(8, 'First tooth!', `Spotted ${childName}'s first tooth today. That explains the drooling!`, 'note');
  add(10, 'Standing up!', `${childName} pulled to stand for the first time using the coffee table.`, 'photo');
  add(12, 'Happy first birthday!', `One year old today! Time flies. ${childName} smashed the cake.`, 'photo');
  add(14, 'First steps!', `${childName} took 3 wobbly steps today between mama and papa!`, 'photo');
  add(18, '18-month checkup', 'All milestones on track. Doctor is happy with growth and development.', 'note');
  add(24, 'Two years old!', `Happy 2nd birthday ${childName}! Already such a little person with big opinions.`, 'photo');
  add(30, 'Potty training begins', 'Started potty training this week. Some successes, some accidents!', 'note');
  add(36, 'Three years old!', `${childName} turns 3 today! Party with friends at the park.`, 'photo');
  add(37, 'First playdate alone', `${childName} went to a friend's house without us. Cried (we did, not them).`, 'note');
  add(42, 'Starting preschool', `Big day! ${childName}'s first day of preschool. Only a few tears at drop-off.`, 'photo');
  add(48, 'Four years old!', `${childName} is 4! Wanted a dinosaur-themed party.`, 'photo');
  add(54, 'School readiness check', 'Teacher says readiness skills are developing well.', 'note');

  if (personality === 'anxious_tracker') {
    add(1, 'Tracking sleep patterns', 'Started a sleep log. Averaging 14 hours total with 3 naps.', 'note');
    add(2, 'Weight gain check', 'Weighed at pharmacy — gaining well. Relief!', 'note');
  }
  if (personality === 'community_active') {
    add(20, 'Playgroup started', 'Joined a local parent-toddler group. Great for socializing!', 'note');
    add(28, 'Park friends', 'We now have a regular park crew of 4 families. Kids love it.', 'note');
  }

  return notes;
}

async function seedTimelineNotes(familyContexts) {
  console.log('\n--- Seeding timeline notes...');

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
      } catch (e) { /* skip */ }
    }
    console.log(`  + ${family.child.name}: ${count} timeline entries`);
  }
}

// ──── PHASE 7: STORIES (Direct DB) ────

const STORY_THEMES = [
  { id: 'adventure', name: 'Adventure', emoji: '\u{1F3D4}\u{FE0F}', colorHex: '#F59E0B' },
  { id: 'animals', name: 'Animals', emoji: '\u{1F981}', colorHex: '#10B981' },
  { id: 'space', name: 'Space', emoji: '\u{1F680}', colorHex: '#6366F1' },
  { id: 'ocean', name: 'Ocean', emoji: '\u{1F30A}', colorHex: '#0EA5E9' },
  { id: 'magic', name: 'Magic', emoji: '\u2728', colorHex: '#A855F7' },
  { id: 'dinosaurs', name: 'Dinosaurs', emoji: '\u{1F995}', colorHex: '#84CC16' },
  { id: 'dreams', name: 'Dreams', emoji: '\u{1F319}', colorHex: '#8B5CF6' },
  { id: 'friendship', name: 'Friendship', emoji: '\u{1F91D}', colorHex: '#EC4899' },
];

const STORY_TEMPLATES = {
  adventure: {
    title: (n) => `${n} and the Mountain of Wonders`,
    moral: 'Bravery and curiosity lead to wonderful discoveries',
    pages: (n) => [
      { pageNumber: 1, text: `Once upon a time, ${n} found a glowing map in the garden. It showed a path to the Mountain of Wonders, where the most amazing treasures waited. With a brave heart, ${n} packed a small bag and began the journey.`, illustrationPrompt: `A child finding a glowing treasure map in a sunny garden`, readingTimeSeconds: 30 },
      { pageNumber: 2, text: `Along the way, ${n} crossed a rainbow bridge and befriended a talking blue bird who knew all the shortcuts. Together they climbed higher and higher, past clouds that tasted like cotton candy and trees that hummed lullabies.`, illustrationPrompt: `A child and a blue bird crossing a rainbow bridge in the sky`, readingTimeSeconds: 30 },
      { pageNumber: 3, text: `At the top, ${n} discovered the greatest treasure was not gold or jewels — it was the beautiful view of home far below, and the wonderful friends made along the way. ${n} smiled and headed home for dinner and dreams.`, illustrationPrompt: `A child on a mountain top at sunset looking at a beautiful view`, readingTimeSeconds: 35 },
    ],
  },
  animals: {
    title: (n) => `${n}'s Animal Friends`,
    moral: 'Kindness to all creatures makes the world a better place',
    pages: (n) => [
      { pageNumber: 1, text: `${n} loved visiting the garden where all the animals lived. Today, a tiny rabbit hopped up with worried eyes. "The baby birds have lost their way home," whispered the rabbit. ${n} knew just what to do.`, illustrationPrompt: `A child in a garden talking to a cute rabbit`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `With gentle hands, ${n} scooped up each baby bird and followed the mother bird's song through the meadow. The butterfly showed the way, and the ladybug lit the path with her tiny red wings.`, illustrationPrompt: `A child carrying baby birds through a meadow with butterflies`, readingTimeSeconds: 25 },
      { pageNumber: 3, text: `Soon, the baby birds were safe in their nest, singing a thank-you song. All the garden animals gathered around ${n} for a group hug. "You are our best friend," they said. And ${n} fell asleep dreaming of wonderful animals.`, illustrationPrompt: `A child surrounded by garden animals in a warm group hug`, readingTimeSeconds: 35 },
    ],
  },
  space: {
    title: (n) => `${n}'s Journey to the Stars`,
    moral: 'The universe is full of wonders waiting to be explored',
    pages: (n) => [
      { pageNumber: 1, text: `One starry night, ${n} built a rocket ship from a big cardboard box. To everyone's surprise, it actually flew! Up through the clouds and into the sparkling darkness of space. The moon waved hello.`, illustrationPrompt: `A child in a cardboard rocket flying through space past the moon`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `${n} visited a planet made entirely of bouncy clouds and another where the rivers flowed with chocolate milk. A friendly alien named Zorp invited ${n} to a cosmic dance party with stars twinkling to the beat.`, illustrationPrompt: `A child dancing with a cute alien on a colorful planet`, readingTimeSeconds: 30 },
      { pageNumber: 3, text: `After the most amazing space adventure, ${n} steered the rocket back home. "I will be back soon," ${n} promised the stars. Tucked into bed, ${n} looked at the night sky and smiled, knowing friends were twinkling back. Goodnight, little astronaut.`, illustrationPrompt: `A child in bed looking at stars through a window, cozy bedroom`, readingTimeSeconds: 35 },
    ],
  },
  magic: {
    title: (n) => `${n} and the Enchanted Garden`,
    moral: 'Magic is everywhere when you look with wonder',
    pages: (n) => [
      { pageNumber: 1, text: `Behind ${n}'s house was a garden gate that only opened on nights when the moon was full. Tonight was that night! ${n} turned the golden handle and stepped into a world where flowers sang and fireflies wrote messages in the air.`, illustrationPrompt: `A child opening a magical garden gate at night with glowing flowers`, readingTimeSeconds: 30 },
      { pageNumber: 2, text: `A wise old owl handed ${n} a tiny wand made of starlight. "One wish," hooted the owl. ${n} thought carefully. Not toys, not sweets — ${n} wished for the garden to bloom forever so everyone could enjoy its magic.`, illustrationPrompt: `A child holding a glowing wand talking to a wise owl`, readingTimeSeconds: 30 },
      { pageNumber: 3, text: `The garden burst into the most beautiful colors. Flowers of every kind bloomed, and the magic spread beyond the gate into the whole neighborhood. ${n} smiled, knowing that sharing magic makes it grow. Sweet dreams, little one.`, illustrationPrompt: `A magical garden in full bloom with rainbow flowers`, readingTimeSeconds: 35 },
    ],
  },
  dinosaurs: {
    title: (n) => `${n} and the Friendly Dinosaur`,
    moral: 'Even the biggest friends can be the gentlest',
    pages: (n) => [
      { pageNumber: 1, text: `${n} was digging in the sandbox when something enormous appeared — a baby dinosaur! A real, friendly brontosaurus named Stompy. Stompy was lost and looking for home. "I will help you!" said ${n} bravely.`, illustrationPrompt: `A child in a sandbox meeting a cute baby brontosaurus`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `Together, ${n} and Stompy went on a quest through the neighborhood. Stompy accidentally knocked over the mailbox and drank all the water from the kiddie pool. But everyone loved the gentle giant.`, illustrationPrompt: `A child walking with a friendly brontosaurus through a neighborhood`, readingTimeSeconds: 25 },
      { pageNumber: 3, text: `They found a hidden valley where Stompy's dinosaur family was waiting. Stompy gave ${n} the biggest dinosaur hug. "Visit anytime!" rumbled Stompy. And every night, ${n} dreamed of dinosaur adventures. Goodnight, little explorer.`, illustrationPrompt: `A child hugging a baby dinosaur in a beautiful hidden valley`, readingTimeSeconds: 35 },
    ],
  },
  dreams: {
    title: (n) => `${n}'s Dreamy Night`,
    moral: 'Beautiful dreams await when you close your eyes',
    pages: (n) => [
      { pageNumber: 1, text: `As ${n}'s eyes grew heavy, the bedroom ceiling turned into a sky of soft, fluffy clouds. A friendly moon reached down a silver ladder and whispered, "Come up, little dreamer."`, illustrationPrompt: `A child's bedroom ceiling becoming clouds with a smiling moon`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `In the Night Garden, everything glowed softly. Teddy bears danced with bunny rabbits, and lullabies played from flowers that chimed like tiny bells. ${n} floated on a cloud boat, sailing through a sea of stars.`, illustrationPrompt: `A child floating on a cloud boat through a sea of stars`, readingTimeSeconds: 30 },
      { pageNumber: 3, text: `The moon tucked ${n} into the coziest cloud bed and sang the sweetest lullaby. "Sleep well, dear ${n}. Tomorrow is a brand new day." And with a smile, ${n} drifted into the deepest, happiest sleep. Goodnight.`, illustrationPrompt: `A child sleeping on a cloud bed with the moon watching over`, readingTimeSeconds: 30 },
    ],
  },
  friendship: {
    title: (n) => `${n} Makes a New Friend`,
    moral: 'True friendship starts with a simple hello',
    pages: (n) => [
      { pageNumber: 1, text: `At the park, ${n} noticed a new child sitting alone on the bench, looking a bit shy. ${n} walked over with a big smile and said, "Hi! Want to play?" The new friend's face lit up like sunshine.`, illustrationPrompt: `A child approaching a shy child on a park bench`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `They played on the swings, built the tallest sandcastle in the world, and shared apple slices. They discovered they both loved dinosaurs AND space. "We are like the same person!" they giggled.`, illustrationPrompt: `Two children building a sandcastle together in a park`, readingTimeSeconds: 25 },
      { pageNumber: 3, text: `When it was time to go home, they promised to play again tomorrow. ${n} waved goodbye feeling warm inside. Making a friend is one of the best things in the whole wide world. Goodnight, little friend-maker.`, illustrationPrompt: `Two children waving goodbye at sunset in a park`, readingTimeSeconds: 30 },
    ],
  },
  ocean: {
    title: (n) => `${n}'s Underwater Adventure`,
    moral: 'The world beneath the waves is full of wonder',
    pages: (n) => [
      { pageNumber: 1, text: `${n} found a magical seashell on the beach. Holding it to one ear, a tiny voice said, "Come explore with us!" Suddenly, ${n} could breathe underwater and dove into the sparkling ocean.`, illustrationPrompt: `A child on a beach holding a glowing seashell`, readingTimeSeconds: 25 },
      { pageNumber: 2, text: `Below the waves, ${n} met Coral the seahorse and Bubbles the octopus. They swam through rainbow coral reefs, played hide and seek with clownfish, and rode on a gentle sea turtle.`, illustrationPrompt: `A child swimming underwater with a seahorse and octopus`, readingTimeSeconds: 30 },
      { pageNumber: 3, text: `The ocean friends gave ${n} a pearl necklace to remember them by. "Visit us whenever you find a seashell," they said. Back on the beach, ${n} held the pearl close and smiled. Sleep tight, little diver.`, illustrationPrompt: `A child on a beach at sunset holding a pearl`, readingTimeSeconds: 30 },
    ],
  },
};

const STORY_ASSIGNMENTS = [
  { familyIndex: 0, themes: ['dreams'] },
  { familyIndex: 1, themes: ['dreams'] },
  { familyIndex: 2, themes: ['animals', 'dreams'] },
  { familyIndex: 3, themes: ['animals', 'friendship'] },
  { familyIndex: 4, themes: ['dinosaurs', 'animals', 'adventure'] },
  { familyIndex: 5, themes: ['magic', 'animals', 'friendship'] },
  { familyIndex: 6, themes: ['dinosaurs', 'space', 'adventure', 'ocean'] },
  { familyIndex: 7, themes: ['magic', 'animals', 'space', 'friendship'] },
  { familyIndex: 8, themes: ['adventure', 'space', 'dinosaurs', 'magic', 'ocean'] },
  { familyIndex: 9, themes: ['adventure', 'animals', 'space', 'ocean', 'magic', 'friendship'] },
];

async function seedStories(familyContexts) {
  console.log('\n--- Seeding stories (direct DB)...');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const storiesCol = mongoose.connection.collection('stories');
  const timelineCol = mongoose.connection.collection('timelineentries');

  for (const assignment of STORY_ASSIGNMENTS) {
    const ctx = familyContexts[assignment.familyIndex];
    const { childId, userId, family } = ctx;
    const childAge = getChildAgeMonths(family.child.dateOfBirth);
    const childName = family.child.name;

    // Check existing
    const existingCount = await storiesCol.countDocuments({ childId });
    if (existingCount > 0) {
      console.log(`  ~ ${childName} already has ${existingCount} stories`);
      continue;
    }

    let count = 0;
    for (let i = 0; i < assignment.themes.length; i++) {
      const themeId = assignment.themes[i];
      const theme = STORY_THEMES.find(t => t.id === themeId);
      const template = STORY_TEMPLATES[themeId];

      const storyAge = Math.max(3, childAge - (assignment.themes.length - i) * 3);
      const createdDate = monthsAgoDate(childAge - storyAge);

      const storyDoc = {
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
        updatedAt: createdDate,
      };

      const result = await storiesCol.insertOne(storyDoc);
      const storyId = result.insertedId.toString();

      // Create matching timeline entry
      await timelineCol.insertOne({
        childId,
        userId,
        type: 'story',
        title: `New story: ${template.title(childName)}`,
        description: `A ${theme.name.toLowerCase()}-themed bedtime story was created for ${childName}`,
        date: createdDate,
        data: { storyId, theme: themeId },
        createdAt: createdDate,
      });
      count++;
    }
    console.log(`  + ${childName}: ${count} stories`);
  }
}

// ──── MAIN ORCHESTRATOR ────

async function seed() {
  console.log('=== TinySteps Realistic Data Seed ===\n');
  console.log('Backend:', API_BASE);
  console.log('Families:', FAMILIES.length);
  console.log('');

  // Verify backend is accessible
  try {
    await fetch(`${API_BASE.replace('/api', '')}/health`);
  } catch (e) {
    console.error('ERROR: Backend not reachable at', API_BASE);
    console.error('Start it with: cd backend && npm run dev');
    process.exit(1);
  }

  console.log('--- Registering users & creating children...');
  const familyContexts = [];
  for (const family of FAMILIES) {
    const ctx = await seedFamily(family);
    familyContexts.push(ctx);
  }

  await seedAllMilestones(familyContexts);
  await seedAllMeasurements(familyContexts);
  await seedAllAnalyses(familyContexts);
  await seedCommunityContent(familyContexts);
  await seedTimelineNotes(familyContexts);
  await seedStories(familyContexts);

  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  console.log('\n=== Seed complete! ===');
  console.log('\nLogin with any email below + password: Test1234!');
  FAMILIES.forEach(f => console.log(`  ${f.parent.email} — ${f.parent.name} (child: ${f.child.name})`));
}

seed().catch(err => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});

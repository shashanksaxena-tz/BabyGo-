/**
 * Task 12: Stories integration tests
 * Mocks geminiService to avoid real AI calls.
 *
 * NOTE: app.js uses static top-level imports for all routes, so the shared
 * integrationBase / app.js cannot be used here — the route module would bind
 * to the real geminiService before the mock is registered.
 *
 * Instead we build a minimal Express app inline using dynamic imports AFTER
 * jest.unstable_mockModule has been called.
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Register ESM mock BEFORE any route/service imports
// ---------------------------------------------------------------------------
const mockGenerateBedtimeStory = jest.fn();
const mockIsInitialized = jest.fn(() => true);
const mockInitialize = jest.fn();

jest.unstable_mockModule('../../src/services/geminiService.js', () => ({
  default: {
    initialize: mockInitialize,
    isInitialized: mockIsInitialized,
    generateBedtimeStory: mockGenerateBedtimeStory,
    generateIllustration: jest.fn(),
    generateCustomStory: jest.fn(),
    describeImage: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Dynamic imports — must happen AFTER mockModule registration
// ---------------------------------------------------------------------------
import mongoose from 'mongoose';
import supertestLib from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Read MongoDB URI (written by globalSetup)
function getMongoUri() {
  const tmpFile = path.join(process.cwd(), 'tests/.mongo-uri');
  if (fs.existsSync(tmpFile)) {
    return fs.readFileSync(tmpFile, 'utf8').trim();
  }
  return process.env.MONGODB_URI;
}

const mongoUri = getMongoUri();
if (mongoUri) {
  process.env.MONGODB_URI = mongoUri;
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration';
process.env.NODE_ENV = 'test';

// Lazy-hold app + token so they're set in beforeAll/beforeEach
let app;
let token;

// ---------------------------------------------------------------------------
// Build a minimal Express app using dynamic imports (routes load AFTER mock)
// ---------------------------------------------------------------------------
async function buildStoriesApp(uri) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // Dynamic imports — at this point jest.unstable_mockModule is already set
  const { default: authRoutes } = await import('../../src/routes/auth.js');
  const { default: childRoutes } = await import('../../src/routes/children.js');
  const { default: storiesRoutes } = await import('../../src/routes/stories.js');

  const server = express();
  server.use(helmet());
  server.use(cors());
  server.use(express.json({ limit: '10mb' }));

  server.use('/api/auth', authRoutes);
  server.use('/api/children', childRoutes);
  server.use('/api/stories', storiesRoutes);

  server.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  server.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return server;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
beforeAll(async () => {
  app = await buildStoriesApp(getMongoUri());
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }

  // Register + log in a fresh test user
  const res = await supertestLib(app)
    .post('/api/auth/register')
    .send({ name: 'Story Tester', email: 'storytester@tinysteps.test', password: 'TestPass123!' })
    .expect(201);

  token = res.body.token;
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_CHILD = {
  name: 'Story Baby',
  dateOfBirth: (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split('T')[0];
  })(),
  gender: 'female',
  weight: 9.0,
  height: 74,
  region: 'searo',
};

const MOCK_STORY_DATA = {
  title: 'The Magical Forest',
  pages: [
    { pageNumber: 1, text: 'Once upon a time...', illustrationPrompt: 'A magical forest' },
    { pageNumber: 2, text: 'The end.', illustrationPrompt: 'A peaceful ending' },
  ],
  moral: 'Be kind to animals.',
  characters: [{ name: 'Leo', description: 'A curious lion cub', role: 'protagonist' }],
  duration: '5',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/stories', () => {
  let childId;

  beforeEach(async () => {
    // Set fake API key so geminiInit doesn't reject
    process.env.GEMINI_API_KEY = 'test-fake-key';
    mockGenerateBedtimeStory.mockResolvedValue(MOCK_STORY_DATA);

    const createRes = await supertestLib(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;
  });

  it('generates and saves a story for a valid child + theme', async () => {
    const res = await supertestLib(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ childId, themeId: 'adventure' })
      .expect(201);

    expect(res.body.story).toBeDefined();
    expect(res.body.story.title).toBe(MOCK_STORY_DATA.title);
    expect(res.body.story.childId).toBe(childId);
  });

  it('rejects invalid theme ID', async () => {
    const res = await supertestLib(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ childId, themeId: 'not-a-valid-theme' })
      .expect(400);

    expect(res.body.error).toMatch(/invalid theme/i);
  });

  it('returns 404 for unknown child ID', async () => {
    const res = await supertestLib(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ childId: '000000000000000000000001', themeId: 'adventure' })
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/stories/:childId', () => {
  let childId;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-fake-key';
    mockGenerateBedtimeStory.mockResolvedValue(MOCK_STORY_DATA);

    const createRes = await supertestLib(app)
      .post('/api/children')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;
  });

  it('returns empty list when no stories exist', async () => {
    const res = await supertestLib(app)
      .get(`/api/stories/${childId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.stories).toEqual([]);
  });

  it('returns stories after generating one', async () => {
    await supertestLib(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ childId, themeId: 'magic' })
      .expect(201);

    const res = await supertestLib(app)
      .get(`/api/stories/${childId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.stories).toHaveLength(1);
    expect(res.body.stories[0].title).toBe(MOCK_STORY_DATA.title);
  });
});

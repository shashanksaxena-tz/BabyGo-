/**
 * Task 12: Stories integration tests
 * Mocks geminiService to avoid real AI calls.
 */

import { jest } from '@jest/globals';

// ESM mock must happen before any imports
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

// Import integrationBase AFTER mocks are registered
await import('../setup/integrationBase.js');
const { getToken, request } = await import('../setup/integrationBase.js');

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

describe('POST /api/stories', () => {
  let childId;

  beforeEach(async () => {
    // Set fake API key so geminiInit doesn't reject
    process.env.GEMINI_API_KEY = 'test-fake-key';
    mockGenerateBedtimeStory.mockResolvedValue(MOCK_STORY_DATA);

    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;
  });

  it('generates and saves a story for a valid child + theme', async () => {
    const res = await request()
      .post('/api/stories')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ childId, themeId: 'adventure' })
      .expect(201);

    expect(res.body.story).toBeDefined();
    expect(res.body.story.title).toBe(MOCK_STORY_DATA.title);
    expect(res.body.story.childId).toBe(childId);
  });

  it('rejects invalid theme ID', async () => {
    const res = await request()
      .post('/api/stories')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ childId, themeId: 'not-a-valid-theme' })
      .expect(400);

    expect(res.body.error).toMatch(/invalid theme/i);
  });

  it('returns 404 for unknown child ID', async () => {
    const res = await request()
      .post('/api/stories')
      .set('Authorization', `Bearer ${getToken()}`)
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

    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;
  });

  it('returns empty list when no stories exist', async () => {
    const res = await request()
      .get(`/api/stories/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.stories).toEqual([]);
  });

  it('returns stories after generating one', async () => {
    await request()
      .post('/api/stories')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ childId, themeId: 'magic' })
      .expect(201);

    const res = await request()
      .get(`/api/stories/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.stories).toHaveLength(1);
    expect(res.body.stories[0].title).toBe(MOCK_STORY_DATA.title);
  });
});

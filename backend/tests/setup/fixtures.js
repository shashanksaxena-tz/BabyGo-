/**
 * Shared test fixtures and helper functions for TinySteps AI backend tests.
 */

import request from 'supertest';

// ---------------------------------------------------------------------------
// Static data fixtures
// ---------------------------------------------------------------------------

export const TEST_USER = {
  name: 'Test Parent',
  email: 'testparent@tinysteps.test',
  password: 'TestPass123!',
};

export const TEST_USER_2 = {
  name: 'Second Parent',
  email: 'secondparent@tinysteps.test',
  password: 'TestPass456!',
};

/** A newborn child (0 months old as of test date). */
export const TEST_CHILD_NEWBORN = {
  name: 'Baby Newborn',
  dateOfBirth: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // 1 week old
    return d.toISOString().split('T')[0];
  })(),
  gender: 'male',
  birthWeight: 3200,
  birthHeight: 50,
};

/** A toddler child (~18 months old as of test date). */
export const TEST_CHILD_TODDLER = {
  name: 'Baby Toddler',
  dateOfBirth: (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 18);
    return d.toISOString().split('T')[0];
  })(),
  gender: 'female',
  birthWeight: 3000,
  birthHeight: 49,
};

// ---------------------------------------------------------------------------
// Gemini AI response fixtures (mock what the service returns)
// ---------------------------------------------------------------------------

export const GEMINI_ANALYSIS_RESPONSE = {
  overallScore: 85,
  domains: {
    motor: { score: 88, status: 'on_track', observations: 'Motor skills developing well.' },
    cognitive: { score: 82, status: 'on_track', observations: 'Cognitive development appropriate for age.' },
    language: { score: 80, status: 'on_track', observations: 'Language skills are emerging.' },
    social: { score: 90, status: 'advanced', observations: 'Strong social engagement.' },
  },
  summary: 'Baby is developing on track across all domains.',
  recommendations: ['Continue tummy time practice.', 'Engage in interactive play daily.'],
};

export const GEMINI_STORY_RESPONSE = {
  title: 'The Sleepy Bunny',
  content: 'Once upon a time, a little bunny named Leo found the softest cloud to sleep on...',
  theme: 'bedtime',
  moral: 'Rest is important for growing strong.',
};

export const GEMINI_RECOMMENDATIONS_RESPONSE = {
  products: [
    { name: 'Soft Stacking Rings', category: 'toys', ageRange: '6-12 months', reason: 'Develops fine motor skills.' },
  ],
  activities: [
    { name: 'Tummy Time', duration: '10 minutes', frequency: 'daily', benefit: 'Builds neck and shoulder strength.' },
  ],
  recipes: [
    { name: 'Sweet Potato Puree', ingredients: ['sweet potato'], instructions: 'Steam and blend.', ageMin: 6 },
  ],
  tips: [
    { title: 'Read Together', description: 'Reading aloud supports language development.' },
  ],
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Register a user and return their auth token + user data.
 *
 * @param {import('express').Application} app
 * @param {object} [userData] - Override default TEST_USER fields
 * @returns {Promise<{ token: string, user: object, refreshToken: string }>}
 */
export async function registerAndLogin(app, userData = TEST_USER) {
  const res = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201);

  return {
    token: res.body.token,
    refreshToken: res.body.refreshToken,
    user: res.body.user,
  };
}

/**
 * Create a child profile for the authenticated user.
 *
 * @param {import('express').Application} app
 * @param {string} token - JWT token from registerAndLogin
 * @param {object} [childData] - Override default TEST_CHILD_NEWBORN fields
 * @returns {Promise<object>} The created child object
 */
export async function createTestChild(app, token, childData = TEST_CHILD_NEWBORN) {
  const res = await request(app)
    .post('/api/children')
    .set('Authorization', `Bearer ${token}`)
    .send(childData)
    .expect(201);

  return res.body.child || res.body;
}

/**
 * Convenience: register + login + create a child in one call.
 *
 * @param {import('express').Application} app
 * @param {object} [opts]
 * @param {object} [opts.user]  - User override
 * @param {object} [opts.child] - Child override
 * @returns {Promise<{ token: string, user: object, child: object }>}
 */
export async function setupUserWithChild(app, { user = TEST_USER, child = TEST_CHILD_NEWBORN } = {}) {
  const auth = await registerAndLogin(app, user);
  const createdChild = await createTestChild(app, auth.token, child);
  return { token: auth.token, user: auth.user, child: createdChild };
}

/**
 * Integration test base — shared setup/teardown for all integration tests.
 *
 * Reads the MongoDB URI written by globalSetup.js (separate process),
 * creates the Express app once, clears collections before each test,
 * and registers a fresh test user.
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import supertestLib from 'supertest';
import { createApp, closeApp } from './app.js';
import { TEST_USER } from './fixtures.js';

let app;
let token;
let user;

// Read MongoDB URI from temp file written by globalSetup
function getMongoUri() {
  const tmpFile = path.join(process.cwd(), 'tests/.mongo-uri');
  if (fs.existsSync(tmpFile)) {
    return fs.readFileSync(tmpFile, 'utf8').trim();
  }
  // Fallback to env var (useful when running tests without globalSetup)
  return process.env.MONGODB_URI;
}

// Set env vars from the URI file before any imports run
const mongoUri = getMongoUri();
if (mongoUri) {
  process.env.MONGODB_URI = mongoUri;
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  const uri = getMongoUri();
  app = await createApp(uri);
});

afterAll(async () => {
  await closeApp();
});

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }

  // Register a fresh test user for each test
  const res = await supertestLib(app)
    .post('/api/auth/register')
    .send(TEST_USER)
    .expect(201);

  token = res.body.token;
  user = res.body.user;
});

export function getApp() {
  return app;
}

export function getToken() {
  return token;
}

export function getUser() {
  return user;
}

export function request() {
  return supertestLib(app);
}

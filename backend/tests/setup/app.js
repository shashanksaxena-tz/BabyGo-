/**
 * Express app factory for testing.
 *
 * Creates an Express app wired with all 13 route groups but WITHOUT:
 *   - app.listen() — Supertest handles that
 *   - Rate limiting     — would interfere with integration tests
 *   - Morgan logging    — noise in test output
 *   - DB connection     — caller provides mongoUri and connects before calling this
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Routes
import authRoutes from '../../src/routes/auth.js';
import childRoutes from '../../src/routes/children.js';
import analysisRoutes from '../../src/routes/analysis.js';
import storiesRoutes from '../../src/routes/stories.js';
import timelineRoutes from '../../src/routes/timeline.js';
import recommendationsRoutes from '../../src/routes/recommendations.js';
import uploadRoutes from '../../src/routes/upload.js';
import doctorRoutes from '../../src/routes/doctors.js';
import resourceRoutes from '../../src/routes/resources.js';
import reportRoutes from '../../src/routes/reports.js';
import sarvamRoutes from '../../src/routes/sarvam.js';
import communityRoutes from '../../src/routes/community.js';
import configRoutes from '../../src/routes/config.js';

/**
 * Boot an Express app connected to the provided MongoDB URI.
 *
 * @param {string} mongoUri - MongoDB connection string (e.g. from MongoMemoryServer)
 * @returns {Promise<import('express').Application>}
 */
export async function createApp(mongoUri) {
  // Connect to the provided MongoDB URI
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  const app = express();

  // Security headers (lightweight, keeps parity with production)
  app.use(helmet());

  // Open CORS for tests
  app.use(cors());

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Mount all 13 route groups
  app.use('/api/auth', authRoutes);
  app.use('/api/children', childRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/stories', storiesRoutes);
  app.use('/api/timeline', timelineRoutes);
  app.use('/api/recommendations', recommendationsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/sarvam', sarvamRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/config', configRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Test app error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

/**
 * Disconnect from MongoDB — call in afterAll hooks.
 */
export async function closeApp() {
  await mongoose.disconnect();
}

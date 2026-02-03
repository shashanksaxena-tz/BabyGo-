import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import childRoutes from './routes/children.js';
import analysisRoutes from './routes/analysis.js';
import storiesRoutes from './routes/stories.js';
import timelineRoutes from './routes/timeline.js';
import recommendationsRoutes from './routes/recommendations.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - allow web, mobile apps
app.use(cors({
  origin: [
    'http://localhost:3000',      // Web dev
    'http://localhost:5173',      // Vite dev
    'http://localhost:8080',      // Alternative web
    'capacitor://localhost',      // iOS Capacitor
    'http://localhost',           // Android local
    process.env.WEB_APP_URL,      // Production web URL
    process.env.MOBILE_APP_URL,   // Production mobile URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'TinySteps AI Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'TinySteps AI API',
    version: '1.0.0',
    description: 'Backend service for TinySteps AI child development tracking',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'POST /api/auth/refresh': 'Refresh access token',
      },
      children: {
        'GET /api/children': 'Get all children for user',
        'POST /api/children': 'Create child profile',
        'GET /api/children/:id': 'Get child by ID',
        'PUT /api/children/:id': 'Update child profile',
        'DELETE /api/children/:id': 'Delete child profile',
      },
      analysis: {
        'POST /api/analysis': 'Create new development analysis',
        'GET /api/analysis/:childId': 'Get analyses for child',
        'GET /api/analysis/:childId/:id': 'Get specific analysis',
        'POST /api/analysis/audio': 'Analyze baby audio',
      },
      stories: {
        'GET /api/stories/:childId': 'Get stories for child',
        'POST /api/stories': 'Generate new bedtime story',
        'GET /api/stories/:childId/:id': 'Get specific story',
        'DELETE /api/stories/:childId/:id': 'Delete story',
      },
      timeline: {
        'GET /api/timeline/:childId': 'Get timeline entries',
        'POST /api/timeline': 'Add timeline entry',
        'POST /api/timeline/measurement': 'Add growth measurement',
        'GET /api/timeline/measurements/:childId': 'Get growth measurements',
      },
      recommendations: {
        'GET /api/recommendations/products/:childId': 'Get product recommendations',
        'GET /api/recommendations/activities/:childId': 'Get activity suggestions',
        'GET /api/recommendations/recipes/:childId': 'Get age-appropriate recipes',
        'GET /api/recommendations/tips/:childId': 'Get parenting tips',
      },
    },
    whoSources: {
      description: 'All analyses are based on WHO developmental milestones',
      links: [
        'https://www.who.int/tools/child-growth-standards',
        'https://www.who.int/publications/i/item/WHO-TRS-1006',
      ]
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tinysteps';

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.warn('⚠️ MongoDB not available, using in-memory storage');
    console.warn('   Set MONGODB_URI environment variable for persistence');
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🍼 TinySteps AI Backend Server                     ║
║                                                      ║
║   Server running on: http://localhost:${PORT}          ║
║   API Docs: http://localhost:${PORT}/api               ║
║   Health: http://localhost:${PORT}/health              ║
║                                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

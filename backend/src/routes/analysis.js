import express from 'express';
import multer from 'multer';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import TimelineEntry from '../models/Timeline.js';
import { authMiddleware } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Get WHO milestones for age (MUST be before /:childId route)
router.get('/milestones/:ageMonths', async (req, res) => {
  try {
    const ageMonths = parseInt(req.params.ageMonths);
    if (isNaN(ageMonths) || ageMonths < 0) {
      return res.status(400).json({ error: 'Invalid age in months' });
    }
    const milestones = whoDataService.getMilestonesForAge(ageMonths);
    const sources = whoDataService.getSources();

    res.json({ milestones, sources });
  } catch (error) {
    console.error('Milestones error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones: ' + error.message });
  }
});

// Get growth percentiles (MUST be before /:childId route)
router.post('/growth-percentiles', authMiddleware, async (req, res) => {
  try {
    const { weight, height, headCircumference, ageMonths, gender } = req.body;

    const childData = {
      weight,
      height,
      headCircumference,
      ageInMonths: ageMonths,
      gender,
    };

    const percentiles = whoDataService.assessGrowth(childData);

    res.json({ percentiles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate percentiles' });
  }
});

// Create new analysis
router.post('/', authMiddleware, upload.array('media', 10), async (req, res) => {
  try {
    const { childId } = req.body;

    // Get child
    const child = await Child.findOne({
      _id: childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Initialize Gemini with user's API key
    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured. Please add it in settings.' });
    }

    geminiService.initialize(apiKey);

    // Prepare media data
    const mediaData = (req.files || []).map(file => ({
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
      filename: file.originalname,
    }));

    // Run analysis
    const analysisResult = await geminiService.analyzeDevelopment(child, mediaData);

    // Save analysis
    const analysis = new Analysis({
      childId: child._id,
      userId: req.user._id,
      mediaFiles: mediaData.map((m, i) => ({
        filename: m.filename,
        type: m.mimeType.startsWith('video') ? 'video' : 'image',
      })),
      ...analysisResult,
    });

    await analysis.save();

    // Add timeline entry
    const timelineEntry = new TimelineEntry({
      childId: child._id,
      userId: req.user._id,
      type: 'analysis',
      date: new Date(),
      title: 'Development Analysis',
      description: analysisResult.summary,
      data: { analysisId: analysis._id, score: analysisResult.overallScore },
    });
    await timelineEntry.save();

    res.status(201).json({
      message: 'Analysis completed',
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

// Get analyses for child
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const analyses = await Analysis.find({ childId: child._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ analyses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get specific analysis
router.get('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      childId: req.params.childId
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

export default router;

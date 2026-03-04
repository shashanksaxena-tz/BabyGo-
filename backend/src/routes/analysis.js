import express from 'express';
import multer from 'multer';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import Resource from '../models/Resource.js';
import TimelineEntry from '../models/Timeline.js';
import { authMiddleware } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// Map frontend status strings to backend enum values
function mapStatus(status) {
  const statusMap = {
    'ahead': 'on_track',
    'on-track': 'on_track',
    'on_track': 'on_track',
    'on_track_with_monitoring': 'on_track_with_monitoring',
    'on-track-with-monitoring': 'on_track_with_monitoring',
    'monitor': 'emerging',
    'emerging': 'emerging',
    'discuss': 'needs_support',
    'needs_support': 'needs_support',
    'needs-support': 'needs_support',
  };
  return statusMap[status] || 'on_track';
}

// Map frontend domain data to backend assessment schema
function mapDomainAssessment(domainData, domainName) {
  if (!domainData) return { domain: domainName, score: 0, status: 'on_track', observations: [], strengths: [], areasToSupport: [], activities: [] };

  return {
    domain: domainName,
    score: domainData.score || 0,
    status: mapStatus(domainData.status || 'on_track'),
    observations: domainData.observations || [],
    strengths: domainData.observations?.slice(0, 2) || [],
    areasToSupport: domainData.recommendations || [],
    activities: domainData.recommendations || [],
  };
}

// Map frontend physical growth to backend growth percentiles
function mapGrowthPercentiles(physicalGrowth) {
  if (!physicalGrowth) return [];
  const percentiles = [];
  if (physicalGrowth.weightPercentile != null) {
    percentiles.push({ metric: 'weight', value: 0, percentile: physicalGrowth.weightPercentile, interpretation: physicalGrowth.description || '' });
  }
  if (physicalGrowth.heightPercentile != null) {
    percentiles.push({ metric: 'height', value: 0, percentile: physicalGrowth.heightPercentile, interpretation: physicalGrowth.description || '' });
  }
  return percentiles;
}

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

// Get WHO growth curves reference data
router.get('/growth-curves', async (req, res) => {
  try {
    const { gender = 'male', metric = 'weight' } = req.query;
    const curves = whoDataService.getGrowthCurves(gender, metric);
    res.json(curves);
  } catch (error) {
    console.error('Growth curves error:', error);
    res.status(500).json({ error: 'Failed to fetch growth curves' });
  }
});

// Save pre-computed analysis result (from browser-side Gemini)
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { childId, analysisData } = req.body;

    if (!childId || !analysisData) {
      return res.status(400).json({ error: 'childId and analysisData are required' });
    }

    // Find child (support both ObjectId and string IDs)
    const child = await Child.findByAnyId(childId);
    if (!child) {
      return res.status(404).json({ error: 'Child not found. Please sync profile first.' });
    }

    // Map frontend analysis format to backend schema
    const analysis = new Analysis({
      childId: child._id.toString(),
      userId: req.user?._id?.toString() || '',
      overallScore: analysisData.overallScore || 0,
      overallStatus: mapStatus(analysisData.overallStatus || analysisData.motorSkills?.status || 'on_track'),
      summary: analysisData.headline || analysisData.reassurance || 'Development analysis completed',
      motorAssessment: mapDomainAssessment(analysisData.motorSkills, 'motor'),
      languageAssessment: mapDomainAssessment(analysisData.languageSkills, 'language'),
      cognitiveAssessment: mapDomainAssessment(analysisData.cognitiveSkills, 'cognitive'),
      socialAssessment: mapDomainAssessment(analysisData.socialEmotional, 'social'),
      growthPercentiles: mapGrowthPercentiles(analysisData.physicalGrowth),
      personalizedTips: (analysisData.tips || []).map(t => typeof t === 'string' ? t : t.title || t.description || ''),
      activities: (analysisData.tips || []).flatMap(t => t.materials || []),
      sources: (analysisData.sources || []).map(s => ({
        title: s.title,
        url: s.url,
        type: s.type || 'guideline',
      })),
      childAgeAtAnalysis: analysisData.childAgeMonths || child.ageInMonths || 0,
    });

    await analysis.save();

    // Add timeline entry
    const timelineEntry = new TimelineEntry({
      childId: child._id.toString(),
      userId: req.user?._id?.toString() || '',
      type: 'analysis',
      date: new Date(),
      title: 'Development Analysis',
      description: analysisData.headline || 'Development analysis completed',
      data: { analysisId: analysis._id.toString(), score: analysisData.overallScore },
    });
    await timelineEntry.save();

    // Auto-generate resources (non-blocking, same as existing POST route)
    try {
      const apiKey = req.user?.geminiApiKey || process.env.GEMINI_API_KEY;
      if (apiKey) {
        geminiService.initialize(apiKey);

        await Resource.updateMany(
          { childId: child._id.toString(), isCurrent: true },
          { $set: { isCurrent: false } }
        );

        const generatedResources = await geminiService.generateImprovementResources(child, analysis);
        if (generatedResources.length > 0) {
          const resourceDocs = generatedResources.map(r => ({
            childId: child._id.toString(),
            analysisId: analysis._id.toString(),
            domain: r.domain,
            type: r.type,
            title: r.title,
            description: r.description,
            tags: r.tags,
            ageRange: r.ageRange,
            duration: r.duration,
            difficulty: r.difficulty,
            priority: r.priority,
            isCurrent: true,
          }));
          await Resource.insertMany(resourceDocs);
          console.log(`Auto-generated ${resourceDocs.length} resources for child ${child._id}`);
        }
      }
    } catch (resourceErr) {
      console.warn('Auto resource generation failed:', resourceErr.message);
    }

    res.status(201).json({
      message: 'Analysis saved successfully',
      analysis,
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({ error: 'Failed to save analysis: ' + error.message });
  }
});

// Create new analysis
router.post('/', authMiddleware, upload.array('media', 10), async (req, res) => {
  try {
    const { childId } = req.body;

    // Get child
    const child = await Child.findByAnyId(childId);

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
      childId: String(child._id),
      userId: String(req.user._id),
      mediaFiles: mediaData.map((m, i) => ({
        filename: m.filename,
        type: m.mimeType.startsWith('video') ? 'video' : 'image',
      })),
      ...analysisResult,
    });

    await analysis.save();

    // Add timeline entry
    const timelineEntry = new TimelineEntry({
      childId: String(child._id),
      userId: String(req.user._id),
      type: 'analysis',
      date: new Date(),
      title: 'Development Analysis',
      description: analysisResult.summary,
      data: { analysisId: String(analysis._id), score: analysisResult.overallScore },
    });
    await timelineEntry.save();

    // Auto-generate resources based on the new analysis (non-blocking)
    try {
      // Mark old resources as not current
      await Resource.updateMany(
        { childId: String(child._id), isCurrent: true },
        { $set: { isCurrent: false } }
      );

      // Generate new resources via Gemini
      const generatedResources = await geminiService.generateImprovementResources(child, analysis);

      if (generatedResources.length > 0) {
        const resourceDocs = generatedResources.map(r => ({
          childId: String(child._id),
          analysisId: String(analysis._id),
          domain: r.domain,
          type: r.type,
          title: r.title,
          description: r.description,
          tags: r.tags,
          ageRange: r.ageRange,
          duration: r.duration,
          difficulty: r.difficulty,
          priority: r.priority,
          isCurrent: true,
        }));

        await Resource.insertMany(resourceDocs);
        console.log(`Auto-generated ${resourceDocs.length} resources for child ${child._id}`);
      }
    } catch (resourceErr) {
      // Resource generation failure is non-blocking
      console.warn('Auto resource generation failed:', resourceErr.message);
    }

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
    const analyses = await Analysis.find({ childId: req.params.childId })
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

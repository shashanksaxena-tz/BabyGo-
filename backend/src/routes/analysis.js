import express from 'express';
import multer from 'multer';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import Resource from '../models/Resource.js';
import TimelineEntry from '../models/Timeline.js';
import { authMiddleware } from '../middleware/auth.js';
import { geminiInit } from '../middleware/geminiInit.js';
import geminiService from '../services/geminiService.js';
import whoDataService from '../services/whoDataService.js';
import Milestone from '../models/Milestone.js';
import { DOMAINS } from '../config/appConfig.js';

const router = express.Router();

// Map frontend status strings to backend enum values
function mapStatus(status) {
  const statusMap = {
    'ahead': 'ahead',
    'on-track': 'on_track',
    'on_track': 'on_track',
    'on_track_with_monitoring': 'on_track_with_monitoring',
    'on-track-with-monitoring': 'on_track_with_monitoring',
    'monitor': 'on_track_with_monitoring',
    'emerging': 'emerging',
    'discuss': 'needs_support',
    'needs_support': 'needs_support',
    'needs-support': 'needs_support',
  };
  return statusMap[status?.toLowerCase()] || 'on_track';
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
// Supports query params: domain, status (current|upcoming|achieved), childId
router.get('/milestones/:ageMonths', async (req, res) => {
  try {
    const ageMonths = parseInt(req.params.ageMonths);
    if (isNaN(ageMonths) || ageMonths < 0) {
      return res.status(400).json({ error: 'Invalid age in months' });
    }

    const { domain, status, childId } = req.query;
    const sources = whoDataService.getSources();

    // Try DB first, fall back to hardcoded whoDataService
    const dbCount = await Milestone.countDocuments();
    let milestones;

    if (dbCount > 0) {
      // Query from DB: current age bracket (±3 months) PLUS the next bracket ahead (+12 months) for upcoming milestones
      const query = { isActive: true, ageRangeStartMonths: { $lte: ageMonths + 12 }, ageRangeEndMonths: { $gte: ageMonths - 3 } };
      if (domain && domain !== 'all') query.domain = domain;
      const dbMilestones = await Milestone.find(query).lean();
      milestones = dbMilestones.map(m => ({
        id: m.uuid || m.legacyId,
        legacyId: m.legacyId,
        title: m.title,
        description: m.description,
        domain: m.domain,
        subDomain: m.subDomain,
        minMonths: m.ageRangeStartMonths,
        maxMonths: m.ageRangeEndMonths,
        typicalMonths: m.typicalMonths,
        source: m.source,
      }));
    } else {
      // Fallback to hardcoded arrays
      milestones = whoDataService.getMilestonesForAge(ageMonths);
      if (domain && domain !== 'all') {
        milestones = milestones.filter(m => m.domain === domain);
      }
    }

    // Get achieved milestones if childId provided
    let achievedIds = new Set();
    if (childId) {
      try {
        const child = await Child.findById(childId);
        if (child?.achievedMilestones) {
          achievedIds = new Set(child.achievedMilestones.map(m => m.milestoneId));
        }
      } catch (childErr) {
        console.warn('Failed to look up child for milestone status:', childErr.message);
      }
    }

    // Categorize milestones using typicalMonths for accurate current/upcoming split.
    // A milestone is "current" if the child has reached or passed its typical age,
    // and "upcoming" if the typical age is still ahead—even within the same age bracket.
    const isAchieved = m => achievedIds.has(m.id) || achievedIds.has(m.legacyId);
    const current = milestones.filter(m => !isAchieved(m) && ageMonths >= m.minMonths && ageMonths <= m.maxMonths && (m.typicalMonths || m.minMonths) <= ageMonths);
    const upcoming = milestones.filter(m => !isAchieved(m) && ((m.typicalMonths || m.minMonths) > ageMonths || m.minMonths > ageMonths));
    const achieved = milestones.filter(isAchieved);

    // Calculate progress based on current-age milestones (those with typicalMonths <= child's age)
    const currentAgeMilestones = milestones.filter(m => ageMonths >= m.minMonths && (m.typicalMonths || m.minMonths) <= ageMonths);
    const progress = currentAgeMilestones.length > 0
      ? Math.round((currentAgeMilestones.filter(isAchieved).length / currentAgeMilestones.length) * 100)
      : 0;

    // Filter by status tab if provided
    let result = milestones;
    if (status === 'current') result = current;
    else if (status === 'upcoming') result = upcoming;
    else if (status === 'achieved') result = achieved;

    res.json({
      milestones: result,
      counts: { current: current.length, upcoming: upcoming.length, achieved: achieved.length, total: milestones.length },
      progress,
      sources,
    });
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

// POST /api/analysis/baby-sounds
router.post('/baby-sounds', authMiddleware, upload.single('audio'), geminiInit, async (req, res) => {
  try {
    const { childId } = req.body;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    let audioData = null;
    if (req.file) {
      audioData = { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype };
    }

    const analysis = await geminiService.analyzeBabySounds(child, audioData);
    res.json({ message: 'Baby sound analysis complete', analysis });
  } catch (error) {
    console.error('Baby sound analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze baby sounds' });
  }
});

// POST /api/analysis/transcribe
router.post('/transcribe', authMiddleware, upload.single('audio'), geminiInit, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const audioData = { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype };
    const transcription = await geminiService.transcribeAudio(audioData);
    res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
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
    await Promise.all([analysis.save(), timelineEntry.save()]);

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
router.post('/', authMiddleware, upload.array('media', 10), geminiInit, async (req, res) => {
  try {
    const { childId } = req.body;

    // Get child
    const child = await Child.findByAnyId(childId);

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Prepare media data
    const mediaData = (req.files || []).map(file => ({
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
      filename: file.originalname,
    }));

    // Fetch achieved milestones for richer analysis context
    const achievedMilestoneContext = (child.achievedMilestones || []).map(m => ({
      title: m.title || m.milestoneId,
      domain: m.domain || 'general',
    }));

    // Run analysis
    const analysisResult = await geminiService.analyzeDevelopment(child, mediaData, null, achievedMilestoneContext);

    // Save analysis
    const analysis = new Analysis({
      childId: String(child._id),
      userId: String(req.user._id),
      mediaFiles: mediaData.map((m, i) => ({
        filename: m.filename,
        type: m.mimeType.startsWith('video') ? 'video' : 'image',
        url: '',
      })),
      ...analysisResult,
    });

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
    await Promise.all([analysis.save(), timelineEntry.save()]);

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
    // Performance optimization: using .lean() for read-only queries to bypass document hydration
    const analyses = await Analysis.find({ childId: req.params.childId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ analyses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get trend data and chart points for child analyses
router.get('/:childId/trends', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const period = req.query.period || '3M';

    const periodDays = { '1W': 7, '1M': 30, '3M': 90, '6M': 180 };
    const days = periodDays[period];

    let query = { childId, userId: String(req.user._id) };
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query.createdAt = { $gte: cutoff };
    }

    const analyses = await Analysis.find(query).sort({ createdAt: 1 }).lean();

    // Build chart data
    const chartData = analyses.map(a => ({
      date: a.createdAt,
      dateLabel: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      motor: a.motorAssessment?.score ?? null,
      cognitive: a.cognitiveAssessment?.score ?? null,
      language: a.languageAssessment?.score ?? null,
      social: a.socialAssessment?.score ?? null,
      overall: a.overallScore,
    }));

    // Calculate trends
    const TREND_THRESHOLD = 2;
    const trends = {};

    if (analyses.length >= 2) {
      const latest = analyses[analyses.length - 1];
      const previous = analyses[analyses.length - 2];

      for (const domain of DOMAINS) {
        const latestScore = latest[`${domain}Assessment`]?.score ?? 0;
        const previousScore = previous[`${domain}Assessment`]?.score ?? 0;
        const diff = latestScore - previousScore;
        trends[domain] = {
          direction: diff > TREND_THRESHOLD ? 'up' : diff < -TREND_THRESHOLD ? 'down' : 'stable',
          diff: Math.round(diff * 10) / 10,
          latestScore,
          previousScore,
        };
      }
    } else {
      for (const domain of DOMAINS) {
        trends[domain] = { direction: 'stable', diff: 0, latestScore: 0, previousScore: 0 };
      }
    }

    // Milestone stats - use Child's achievedMilestones and WHO data for accurate counts
    let achievedCount = 0, upcomingCount = 0;
    try {
      const child = await Child.findById(childId);
      if (child) {
        achievedCount = child.achievedMilestones?.length ?? 0;
        const allMilestones = whoDataService.getMilestonesForAge(child.ageInMonths ?? 0);
        upcomingCount = Math.max(0, allMilestones.length - achievedCount);
      }
    } catch (milestoneErr) {
      console.warn('Failed to compute milestone stats:', milestoneErr.message);
    }

    res.json({
      chartData,
      trends,
      milestoneStats: { achieved: achievedCount, upcoming: upcomingCount },
      analysisCount: analyses.length,
      period,
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to calculate trends' });
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

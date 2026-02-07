import express from 'express';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import { authMiddleware } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// Get product recommendations
router.get('/products/:childId', authMiddleware, async (req, res) => {
  try {
    const { category = 'toys' } = req.query;

    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    geminiService.initialize(apiKey);

    const recommendations = await geminiService.generateRecommendations(child, category);

    res.json({
      category,
      childAge: child.ageInMonths,
      recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get activity suggestions
router.get('/activities/:childId', authMiddleware, async (req, res) => {
  try {
    const { domain } = req.query;

    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    geminiService.initialize(apiKey);

    const recommendations = await geminiService.generateRecommendations(child, 'activities');

    // Get WHO milestones for context
    const milestones = domain
      ? whoDataService.getMilestonesByDomain(domain, child.ageInMonths)
      : whoDataService.getMilestonesForAge(child.ageInMonths);

    res.json({
      domain: domain || 'all',
      childAge: child.ageInMonths,
      activities: recommendations,
      relatedMilestones: milestones.slice(0, 5),
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Get recipes
router.get('/recipes/:childId', authMiddleware, async (req, res) => {
  try {
    const { count = 3 } = req.query;

    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    geminiService.initialize(apiKey);

    const recipes = await geminiService.generateRecipes(child, parseInt(count));

    res.json({
      childAge: child.ageInMonths,
      recipes,
    });
  } catch (error) {
    console.error('Recipes error:', error);
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// Get parenting tips
router.get('/tips/:childId', authMiddleware, async (req, res) => {
  try {
    const { focusArea } = req.query;

    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    geminiService.initialize(apiKey);

    const tips = await geminiService.generateParentingTips(child, focusArea);

    res.json({
      childAge: child.ageInMonths,
      focusArea: focusArea || 'general',
      tips,
    });
  } catch (error) {
    console.error('Tips error:', error);
    res.status(500).json({ error: 'Failed to get tips' });
  }
});

// Get WHO sources with enhanced evidence context
router.get('/sources', async (req, res) => {
  try {
    const { context, analysisId, region } = req.query;

    // Get base WHO sources
    let sources = whoDataService.getSources();

    // If region specified, include regional sources
    if (region) {
      sources = whoDataService.getSourcesForRegion(region);
    }

    // If context specified (comma-separated domains), filter sources to matching domains
    // The base WHO sources don't have a domain field, so we tag them as 'general'
    // and keep all 'general' sources plus any that match the requested domains
    let taggedSources = sources.map(s => ({
      ...s,
      domain: s.domain || 'general',
    }));

    if (context) {
      const contextDomains = context.split(',').map(d => d.trim().toLowerCase());
      taggedSources = taggedSources.filter(s =>
        s.domain === 'general' || contextDomains.includes(s.domain)
      );
    }

    // If analysisId specified, also fetch analysis sources
    if (analysisId) {
      try {
        const analysis = await Analysis.findById(analysisId);
        if (analysis && analysis.sources && analysis.sources.length > 0) {
          const analysisSources = analysis.sources.map(s => ({
            title: s.title,
            url: s.url,
            type: s.type || 'analysis',
            domain: 'analysis',
          }));
          taggedSources = [...taggedSources, ...analysisSources];
        }
      } catch (lookupErr) {
        // Non-fatal: continue without analysis sources
        console.warn('Could not fetch analysis sources:', lookupErr.message);
      }
    }

    // Methodology section
    const methodology = [
      {
        step: 1,
        title: 'Data Collection',
        description: 'Photo/video analysis using Google Gemini AI trained on developmental indicators',
        icon: 'clipboard-list',
      },
      {
        step: 2,
        title: 'WHO Benchmark Comparison',
        description: 'Assessment results compared against WHO Child Growth Standards and CDC Developmental Milestones',
        icon: 'git-compare',
      },
      {
        step: 3,
        title: 'AI-Powered Analysis',
        description: 'Machine learning models identify developmental patterns and generate personalized recommendations',
        icon: 'brain',
      },
    ];

    const disclaimer = 'TinySteps AI assessments are for informational purposes only and do not constitute medical advice. '
      + 'Always consult your pediatrician or qualified healthcare provider for professional guidance on your child\'s development.';

    res.json({
      sources: taggedSources,
      methodology,
      disclaimer,
    });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

export default router;

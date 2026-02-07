import express from 'express';
import Child from '../models/Child.js';
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

// Get WHO sources
router.get('/sources', (req, res) => {
  const { region } = req.query;
  const sources = region
    ? whoDataService.getSourcesForRegion(region)
    : whoDataService.getSources();

  res.json({ sources });
});

export default router;

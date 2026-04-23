import express from 'express';
import Child from '../models/Child.js';
import Analysis from '../models/Analysis.js';
import Recipe from '../models/Recipe.js';
import Tip from '../models/Tip.js';
import Product from '../models/Product.js';
import AgeActivity from '../models/AgeActivity.js';
import UserRecipeFavorite from '../models/UserRecipeFavorite.js';
import Timeline from '../models/Timeline.js';
import Milestone from '../models/Milestone.js';
import RecipeCache from '../models/RecipeCache.js';
import { authMiddleware } from '../middleware/auth.js';
import { geminiInit } from '../middleware/geminiInit.js';
import geminiService from '../services/geminiService.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// Helper: compute child age in months
function getAgeMonths(child) {
  if (child.ageInMonths != null) return child.ageInMonths;
  return Math.floor((Date.now() - new Date(child.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44));
}

// ============ PRODUCTS ============

// Get product recommendations from DB, fallback to Gemini
router.get('/products/:childId', authMiddleware, async (req, res) => {
  try {
    const { category = 'toys' } = req.query;
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const age = getAgeMonths(child);

    // Try DB first
    const dbCount = await Product.countDocuments();
    if (dbCount > 0) {
      const query = {
        isActive: true,
        ageRangeStartMonths: { $lte: age },
        ageRangeEndMonths: { $gte: age },
      };
      if (category && category !== 'all') query.category = category;

      const products = await Product.find(query).lean();
      return res.json({ category, childAge: age, recommendations: products });
    }

    // Fallback to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No product data available' });
    geminiService.initialize(apiKey);
    const recommendations = await geminiService.generateRecommendations(child, category);
    res.json({ category, childAge: age, recommendations });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Regenerate products via Gemini
router.post('/products/:childId/regenerate', authMiddleware, geminiInit, async (req, res) => {
  try {
    const { category = 'toys' } = req.body;
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const recommendations = await geminiService.generateRecommendations(child, category);
    res.json({ category, childAge: getAgeMonths(child), recommendations });
  } catch (error) {
    console.error('Product regenerate error:', error);
    res.status(500).json({ error: 'Failed to regenerate recommendations' });
  }
});

// ============ ACTIVITIES ============

// Get activities from DB, fallback to Gemini
router.get('/activities/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const age = getAgeMonths(child);
    const domain = req.query.domain || null;

    // Try DB first
    const dbCount = await AgeActivity.countDocuments();
    if (dbCount > 0) {
      const query = {
        isActive: true,
        ageRangeStartMonths: { $lte: age },
        ageRangeEndMonths: { $gte: age },
      };
      if (domain && domain !== 'all') query.domain = domain;

      const activities = await AgeActivity.find(query).lean();

      // Get related milestones from DB or fallback
      let relatedMilestones;
      const milestoneCount = await Milestone.countDocuments();
      if (milestoneCount > 0) {
        const mQuery = { isActive: true, ageRangeStartMonths: { $lte: age + 3 }, ageRangeEndMonths: { $gte: age - 3 } };
        if (domain && domain !== 'all') mQuery.domain = domain;
        relatedMilestones = (await Milestone.find(mQuery).limit(10).lean()).map((m) => ({
          id: m.uuid || m.legacyId,
          title: m.title,
          domain: m.domain,
        }));
      } else {
        relatedMilestones = domain
          ? whoDataService.getMilestonesByDomain(domain, age).slice(0, 5)
          : whoDataService.getMilestonesForAge(age).slice(0, 10);
      }

      return res.json({ childAge: age, domain: domain || 'all', activities, relatedMilestones });
    }

    // Fallback to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No activity data available' });
    geminiService.initialize(apiKey);

    const achievedMilestones = (child.achievedMilestones || []).map((m) => ({
      title: m.title || m.milestoneId,
    }));
    const activities = await geminiService.generateActivities(child, domain, achievedMilestones);
    const relatedMilestones = domain
      ? whoDataService.getMilestonesByDomain(domain, age).slice(0, 5)
      : whoDataService.getMilestonesForAge(age).slice(0, 10);

    res.json({ childAge: age, domain: domain || 'all', activities, relatedMilestones });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Regenerate activities via Gemini
router.post('/activities/:childId/regenerate', authMiddleware, geminiInit, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const domain = req.body.domain || null;
    const achievedMilestones = (child.achievedMilestones || []).map((m) => ({
      title: m.title || m.milestoneId,
    }));
    const activities = await geminiService.generateActivities(child, domain, achievedMilestones);

    res.json({ childAge: getAgeMonths(child), domain: domain || 'all', activities });
  } catch (error) {
    console.error('Activity regenerate error:', error);
    res.status(500).json({ error: 'Failed to regenerate activities' });
  }
});

// ============ RECIPES ============

// Get recipes from DB, fallback to Gemini/cache
router.get('/recipes/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const age = getAgeMonths(child);
    const { mealType, region, excludeAllergens } = req.query;

    // Try DB first
    const dbCount = await Recipe.countDocuments({ isSeeded: true });
    if (dbCount > 0) {
      const query = {
        isActive: true,
        ageRangeStartMonths: { $lte: age },
        ageRangeEndMonths: { $gte: age },
      };
      if (mealType && mealType !== 'all') query.mealType = mealType;
      if (region && region !== 'all') query.region = region;
      if (excludeAllergens) {
        const allergenList = excludeAllergens.split(',').map((a) => a.trim());
        query.allergens = { $nin: allergenList };
      }

      const recipes = await Recipe.find(query).lean();

      // Enrich with favorite status
      const favoriteIds = new Set(
        (await UserRecipeFavorite.find({ userId: String(req.user._id), childId: String(child._id) }, { recipeId: 1 }).lean())
          .map((f) => String(f.recipeId))
      );
      const enriched = recipes.map((r) => ({ ...r, isFavorited: favoriteIds.has(String(r._id)) }));

      return res.json({ childAge: age, recipes: enriched });
    }

    // Fallback to old Gemini/cache system
    const cached = await RecipeCache.findOne({ childId: String(child._id) });
    if (cached) {
      const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
      if (ageMs < 7 * 24 * 60 * 60 * 1000) {
        return res.json({ childAge: age, recipes: cached.recipes, fromCache: true });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No recipe data available' });
    geminiService.initialize(apiKey);
    const recipes = await geminiService.generateRecipes(child, 9);
    RecipeCache.findOneAndUpdate(
      { childId: String(child._id) },
      { recipes, cachedAt: new Date() },
      { upsert: true }
    ).catch((err) => console.error('RecipeCache upsert failed:', err));

    res.json({ childAge: age, recipes });
  } catch (error) {
    console.error('Recipes error:', error);
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// Regenerate recipes via Gemini
router.post('/recipes/:childId/regenerate', authMiddleware, geminiInit, async (req, res) => {
  try {
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const { excludeAllergens, dietaryPreferences, foodLikings } = req.body;
    const filters = { excludeAllergens, dietaryPreferences, foodLikings };
    const recipes = await geminiService.generateRecipes(child, 9, filters);

    await RecipeCache.findOneAndUpdate(
      { childId: String(child._id) },
      { recipes, cachedAt: new Date() },
      { upsert: true }
    );

    res.json({ childAge: getAgeMonths(child), recipes });
  } catch (error) {
    console.error('Recipe regenerate error:', error);
    res.status(500).json({ error: 'Failed to regenerate recipes' });
  }
});

// ============ RECIPE FAVORITES ============

// Toggle recipe favorite
router.post('/recipes/:recipeId/favorite', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ error: 'childId is required' });

    const userId = String(req.user._id);
    const { recipeId } = req.params;

    // Check if already favorited
    const existing = await UserRecipeFavorite.findOne({ userId, childId, recipeId });
    if (existing) {
      await UserRecipeFavorite.deleteOne({ _id: existing._id });
      return res.json({ message: 'Recipe unfavorited', isFavorited: false });
    }

    await new UserRecipeFavorite({ userId, childId, recipeId }).save();

    // Create timeline entry
    try {
      const recipe = await Recipe.findById(recipeId);
      if (recipe) {
        await new Timeline({
          childId,
          userId,
          type: 'recipe_save',
          title: `Saved recipe: ${recipe.name}`,
          description: `${recipe.name} was saved to favorites`,
          data: { recipeId: String(recipeId), mealType: recipe.mealType },
        }).save();
      }
    } catch (timelineErr) {
      console.warn('Failed to create recipe timeline entry:', timelineErr.message);
    }

    res.json({ message: 'Recipe favorited', isFavorited: true });
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Get favorite recipes for a child
router.get('/recipes/:childId/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { childId } = req.params;

    const favorites = await UserRecipeFavorite.find({ userId, childId })
      .populate('recipeId')
      .sort({ savedAt: -1 })
      .lean();

    const recipes = favorites
      .filter((f) => f.recipeId)
      .map((f) => ({ ...f.recipeId, isFavorited: true, savedAt: f.savedAt }));

    res.json({ recipes });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// ============ TIPS ============

// Get parenting tips from DB, fallback to Gemini
router.get('/tips/:childId', authMiddleware, async (req, res) => {
  try {
    const { focusArea } = req.query;
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const age = getAgeMonths(child);

    // Try DB first
    const dbCount = await Tip.countDocuments();
    if (dbCount > 0) {
      const query = {
        isActive: true,
        ageRangeStartMonths: { $lte: age },
        ageRangeEndMonths: { $gte: age },
      };
      if (focusArea && focusArea !== 'general' && focusArea !== 'all') query.category = focusArea;

      const tips = await Tip.find(query).lean();
      return res.json({ childAge: age, focusArea: focusArea || 'general', tips });
    }

    // Fallback to Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No tip data available' });
    geminiService.initialize(apiKey);
    const tips = await geminiService.generateParentingTips(child, focusArea);
    res.json({ childAge: age, focusArea: focusArea || 'general', tips });
  } catch (error) {
    console.error('Tips error:', error);
    res.status(500).json({ error: 'Failed to get tips' });
  }
});

// Regenerate tips via Gemini
router.post('/tips/:childId/regenerate', authMiddleware, geminiInit, async (req, res) => {
  try {
    const { focusArea } = req.body;
    const child = await Child.findOne({ _id: req.params.childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const tips = await geminiService.generateParentingTips(child, focusArea);
    res.json({ childAge: getAgeMonths(child), focusArea: focusArea || 'general', tips });
  } catch (error) {
    console.error('Tip regenerate error:', error);
    res.status(500).json({ error: 'Failed to regenerate tips' });
  }
});

// ============ WHO SOURCES ============

router.get('/sources', async (req, res) => {
  try {
    const { context, analysisId, region } = req.query;

    let sources = whoDataService.getSources();
    if (region) sources = whoDataService.getSourcesForRegion(region);

    let taggedSources = sources.map((s) => ({ ...s, domain: s.domain || 'general' }));

    if (context) {
      const contextDomains = context.split(',').map((d) => d.trim().toLowerCase());
      taggedSources = taggedSources.filter(
        (s) => s.domain === 'general' || contextDomains.includes(s.domain)
      );
    }

    if (analysisId) {
      try {
        const analysis = await Analysis.findById(analysisId);
        if (analysis?.sources?.length > 0) {
          const analysisSources = analysis.sources.map((s) => ({
            title: s.title, url: s.url, type: s.type || 'analysis', domain: 'analysis',
          }));
          taggedSources = [...taggedSources, ...analysisSources];
        }
      } catch (lookupErr) {
        console.warn('Could not fetch analysis sources:', lookupErr.message);
      }
    }

    const methodology = [
      { step: 1, title: 'Data Collection', description: 'Photo/video analysis using Google Gemini AI trained on developmental indicators', icon: 'clipboard-list' },
      { step: 2, title: 'WHO Benchmark Comparison', description: 'Assessment results compared against WHO Child Growth Standards and CDC Developmental Milestones', icon: 'git-compare' },
      { step: 3, title: 'AI-Powered Analysis', description: 'Machine learning models identify developmental patterns and generate personalized recommendations', icon: 'brain' },
    ];

    const disclaimer = 'TinySteps AI assessments are for informational purposes only and do not constitute medical advice. '
      + 'Always consult your pediatrician or qualified healthcare provider for professional guidance on your child\'s development.';

    res.json({ sources: taggedSources, methodology, disclaimer });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

export default router;

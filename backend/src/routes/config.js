import express from 'express';
import {
  DOMAIN_CONFIG,
  STATUS_CONFIG,
  SCORE_THRESHOLDS,
  PERCENTILE_THRESHOLDS,
  TIME_FILTERS,
  SUPPORTED_LANGUAGES,
  RECIPE_CATEGORIES,
  REGION_CUISINE_MAP,
} from '../config/appConfig.js';

const router = express.Router();

// Re-export for any existing consumers that import from routes/config.js
export {
  DOMAIN_CONFIG,
  STATUS_CONFIG,
  SCORE_THRESHOLDS,
  PERCENTILE_THRESHOLDS,
  TIME_FILTERS,
  SUPPORTED_LANGUAGES,
  RECIPE_CATEGORIES,
  REGION_CUISINE_MAP,
};

// GET /api/config - Returns all app configuration
router.get('/', (req, res) => {
  res.json({
    domains: DOMAIN_CONFIG,
    statuses: STATUS_CONFIG,
    scoreThresholds: SCORE_THRESHOLDS,
    percentileThresholds: PERCENTILE_THRESHOLDS,
    timeFilters: TIME_FILTERS,
    supportedLanguages: SUPPORTED_LANGUAGES,
    recipeCategories: RECIPE_CATEGORIES,
    regionCuisineMap: REGION_CUISINE_MAP,
  });
});

router.get('/domains', (req, res) => { res.json({ domains: DOMAIN_CONFIG }); });
router.get('/statuses', (req, res) => { res.json({ statuses: STATUS_CONFIG }); });

export default router;

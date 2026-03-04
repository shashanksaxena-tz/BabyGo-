import express from 'express';

const router = express.Router();

// Domain configuration - single source of truth for all frontends
export const DOMAIN_CONFIG = {
  motor: { key: 'motor', label: 'Motor Skills', emoji: '🏃', color: '#3b82f6', assessmentKey: 'motorAssessment', description: 'Gross and fine motor development' },
  cognitive: { key: 'cognitive', label: 'Cognitive', emoji: '🧠', color: '#8b5cf6', assessmentKey: 'cognitiveAssessment', description: 'Problem solving, memory, and learning' },
  language: { key: 'language', label: 'Language', emoji: '💬', color: '#ec4899', assessmentKey: 'languageAssessment', description: 'Speech, comprehension, and communication' },
  social: { key: 'social', label: 'Social & Emotional', emoji: '❤️', color: '#f59e0b', assessmentKey: 'socialAssessment', description: 'Relationships, emotions, and self-regulation' },
  sensory: { key: 'sensory', label: 'Sensory', emoji: '👁️', color: '#06b6d4', assessmentKey: 'sensoryAssessment', description: 'Visual, auditory, and tactile processing' },
};

export const STATUS_CONFIG = {
  ahead: { label: 'Ahead', color: '#059669', bgColor: '#d1fae5', borderColor: '#a7f3d0', severity: 0 },
  on_track: { label: 'On Track', color: '#10b981', bgColor: '#d1fae5', borderColor: '#a7f3d0', severity: 1 },
  on_track_with_monitoring: { label: 'On Track (Monitoring)', color: '#0ea5e9', bgColor: '#e0f2fe', borderColor: '#bae6fd', severity: 2 },
  emerging: { label: 'Emerging', color: '#f59e0b', bgColor: '#fef3c7', borderColor: '#fde68a', severity: 3 },
  needs_support: { label: 'Needs Support', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#fecaca', severity: 4 },
};

export const SCORE_THRESHOLDS = {
  excellent: { min: 70, color: '#10b981', label: 'Excellent' },
  moderate: { min: 50, color: '#f59e0b', label: 'Moderate' },
  concern: { min: 0, color: '#ef4444', label: 'Needs Attention' },
};

export const PERCENTILE_THRESHOLDS = [
  { max: 3, label: 'Below typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
  { max: 15, label: 'Lower end of typical', advice: 'Monitor growth trend over time', status: 'monitor' },
  { max: 85, label: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' },
  { max: 97, label: 'Higher end of typical', advice: 'Monitor growth trend over time', status: 'monitor' },
  { max: 100, label: 'Above typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
];

export const TIME_FILTERS = [
  { id: '1W', label: '1 Week', days: 7 },
  { id: '1M', label: '1 Month', days: 30 },
  { id: '3M', label: '3 Months', days: 90 },
  { id: '6M', label: '6 Months', days: 180 },
  { id: 'ALL', label: 'All Time', days: null },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'od-IN', label: 'Odia' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
];

export const RECIPE_CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🥣' },
  { id: 'lunch', label: 'Lunch', emoji: '🍲' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'snack', label: 'Snacks', emoji: '🍪' },
  { id: 'puree', label: 'Purees', emoji: '🥑' },
  { id: 'fingerFood', label: 'Finger Foods', emoji: '🫐' },
];

export const REGION_CUISINE_MAP = {
  'IN': { name: 'Indian', description: 'dal, khichdi, roti, rice dishes, mild spices' },
  'US': { name: 'American', description: 'varied, include familiar comfort foods' },
  'GB': { name: 'British', description: 'traditional weaning foods' },
  'CN': { name: 'Chinese', description: 'congee, steamed dishes, mild flavors' },
  'JP': { name: 'Japanese', description: 'rice porridge, tofu, gentle flavors' },
  'KR': { name: 'Korean', description: 'juk (rice porridge), mild banchan' },
  'MX': { name: 'Mexican', description: 'beans, soft tortillas, mild salsas' },
  'BR': { name: 'Brazilian', description: 'beans, rice, tropical fruits' },
  'DE': { name: 'German', description: 'soft breads, vegetable purees' },
  'FR': { name: 'French', description: 'vegetable purees, soft cheeses' },
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

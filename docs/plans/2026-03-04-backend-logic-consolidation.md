# Backend Logic Consolidation - Move All Business Logic from Frontends to Backend

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate all business logic into the backend API so Flutter, React Web, and Desktop frontends are pure UI layers consuming the same endpoints.

**Architecture:** Enrich backend services and responses so frontends never need hardcoded business rules, WHO data, or direct AI calls. Add missing endpoints, merge best features from all 3 frontends, then strip frontend services down to API calls only.

**Tech Stack:** Node.js/Express backend, MongoDB, Gemini 2.5-flash, existing frontend API service patterns (fetch/axios/http).

---

## Phase 1: Backend - Enrich Existing Endpoints & Models

### Task 1: Expand Analysis Model Schema for Merged Features

**Files:**
- Modify: `backend/src/models/Analysis.js`

**Step 1: Update the `overallStatus` enum to include `ahead`**

In `analysisSchema`, change the `overallStatus` enum from:
```javascript
overallStatus: {
  type: String,
  required: true,
  enum: ['on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
},
```
to:
```javascript
overallStatus: {
  type: String,
  required: true,
  enum: ['ahead', 'on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
},
```

**Step 2: Update `domainAssessmentSchema` status enum to match**

Change the `status` enum in `domainAssessmentSchema` from:
```javascript
status: {
  type: String,
  required: true,
  enum: ['on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
},
```
to:
```javascript
status: {
  type: String,
  required: true,
  enum: ['ahead', 'on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
},
```

**Step 3: Add new fields to `analysisSchema` for merged Web features**

Add these fields after the existing `activities` field:
```javascript
// Structured tips (merged from Web's richer format)
structuredTips: [{
  category: { type: String, enum: ['sleep', 'feeding', 'behavior', 'safety', 'development', 'health', 'bonding'] },
  title: String,
  description: String,
  priority: { type: String, enum: ['high', 'medium', 'low'] },
}],

// Activity tracking (from Web)
activityProfile: {
  pattern: String,
  description: String,
  engagementLevel: String,
  focusDuration: String,
  playStyle: String,
},

// Warnings (from Web)
warnings: [String],

// Baby sound analysis data
babySoundAnalysis: {
  vocalizations: [{
    type: String,
    description: String,
    developmentalSignificance: String,
  }],
  languageObservations: [String],
  recommendations: [String],
},
```

**Step 4: Update `mapStatus` in `backend/src/routes/analysis.js`**

Update the status mapping function to handle `ahead`:
```javascript
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
```

**Step 5: Commit**
```bash
git add backend/src/models/Analysis.js backend/src/routes/analysis.js
git commit -m "feat: expand Analysis model with ahead status, structured tips, activity profile, warnings, and baby sound analysis fields"
```

---

### Task 2: Create `/api/config` Endpoint for Domain Config & Status Metadata

**Files:**
- Create: `backend/src/routes/config.js`
- Modify: `backend/src/index.js` (register route)

**Step 1: Create the config route**

Create `backend/src/routes/config.js`:
```javascript
const express = require('express');
const router = express.Router();

// Domain configuration - single source of truth
const DOMAIN_CONFIG = {
  motor: {
    key: 'motor',
    label: 'Motor Skills',
    emoji: '🏃',
    color: '#3b82f6',
    assessmentKey: 'motorAssessment',
    description: 'Gross and fine motor development',
  },
  cognitive: {
    key: 'cognitive',
    label: 'Cognitive',
    emoji: '🧠',
    color: '#8b5cf6',
    assessmentKey: 'cognitiveAssessment',
    description: 'Problem solving, memory, and learning',
  },
  language: {
    key: 'language',
    label: 'Language',
    emoji: '💬',
    color: '#ec4899',
    assessmentKey: 'languageAssessment',
    description: 'Speech, comprehension, and communication',
  },
  social: {
    key: 'social',
    label: 'Social & Emotional',
    emoji: '❤️',
    color: '#f59e0b',
    assessmentKey: 'socialAssessment',
    description: 'Relationships, emotions, and self-regulation',
  },
  sensory: {
    key: 'sensory',
    label: 'Sensory',
    emoji: '👁️',
    color: '#06b6d4',
    assessmentKey: 'sensoryAssessment',
    description: 'Visual, auditory, and tactile processing',
  },
};

// Status configuration with display metadata
const STATUS_CONFIG = {
  ahead: { label: 'Ahead', color: '#059669', bgColor: '#d1fae5', borderColor: '#a7f3d0', severity: 0 },
  on_track: { label: 'On Track', color: '#10b981', bgColor: '#d1fae5', borderColor: '#a7f3d0', severity: 1 },
  on_track_with_monitoring: { label: 'On Track (Monitoring)', color: '#0ea5e9', bgColor: '#e0f2fe', borderColor: '#bae6fd', severity: 2 },
  emerging: { label: 'Emerging', color: '#f59e0b', bgColor: '#fef3c7', borderColor: '#fde68a', severity: 3 },
  needs_support: { label: 'Needs Support', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#fecaca', severity: 4 },
};

// Score interpretation thresholds
const SCORE_THRESHOLDS = {
  excellent: { min: 70, color: '#10b981', label: 'Excellent' },
  moderate: { min: 50, color: '#f59e0b', label: 'Moderate' },
  concern: { min: 0, color: '#ef4444', label: 'Needs Attention' },
};

// Percentile interpretation thresholds (WHO standard)
const PERCENTILE_THRESHOLDS = [
  { max: 3, label: 'Below typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
  { max: 15, label: 'Lower end of typical', advice: 'Monitor growth trend over time', status: 'monitor' },
  { max: 85, label: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' },
  { max: 97, label: 'Higher end of typical', advice: 'Monitor growth trend over time', status: 'monitor' },
  { max: 100, label: 'Above typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
];

// Time filter presets
const TIME_FILTERS = [
  { id: '1W', label: '1 Week', days: 7 },
  { id: '1M', label: '1 Month', days: 30 },
  { id: '3M', label: '3 Months', days: 90 },
  { id: '6M', label: '6 Months', days: 180 },
  { id: 'ALL', label: 'All Time', days: null },
];

// Supported languages for translation
const SUPPORTED_LANGUAGES = [
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

// Recipe categories
const RECIPE_CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🥣' },
  { id: 'lunch', label: 'Lunch', emoji: '🍲' },
  { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { id: 'snack', label: 'Snacks', emoji: '🍪' },
  { id: 'puree', label: 'Purees', emoji: '🥑' },
  { id: 'fingerFood', label: 'Finger Foods', emoji: '🫐' },
];

// Region-to-cuisine mapping (merged from Web's explicit mapping)
const REGION_CUISINE_MAP = {
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

// GET /api/config/domains
router.get('/domains', (req, res) => {
  res.json({ domains: DOMAIN_CONFIG });
});

// GET /api/config/statuses
router.get('/statuses', (req, res) => {
  res.json({ statuses: STATUS_CONFIG });
});

// Export configs for use in other backend services
module.exports = router;
module.exports.DOMAIN_CONFIG = DOMAIN_CONFIG;
module.exports.STATUS_CONFIG = STATUS_CONFIG;
module.exports.SCORE_THRESHOLDS = SCORE_THRESHOLDS;
module.exports.PERCENTILE_THRESHOLDS = PERCENTILE_THRESHOLDS;
module.exports.REGION_CUISINE_MAP = REGION_CUISINE_MAP;
```

**Step 2: Register the route in `backend/src/index.js`**

Add after existing route registrations:
```javascript
const configRoutes = require('./routes/config');
app.use('/api/config', configRoutes);
```

**Step 3: Commit**
```bash
git add backend/src/routes/config.js backend/src/index.js
git commit -m "feat: add /api/config endpoint for domain, status, and app configuration metadata"
```

---

### Task 3: Enrich `analyzeDevelopment` in Backend GeminiService

**Files:**
- Modify: `backend/src/services/geminiService.js`

**Step 1: Update the `analyzeDevelopment` prompt to include achieved milestones context and request richer response**

In `geminiService.js`, find the `analyzeDevelopment` method. Update the prompt construction to:

1. Accept an optional `achievedMilestones` parameter:
```javascript
async analyzeDevelopment(child, mediaData = [], audioData = null, achievedMilestones = []) {
```

2. Add achieved milestones context to the prompt (before the JSON format section):
```javascript
let achievedContext = '';
if (achievedMilestones && achievedMilestones.length > 0) {
  achievedContext = `\n\nALREADY ACHIEVED MILESTONES (do NOT re-suggest these, instead suggest building upon them):\n`;
  achievedContext += achievedMilestones.map(m => `- [ACHIEVED] ${m.title} (${m.domain})`).join('\n');
}
```

3. Update the expected JSON response format in the prompt to include:
```
"structuredTips": [
  { "category": "sleep|feeding|behavior|safety|development|health|bonding", "title": "...", "description": "...", "priority": "high|medium|low" }
],
"activityProfile": {
  "pattern": "...",
  "description": "...",
  "engagementLevel": "high|moderate|low",
  "focusDuration": "...",
  "playStyle": "..."
},
"warnings": ["any developmental concerns requiring professional attention"]
```

4. Update the status instruction to:
```
Use ONLY these status values: "ahead", "on_track", "on_track_with_monitoring", "emerging", "needs_support"
- "ahead": Child exceeds age-typical expectations
- "on_track": Meeting expected developmental milestones
- "on_track_with_monitoring": Generally on track but specific areas need watching
- "emerging": Skills are developing but behind typical timeline
- "needs_support": Significant delay requiring professional guidance
```

**Step 2: Update `_buildAnalysisResult` to extract new fields**

After the existing result construction, add extraction of new fields:
```javascript
// Extract new merged fields
if (parsed.structuredTips) {
  result.structuredTips = parsed.structuredTips;
}
if (parsed.activityProfile) {
  result.activityProfile = parsed.activityProfile;
}
if (parsed.warnings) {
  result.warnings = parsed.warnings;
}
```

**Step 3: Update the analysis route to pass achieved milestones**

In `backend/src/routes/analysis.js`, in the POST `/` handler, before calling `analyzeDevelopment`:
```javascript
// Fetch achieved milestones for context
const Child = require('../models/Child');
const childMilestones = child.achievedMilestones || [];
const achievedMilestoneContext = childMilestones.map(m => ({
  title: m.title || m.milestoneId,
  domain: m.domain || 'general',
}));

const analysisResult = await geminiService.analyzeDevelopment(child, mediaData, null, achievedMilestoneContext);
```

**Step 4: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/analysis.js
git commit -m "feat: enrich analyzeDevelopment with achieved milestones context, structured tips, activity profile, and warnings"
```

---

### Task 4: Add Trend Calculation & Chart Data Endpoint

**Files:**
- Modify: `backend/src/routes/analysis.js`

**Step 1: Add `GET /api/analysis/:childId/trends` endpoint**

Add this route after the existing `GET /:childId` route:
```javascript
// GET /api/analysis/:childId/trends?period=3M
router.get('/:childId/trends', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    const period = req.query.period || '3M';

    // Calculate date cutoff
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

    // Calculate trends (compare last 2 analyses)
    const TREND_THRESHOLD = 2;
    const domains = ['motor', 'cognitive', 'language', 'social'];
    const trends = {};

    if (analyses.length >= 2) {
      const latest = analyses[analyses.length - 1];
      const previous = analyses[analyses.length - 2];

      for (const domain of domains) {
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
      for (const domain of domains) {
        trends[domain] = { direction: 'stable', diff: 0, latestScore: 0, previousScore: 0 };
      }
    }

    // Milestone stats
    let achievedCount = 0;
    let upcomingCount = 0;
    for (const a of analyses) {
      for (const domain of domains) {
        const assessment = a[`${domain}Assessment`];
        achievedCount += assessment?.achievedMilestones?.length ?? 0;
        upcomingCount += assessment?.upcomingMilestones?.length ?? 0;
      }
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
```

**Step 2: Commit**
```bash
git add backend/src/routes/analysis.js
git commit -m "feat: add /api/analysis/:childId/trends endpoint for chart data, trends, and milestone stats"
```

---

### Task 5: Enrich Child Profile with Computed Age

**Files:**
- Modify: `backend/src/routes/children.js`

**Step 1: Add age computation to child responses**

Create a helper function at the top of `children.js`:
```javascript
function enrichChildWithAge(child) {
  const obj = child.toObject ? child.toObject() : { ...child };
  if (obj.dateOfBirth) {
    const now = new Date();
    const dob = new Date(obj.dateOfBirth);
    const ageInMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    const ageInDays = Math.floor((now - dob) / (1000 * 60 * 60 * 24));

    let displayAge;
    if (ageInMonths < 1) {
      displayAge = `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
    } else if (ageInMonths < 24) {
      displayAge = `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      displayAge = months > 0 ? `${years}y ${months}m` : `${years} year${years !== 1 ? 's' : ''}`;
    }

    obj.ageInMonths = ageInMonths;
    obj.ageInDays = ageInDays;
    obj.displayAge = displayAge;
  }
  return obj;
}
```

**Step 2: Apply to all child-returning endpoints**

In the GET `/` handler, change:
```javascript
res.json({ children });
```
to:
```javascript
res.json({ children: children.map(enrichChildWithAge) });
```

In the GET `/:id` handler, change:
```javascript
res.json({ child });
```
to:
```javascript
res.json({ child: enrichChildWithAge(child) });
```

Similarly for POST `/` and PUT `/:id` responses.

**Step 3: Commit**
```bash
git add backend/src/routes/children.js
git commit -m "feat: enrich child profile responses with computed ageInMonths, ageInDays, and displayAge"
```

---

## Phase 2: Backend - Add Missing Endpoints

### Task 6: Add Baby Sound Analysis Endpoint

**Files:**
- Modify: `backend/src/services/geminiService.js`
- Modify: `backend/src/routes/analysis.js`

**Step 1: Add `analyzeBabySounds` method to geminiService.js**

Add after the existing `analyzeDevelopment` method:
```javascript
async analyzeBabySounds(child, audioData) {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;

  const prompt = `You are a pediatric speech-language development expert. Analyze this baby audio recording for a ${ageMonths}-month-old ${child.gender || 'child'} named ${child.name}.

Evaluate the vocalizations for age-appropriate speech and language development based on WHO milestones.

Return JSON:
{
  "vocalizations": [
    {
      "type": "babbling|cooing|word_attempt|word|phrase|cry|laugh|other",
      "description": "Description of what you hear",
      "developmentalSignificance": "What this means for development"
    }
  ],
  "languageObservations": ["observation1", "observation2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "developmentStatus": "on_track|emerging|needs_support",
  "summary": "Brief overall assessment"
}`;

  const parts = [{ text: prompt }];
  if (audioData) {
    parts.push({
      inlineData: {
        data: audioData.data || audioData.base64,
        mimeType: audioData.mimeType || 'audio/webm',
      },
    });
  }

  const result = await this.model.generateContent(parts);
  const text = result.response.text();
  return this._parseJsonResponse(text);
}
```

**Step 2: Add route handler in `analysis.js`**

Add this route:
```javascript
// POST /api/analysis/baby-sounds
router.post('/baby-sounds', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { childId } = req.body;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No API key configured' });
    geminiService.initialize(apiKey);

    let audioData = null;
    if (req.file) {
      audioData = {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      };
    }

    const analysis = await geminiService.analyzeBabySounds(child, audioData);
    res.json({ message: 'Baby sound analysis complete', analysis });
  } catch (error) {
    console.error('Baby sound analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze baby sounds' });
  }
});
```

**Step 3: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/analysis.js
git commit -m "feat: add POST /api/analysis/baby-sounds endpoint for baby vocalization analysis"
```

---

### Task 7: Add Audio Transcription Endpoint

**Files:**
- Modify: `backend/src/services/geminiService.js`
- Modify: `backend/src/routes/analysis.js`

**Step 1: Add `transcribeAudio` method to geminiService.js**

```javascript
async transcribeAudio(audioData) {
  if (!this.model) throw new Error('Gemini service not initialized');

  const prompt = `Transcribe this audio recording. The speaker is a parent describing their child's behavior, activities, or development. Return the transcription as plain text, cleaning up any filler words or false starts for clarity.`;

  const parts = [
    { text: prompt },
    {
      inlineData: {
        data: audioData.data || audioData.base64,
        mimeType: audioData.mimeType || 'audio/webm',
      },
    },
  ];

  const result = await this.model.generateContent(parts);
  return result.response.text().trim();
}
```

**Step 2: Add route handler**

```javascript
// POST /api/analysis/transcribe
router.post('/transcribe', authMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No API key configured' });
    geminiService.initialize(apiKey);

    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const audioData = {
      data: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype,
    };

    const transcription = await geminiService.transcribeAudio(audioData);
    res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});
```

**Step 3: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/analysis.js
git commit -m "feat: add POST /api/analysis/transcribe endpoint for parent audio note transcription"
```

---

### Task 8: Add Story Illustration Generation Endpoint

**Files:**
- Modify: `backend/src/services/geminiService.js`
- Modify: `backend/src/routes/stories.js`

**Step 1: Update `generateIllustration` in geminiService.js**

The current method returns `null` because text models can't generate images. Update to use Gemini's image generation model:
```javascript
async generateIllustration(prompt, childPhotoBase64 = null, childPhotoMime = 'image/jpeg') {
  if (!this.model) throw new Error('Gemini service not initialized');

  const styledPrompt = `Create a children's storybook illustration in a warm, friendly, watercolor-pastel style.
The scene: ${prompt}
Style: Soft colors, gentle lighting, child-friendly, no scary elements. Suitable for a bedtime storybook. Round shapes, warm tones.`;

  const parts = [{ text: styledPrompt }];

  // If child photo provided, include for appearance reference
  if (childPhotoBase64) {
    parts.unshift({
      inlineData: {
        data: childPhotoBase64,
        mimeType: childPhotoMime,
      },
    });
    parts[parts.length - 1].text += '\nBase the main child character appearance on the provided photo.';
  }

  try {
    // Try image generation model
    const imageModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });
    const result = await imageModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['image', 'text'] },
    });

    // Extract image from response
    const response = result.response;
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Illustration generation error:', error.message);
    return null;
  }
}
```

**Step 2: Add dedicated illustration endpoint in stories.js**

```javascript
// POST /api/stories/illustration
router.post('/illustration', authMiddleware, async (req, res) => {
  try {
    const { prompt, childPhotoBase64, childPhotoMime } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Illustration prompt required' });

    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No API key configured' });
    geminiService.initialize(apiKey);

    const imageResult = await geminiService.generateIllustration(prompt, childPhotoBase64, childPhotoMime);

    if (!imageResult) {
      return res.status(500).json({ error: 'Failed to generate illustration' });
    }

    // Upload to MinIO
    const filename = `illustration-${Date.now()}.png`;
    const buffer = Buffer.from(imageResult.data, 'base64');
    const url = await storageService.uploadBuffer('story-illustrations', buffer, imageResult.mimeType, filename);

    res.json({ url, mimeType: imageResult.mimeType });
  } catch (error) {
    console.error('Illustration endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate illustration' });
  }
});
```

**Step 3: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/stories.js
git commit -m "feat: add POST /api/stories/illustration endpoint with Gemini image generation"
```

---

### Task 9: Add Dedicated Activity Recommendations Endpoint

**Files:**
- Modify: `backend/src/services/geminiService.js`
- Modify: `backend/src/routes/recommendations.js`

**Step 1: Add `generateActivities` method to geminiService.js**

```javascript
async generateActivities(child, domain = null, achievedMilestones = []) {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;

  let achievedContext = '';
  if (achievedMilestones.length > 0) {
    achievedContext = `\nAlready achieved milestones (suggest building upon these, DO NOT re-suggest):\n`;
    achievedContext += achievedMilestones.map(m => `- ${m.title}`).join('\n');
  }

  const domainFilter = domain ? `Focus on the "${domain}" development domain.` : 'Cover all 4 domains: motor, cognitive, language, social.';

  const prompt = `You are a child development expert. Generate 8 age-appropriate developmental activities for a ${ageMonths}-month-old child named ${child.name}.

${domainFilter}
${achievedContext}

Use common household items only. Each activity should last 10-20 minutes.

Return JSON array:
[
  {
    "title": "Activity name",
    "description": "How to do the activity",
    "domain": "motor|cognitive|language|social",
    "duration": "10-15 min",
    "materials": ["item1", "item2"],
    "skills": ["skill being developed"],
    "difficulty": "easy|medium|challenging",
    "milestoneTarget": "Which milestone this helps achieve"
  }
]`;

  const result = await this.model.generateContent(prompt);
  const text = result.response.text();
  const parsed = this._parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : parsed.activities || [];
}
```

**Step 2: Add route in recommendations.js**

Replace the existing `/activities/:childId` handler with an enhanced version:
```javascript
// GET /api/recommendations/activities/:childId?domain=motor
router.get('/activities/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'No API key configured' });
    geminiService.initialize(apiKey);

    const domain = req.query.domain || null;
    const achievedMilestones = child.achievedMilestones || [];

    const activities = await geminiService.generateActivities(child, domain, achievedMilestones);

    // Get related milestones from WHO data
    const whoDataService = require('../services/whoDataService');
    const ageMonths = child.ageInMonths || Math.floor((Date.now() - new Date(child.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44));
    const relatedMilestones = domain
      ? whoDataService.getMilestonesByDomain(domain, ageMonths).slice(0, 5)
      : whoDataService.getMilestonesForAge(ageMonths).slice(0, 10);

    res.json({
      childAge: ageMonths,
      domain: domain || 'all',
      activities,
      relatedMilestones,
    });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to generate activities' });
  }
});
```

**Step 3: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/recommendations.js
git commit -m "feat: add dedicated activity recommendations with domain filtering and milestone context"
```

---

### Task 10: Enrich Recipe Generation with Regional Cuisine & Detailed Nutrition

**Files:**
- Modify: `backend/src/services/geminiService.js`

**Step 1: Update `generateRecipes` method**

Update the method to use regional cuisine mapping and return detailed nutrition:
```javascript
async generateRecipes(child, count = 6, filters = {}) {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;
  const { REGION_CUISINE_MAP } = require('../routes/config');

  // Regional cuisine context
  const region = child.region || 'IN';
  const cuisine = REGION_CUISINE_MAP[region];
  const cuisineContext = cuisine
    ? `Prioritize ${cuisine.name} cuisine (${cuisine.description}) using locally available ingredients.`
    : 'Use common, widely available ingredients.';

  // Filter context
  let filterContext = '';
  if (filters.excludeAllergens?.length) {
    filterContext += `\nCRITICAL ALLERGEN RESTRICTIONS - EXCLUDE entirely, do not use any ingredients containing: ${filters.excludeAllergens.join(', ')}`;
  }
  if (filters.dietaryPreferences?.length) {
    filterContext += `\nDietary preferences: ${filters.dietaryPreferences.join(', ')}`;
  }
  if (filters.foodLikings) {
    filterContext += `\nChild's food preferences/likings: ${filters.foodLikings}`;
  }

  const prompt = `You are a pediatric nutritionist. Generate ${count} age-appropriate recipes for a ${ageMonths}-month-old child.

${cuisineContext}
Follow WHO/UNICEF infant and young child feeding guidelines for texture and consistency.
${filterContext}

Include a mix of meal types: breakfast, lunch, dinner, and snacks.

Return JSON array:
[
  {
    "name": "Recipe name",
    "description": "Brief description",
    "mealType": "breakfast|lunch|dinner|snack",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"],
    "prepTime": "10 min",
    "cookTime": "15 min",
    "difficulty": "easy|medium",
    "allergens": ["dairy", "gluten"],
    "nutrition": {
      "calories": 150,
      "protein": "5g",
      "fiber": "2g",
      "iron": "1mg"
    },
    "nutritionHighlights": ["Rich in iron", "Good source of protein"],
    "ageAppropriate": "6-12 months",
    "texture": "smooth puree|chunky puree|soft pieces|finger food"
  }
]`;

  const result = await this.model.generateContent(prompt);
  const text = result.response.text();
  const parsed = this._parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : parsed.recipes || [];
}
```

**Step 2: Commit**
```bash
git add backend/src/services/geminiService.js
git commit -m "feat: enrich recipe generation with regional cuisine mapping and detailed nutrition info"
```

---

### Task 11: Enrich Story Generation with Photo Personalization, Characters, Duration

**Files:**
- Modify: `backend/src/services/geminiService.js`

**Step 1: Update `generateBedtimeStory` to accept child photo and return richer structure**

Update the method signature and prompt:
```javascript
async generateBedtimeStory(child, theme, childPhotoBase64 = null, childPhotoMime = 'image/jpeg') {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;
  const interests = child.interests?.join(', ') || 'exploring, playing';
  const favoriteCharacters = child.favoriteCharacters?.join(', ') || '';

  let photoDescription = '';
  if (childPhotoBase64) {
    try {
      photoDescription = await this.describeImage(childPhotoBase64, childPhotoMime);
      photoDescription = `\nChild's appearance (use for story character): ${photoDescription}`;
    } catch (e) {
      console.warn('Could not describe child photo:', e.message);
    }
  }

  const themeName = typeof theme === 'object' ? theme.name : theme;
  const themeDesc = typeof theme === 'object' ? theme.description : '';

  const prompt = `You are a children's storybook author. Create a magical bedtime story for ${child.name}, a ${ageMonths}-month-old child.

Theme: ${themeName}${themeDesc ? ` - ${themeDesc}` : ''}
Child's interests: ${interests}
${favoriteCharacters ? `Favorite characters: ${favoriteCharacters}` : ''}
${photoDescription}

Requirements:
- ${child.name} is the protagonist and appears on every page
- 4-6 pages, each with engaging text and a vivid illustration description
- Age-appropriate language and concepts
- Calming, positive tone leading toward sleep
- Include a gentle moral/lesson
- Reading time: 3-5 minutes

Return JSON:
{
  "title": "Story title",
  "theme": "${themeName}",
  "duration": 4,
  "characters": [
    { "name": "${child.name}", "role": "protagonist", "description": "Brief description", "basedOnChild": true },
    { "name": "Supporting character", "role": "friend|guide|companion", "description": "Brief description", "basedOnChild": false }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "Story text for this page...",
      "illustrationPrompt": "Detailed scene description for illustration, including ${child.name}'s appearance"
    }
  ],
  "moral": "The gentle lesson of the story"
}`;

  const result = await this.model.generateContent(prompt);
  const text = result.response.text();
  const parsed = this._parseJsonResponse(text);

  return {
    title: parsed.title,
    theme: parsed.theme || themeName,
    duration: parsed.duration || 4,
    characters: parsed.characters || [],
    pages: parsed.pages || [],
    moral: parsed.moral,
    childAgeAtCreation: ageMonths,
  };
}
```

**Step 2: Update story route POST `/` to accept optional childPhoto**

In `stories.js`, update the POST handler to accept photo:
```javascript
const { childId, themeId, childPhotoBase64, childPhotoMime } = req.body;
// ... existing validation ...
const storyData = await geminiService.generateBedtimeStory(child, theme, childPhotoBase64, childPhotoMime);
```

**Step 3: Commit**
```bash
git add backend/src/services/geminiService.js backend/src/routes/stories.js
git commit -m "feat: enrich story generation with photo personalization, characters array, and duration"
```

---

### Task 12: Enrich Parenting Tips with Sources and Action Steps

**Files:**
- Modify: `backend/src/services/geminiService.js`

**Step 1: Update `generateParentingTips` to return richer structure**

```javascript
async generateParentingTips(child, focusArea = null) {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;
  const region = child.region || 'IN';
  const focusContext = focusArea && focusArea !== 'general' ? `Focus primarily on: ${focusArea}` : 'Cover a variety of categories.';

  const prompt = `You are a pediatric development expert. Generate 6 personalized parenting tips for a parent of a ${ageMonths}-month-old child named ${child.name}.

${focusContext}
Be culturally sensitive to the ${region} region.

Categories: sleep, feeding, behavior, safety, development, health, bonding

Return JSON array:
[
  {
    "title": "Tip title",
    "description": "Detailed actionable advice",
    "category": "sleep|feeding|behavior|safety|development|health|bonding",
    "emoji": "relevant emoji",
    "priority": "high|medium|low",
    "actionSteps": ["Step 1", "Step 2"],
    "source": "WHO/AAP/CDC or expert source name",
    "sourceUrl": "URL if available, otherwise null"
  }
]`;

  const result = await this.model.generateContent(prompt);
  const text = result.response.text();
  const parsed = this._parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : parsed.tips || [];
}
```

**Step 2: Commit**
```bash
git add backend/src/services/geminiService.js
git commit -m "feat: enrich parenting tips with source attribution, action steps, and priority"
```

---

### Task 13: Enrich Product Recommendations with Price Ranges

**Files:**
- Modify: `backend/src/services/geminiService.js`

**Step 1: Update `generateRecommendations` prompt for products**

Update the product-specific branch of `generateRecommendations`:
```javascript
async generateRecommendations(child, category = 'toys') {
  if (!this.model) throw new Error('Gemini service not initialized');

  const ageMonths = child.ageInMonths || child.ageMonths || 12;
  const interests = child.interests?.join(', ') || 'general play';

  const prompt = `You are a child development product expert. Recommend 6 age-appropriate ${category} for a ${ageMonths}-month-old child named ${child.name}.

Child's interests: ${interests}
Age range to target: ${Math.max(0, ageMonths - 3)} to ${ageMonths + 6} months

Include a mix of categories: toys, books, educational, outdoor, sensory.

Return JSON array:
[
  {
    "name": "Product name",
    "emoji": "relevant emoji",
    "description": "Why this is good",
    "category": "toys|books|educational|outdoor|sensory|safety",
    "developmentAreas": ["motor", "cognitive"],
    "whyRecommended": "Specific developmental benefit",
    "ageRange": "${Math.max(0, ageMonths - 3)}-${ageMonths + 6} months",
    "priceRange": "$10-$25"
  }
]`;

  const result = await this.model.generateContent(prompt);
  const text = result.response.text();
  const parsed = this._parseJsonResponse(text);
  return Array.isArray(parsed) ? parsed : parsed.recommendations || [];
}
```

**Step 2: Commit**
```bash
git add backend/src/services/geminiService.js
git commit -m "feat: enrich product recommendations with emoji, price range, and age targeting"
```

---

### Task 14: Merge WHO Milestone Data (Union of All Sources)

**Files:**
- Modify: `backend/src/services/whoDataService.js`

**Step 1: Audit and merge milestone data**

This is a data merge task. The agent should:
1. Read all milestones from Web's `whoDataService.ts`, Flutter's `who_data_service.dart`, and Backend's `whoDataService.js`
2. Create a union set keyed by milestone `id`
3. For duplicates, prefer the version with the most detail (longer description, more precise age ranges)
4. Add any milestones that exist in Web/Flutter but not Backend
5. Ensure sensory domain is included in `getMilestonesByDomain()` (currently excluded in backend)

**Step 2: Fix `getMilestonesByDomain` to include sensory**

Update the domain mapping in `getMilestonesByDomain`:
```javascript
getMilestonesByDomain(domain, ageMonths) {
  const domainMap = {
    motor: MOTOR_MILESTONES,
    language: LANGUAGE_MILESTONES,
    cognitive: COGNITIVE_MILESTONES,
    social: SOCIAL_MILESTONES,
    sensory: SENSORY_MILESTONES,
  };
  // ... rest of method
}
```

**Step 3: Standardize age window filtering to +3 months (Backend standard)**

Verify all milestone query methods use `maxMonths + 3` consistently (not Flutter's +6).

**Step 4: Commit**
```bash
git add backend/src/services/whoDataService.js
git commit -m "feat: merge WHO milestones from all frontends into union set, add sensory domain support"
```

---

## Phase 3: Frontend Cleanup - React Web App (`tinysteps-ai`)

### Task 15: Remove `geminiService.ts` and Wire to Backend API

**Files:**
- Delete: `tinysteps-ai/services/geminiService.ts`
- Modify: `tinysteps-ai/services/apiService.ts`
- Modify: All components that import from `geminiService`

**Step 1: Add missing API methods to `apiService.ts`**

Add these methods to the ApiService class:
```typescript
// Baby sound analysis
async analyzeBabySounds(childId: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('childId', childId);
  formData.append('audio', audioBlob);
  return this.request<any>('/analysis/baby-sounds', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set content-type for FormData
  });
}

// Audio transcription
async transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  return this.request<{ transcription: string }>('/analysis/transcribe', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

// Story illustration
async generateIllustration(prompt: string, childPhotoBase64?: string) {
  return this.request<{ url: string }>('/stories/illustration', {
    method: 'POST',
    body: JSON.stringify({ prompt, childPhotoBase64 }),
  });
}

// App config
async getAppConfig() {
  return this.request<any>('/config');
}

// Trends & chart data
async getAnalysisTrends(childId: string, period: string = '3M') {
  return this.request<any>(`/analysis/${childId}/trends?period=${period}`);
}
```

**Step 2: Update all components importing from geminiService**

Search for all imports of `geminiService` and replace with `apiService` calls. Key files:
- `components/MediaUploader.tsx` - `analyzeBabySounds` -> `apiService.analyzeBabySounds()`
- `components/HomeDashboard.tsx` - Remove WHO data imports, use API data
- `components/DevelopmentInsightsView.tsx` - Use `/trends` endpoint instead of local calculation
- `components/GrowthChartsView.tsx` - Remove hardcoded WHO data, use API
- `components/CustomStoryBuilder.tsx` - Use API for story generation

**Step 3: Delete `geminiService.ts`**

**Step 4: Remove `VITE_GEMINI_API_KEY` from `.env` and `.env.example`**

**Step 5: Commit**
```bash
git add -A tinysteps-ai/
git commit -m "refactor: remove frontend Gemini service, wire all AI calls through backend API"
```

---

### Task 16: Remove `whoDataService.ts` from React Web App

**Files:**
- Delete: `tinysteps-ai/services/whoDataService.ts`
- Modify: All components importing from `whoDataService`

**Step 1: Replace all `whoDataService` imports with API calls**

Components to update:
- `HomeDashboard.tsx` - Replace `getMilestonesForAge()`, `getUpcomingMilestones()`, `assessGrowth()` with data from API responses
- `MilestonesView.tsx` - Use `/api/analysis/milestones/:ageMonths` endpoint
- `GrowthChartsView.tsx` - Remove hardcoded percentile tables, use `/api/analysis/growth-percentiles` and `/api/analysis/growth-curves`

**Step 2: Delete `whoDataService.ts`**

**Step 3: Commit**
```bash
git add -A tinysteps-ai/
git commit -m "refactor: remove frontend WHO data service, use backend API for milestones and growth data"
```

---

### Task 17: Remove Hardcoded Business Logic from React Web Components

**Files:**
- Modify: `tinysteps-ai/components/DevelopmentInsightsView.tsx`
- Modify: `tinysteps-ai/components/HomeDashboard.tsx`
- Modify: `tinysteps-ai/components/GrowthChartsView.tsx`

**Step 1: Fetch config from `/api/config` and use for domain colors, status labels**

Replace hardcoded `DOMAIN_CONFIG`, `getStatusLabel()`, `getStatusColors()` with data from `/api/config` response. Store in React context or fetch on mount.

**Step 2: Replace local trend calculation with `/api/analysis/:childId/trends`**

Remove `getFilteredAnalyses()`, `getTrend()`, `chartData` memo, `milestoneStats` memo. Use the trends endpoint.

**Step 3: Replace local time filtering with backend `?period=` param**

Instead of filtering analyses client-side, pass the period to the API.

**Step 4: Commit**
```bash
git add -A tinysteps-ai/
git commit -m "refactor: remove hardcoded business rules from React components, use /api/config and /api/trends"
```

---

## Phase 4: Frontend Cleanup - Flutter App (`tinysteps_flutter`)

### Task 18: Remove `gemini_service.dart` and Wire to Backend API

**Files:**
- Delete: `tinysteps_flutter/lib/services/gemini_service.dart`
- Modify: `tinysteps_flutter/lib/services/api_service.dart`
- Modify: All screens importing `gemini_service.dart`

**Step 1: Add missing API methods to `api_service.dart`**

Add these methods:
```dart
// Baby sound analysis
Future<Map<String, dynamic>> analyzeBabySounds({required String childId, required String audioPath}) async {
  return _uploadFile('POST', '/analysis/baby-sounds', audioPath, fields: {'childId': childId});
}

// Audio transcription
Future<Map<String, dynamic>> transcribeAudio({required String audioPath}) async {
  return _uploadFile('POST', '/analysis/transcribe', audioPath);
}

// Story illustration
Future<Map<String, dynamic>> generateIllustration({required String prompt, String? childPhotoBase64}) async {
  return _request('POST', '/stories/illustration', body: {
    'prompt': prompt,
    if (childPhotoBase64 != null) 'childPhotoBase64': childPhotoBase64,
  });
}

// App config
Future<Map<String, dynamic>> getAppConfig() async {
  return _request('GET', '/config');
}

// Trends
Future<Map<String, dynamic>> getAnalysisTrends({required String childId, String period = '3M'}) async {
  return _request('GET', '/analysis/$childId/trends', queryParams: {'period': period});
}

// Dedicated activities
Future<Map<String, dynamic>> getDetailedActivities({required String childId, String? domain}) async {
  return _request('GET', '/recommendations/activities/$childId',
    queryParams: domain != null ? {'domain': domain} : null);
}
```

**Step 2: Update all screens to use API instead of direct Gemini**

Key screens to update:
- `screens/discover/recommendations_screen.dart` - Replace `GeminiService()` calls with `ApiService()` calls
- `screens/analysis/` - Use API for analysis
- `screens/stories/` - Use API for story generation
- `screens/discover/recipes_screen.dart` - Use API

**Step 3: Remove `google_generative_ai` dependency from `pubspec.yaml`**

**Step 4: Delete `gemini_service.dart`**

**Step 5: Commit**
```bash
git add -A tinysteps_flutter/
git commit -m "refactor: remove Flutter Gemini service, wire all AI calls through backend API"
```

---

### Task 19: Remove `who_data_service.dart` from Flutter App

**Files:**
- Delete: `tinysteps_flutter/lib/services/who_data_service.dart`
- Modify: All screens importing `who_data_service.dart`

**Step 1: Replace all `WhoDataService` usage with API calls**

Screens to update:
- `screens/home/home_screen.dart` - Use API for milestones and growth
- `screens/milestones/milestones_screen.dart` - Use `/api/analysis/milestones/:age`
- `screens/growth/growth_charts_screen.dart` - Use `/api/analysis/growth-percentiles` and `/api/analysis/growth-curves`

**Step 2: Delete `who_data_service.dart`**

**Step 3: Commit**
```bash
git add -A tinysteps_flutter/
git commit -m "refactor: remove Flutter WHO data service, use backend API for milestones and growth"
```

---

### Task 20: Remove Hardcoded Business Logic from Flutter Screens

**Files:**
- Modify: `tinysteps_flutter/lib/screens/home/home_screen.dart`
- Modify: `tinysteps_flutter/lib/models/child_profile.dart`
- Modify: Various screen files with hardcoded status mappings

**Step 1: Remove `_getStatusLabel()` from home_screen.dart - use backend-provided labels**

**Step 2: Remove `ageInMonths`, `ageInDays`, `displayAge` getters from `child_profile.dart` - use backend-computed values**

**Step 3: Remove hardcoded recipe categories from `recipes_screen.dart` - fetch from `/api/config`**

**Step 4: Remove hardcoded story themes from `bedtime_stories_screen.dart` - already fetched from `/api/stories/themes`**

**Step 5: Remove hardcoded `supportedLanguages` from `sarvam_service.dart` - fetch from `/api/config`**

**Step 6: Commit**
```bash
git add -A tinysteps_flutter/
git commit -m "refactor: remove hardcoded business logic from Flutter screens, use backend config"
```

---

## Phase 5: Frontend Cleanup - Desktop App (`desktop-frontend`)

### Task 21: Remove Hardcoded WHO Data from Desktop Frontend

**Files:**
- Modify: `desktop-frontend/src/pages/GrowthCharts.tsx`
- Modify: `desktop-frontend/src/pages/Milestones.tsx`

**Step 1: Remove `WHO_PERCENTILES_FALLBACK` (47 lines) from GrowthCharts.tsx**

Replace with API calls to `/api/analysis/growth-curves` and `/api/analysis/growth-percentiles`.

**Step 2: Remove `WHO_MILESTONES` (34 items) from Milestones.tsx**

Replace with API call to `/api/analysis/milestones/:ageMonths`.

**Step 3: Remove `getAgeMonths()` helper from both files - use `child.ageInMonths` from API**

**Step 4: Remove `getPercentileInterpretation()` from GrowthCharts.tsx - use backend-provided interpretation**

**Step 5: Commit**
```bash
git add desktop-frontend/src/pages/GrowthCharts.tsx desktop-frontend/src/pages/Milestones.tsx
git commit -m "refactor: remove hardcoded WHO data from desktop frontend, use backend API"
```

---

### Task 22: Remove Hardcoded Status Mappings & Domain Config from Desktop Frontend

**Files:**
- Modify: `desktop-frontend/src/pages/AnalysisResult.tsx`
- Modify: `desktop-frontend/src/pages/Insights.tsx`
- Modify: `desktop-frontend/src/pages/Reports.tsx`
- Modify: `desktop-frontend/src/pages/Recommendations.tsx`

**Step 1: Create a shared hook `useAppConfig` that fetches `/api/config` once and caches**

Create `desktop-frontend/src/hooks/useAppConfig.ts`:
```typescript
import { useState, useEffect } from 'react';
import api from '../api';

let cachedConfig: any = null;

export function useAppConfig() {
  const [config, setConfig] = useState(cachedConfig);

  useEffect(() => {
    if (cachedConfig) return;
    api.get('/config').then(res => {
      cachedConfig = res.data;
      setConfig(res.data);
    });
  }, []);

  return config;
}
```

**Step 2: Replace hardcoded `getStatusLabel()`, `getStatusColors()`, `getScoreColor()` in AnalysisResult.tsx**

Use `config.statuses[status]` for labels and colors.

**Step 3: Replace hardcoded `DOMAIN_CONFIG` in Insights.tsx and Recommendations.tsx**

Use `config.domains[key]` for labels, colors, emojis.

**Step 4: Replace local trend calculation in Insights.tsx with `/api/analysis/:childId/trends`**

Remove `filteredAnalyses`, `chartData`, `getTrend()`, `milestoneStats` memos. Fetch from API.

**Step 5: Replace `TIME_FILTERS` constant with `config.timeFilters`**

**Step 6: Remove status badge logic from Reports.tsx - use `config.statuses`**

**Step 7: Commit**
```bash
git add desktop-frontend/src/hooks/useAppConfig.ts desktop-frontend/src/pages/
git commit -m "refactor: remove hardcoded status mappings and domain config from desktop frontend, use /api/config"
```

---

### Task 23: Remove Milestone Filtering Logic from Desktop Frontend

**Files:**
- Modify: `desktop-frontend/src/pages/Milestones.tsx`

**Step 1: Move milestone categorization to backend**

Add query params to `/api/analysis/milestones/:ageMonths`:
- `?status=current` - milestones in active window
- `?status=upcoming` - milestones after current age
- `?status=achieved` - already achieved (cross-reference with child data)
- `?domain=motor` - filter by domain

**Step 2: Update backend `GET /milestones/:ageMonths` endpoint to support filters**

In `analysis.js`, update the milestones handler:
```javascript
router.get('/milestones/:ageMonths', async (req, res) => {
  const ageMonths = parseInt(req.params.ageMonths);
  const { domain, status, childId } = req.query;

  let milestones = whoDataService.getMilestonesForAge(ageMonths);

  if (domain) {
    milestones = milestones.filter(m => m.domain === domain);
  }

  // Get achieved milestones if childId provided
  let achievedIds = new Set();
  if (childId) {
    const child = await Child.findById(childId);
    if (child?.achievedMilestones) {
      achievedIds = new Set(child.achievedMilestones.map(m => m.milestoneId));
    }
  }

  // Categorize
  const current = milestones.filter(m => !achievedIds.has(m.id) && ageMonths >= m.minMonths && ageMonths <= m.maxMonths);
  const upcoming = milestones.filter(m => !achievedIds.has(m.id) && m.minMonths > ageMonths);
  const achieved = milestones.filter(m => achievedIds.has(m.id));

  // Progress calculation
  const progress = current.length > 0 ? (achieved.filter(m => ageMonths >= m.minMonths && ageMonths <= m.maxMonths).length / current.length) * 100 : 0;

  if (status === 'current') milestones = current;
  else if (status === 'upcoming') milestones = upcoming;
  else if (status === 'achieved') milestones = achieved;

  res.json({
    milestones,
    counts: { current: current.length, upcoming: upcoming.length, achieved: achieved.length, total: milestones.length },
    progress: Math.round(progress),
  });
});
```

**Step 3: Update Milestones.tsx to use categorized API response**

Remove local `filteredMilestones`, `currentMilestones`, `achievedCount`, `progress` calculations.

**Step 4: Commit**
```bash
git add backend/src/routes/analysis.js desktop-frontend/src/pages/Milestones.tsx
git commit -m "refactor: move milestone filtering and progress calculation to backend"
```

---

## Phase 6: Verification & Cleanup

### Task 24: Verify No Frontend Business Logic Remains

**Step 1: Search all frontends for remaining business logic**

Run grep searches across all 3 frontends:
```bash
# Check for remaining Gemini imports
grep -r "geminiService\|google_generative_ai\|VITE_GEMINI" tinysteps-ai/ tinysteps_flutter/ desktop-frontend/ --include="*.ts" --include="*.tsx" --include="*.dart"

# Check for remaining WHO data
grep -r "whoDataService\|WHO_MILESTONES\|WHO_PERCENTILES\|who_data_service" tinysteps-ai/ tinysteps_flutter/ desktop-frontend/ --include="*.ts" --include="*.tsx" --include="*.dart"

# Check for hardcoded status mappings
grep -r "on_track.*On Track\|getStatusLabel\|getStatusColors\|mapStatus" tinysteps-ai/ tinysteps_flutter/ desktop-frontend/ --include="*.ts" --include="*.tsx" --include="*.dart"

# Check for age calculation duplication
grep -r "getAgeMonths\|ageInMonths.*getFullYear\|ageInMonths.*year.*12" tinysteps-ai/ tinysteps_flutter/ desktop-frontend/ --include="*.ts" --include="*.tsx" --include="*.dart"
```

**Step 2: Fix any remaining issues found**

**Step 3: Commit**
```bash
git add -A
git commit -m "chore: verify and clean up remaining frontend business logic"
```

---

### Task 25: Update CLAUDE.md Feature Matrix

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the feature matrix to reflect consolidated architecture**

Update the table and add a note about the backend-first architecture.

**Step 2: Commit**
```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with consolidated backend-first architecture notes"
```

---

## Execution Notes

**Total Tasks:** 25
**Estimated Phases:**
- Phase 1 (Tasks 1-5): Backend enrichment - foundation
- Phase 2 (Tasks 6-14): Backend new endpoints + merges - the heavy lifting
- Phase 3 (Tasks 15-17): React web cleanup
- Phase 4 (Tasks 18-20): Flutter cleanup
- Phase 5 (Tasks 21-23): Desktop cleanup
- Phase 6 (Tasks 24-25): Verification

**Dependencies:**
- Phase 1 & 2 must complete before Phase 3-5
- Phases 3, 4, 5 are independent and can run in parallel
- Phase 6 runs after all others

**Testing approach:** After each backend task, verify endpoint works with curl. After each frontend task, verify the app still renders without console errors. Final verification in Task 24 catches stragglers.

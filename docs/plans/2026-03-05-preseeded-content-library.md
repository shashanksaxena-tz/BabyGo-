# Little Leap — Pre-Seeded Content Library + Bug Fixes + FE Parity

## Context

**Architecture shift:** Move from "generate everything on-the-fly with Gemini" to "pre-seeded content library (1000+ per category) with AI regeneration."

**Why:** Current system makes an AI call for every page load (recipes, tips, products, activities). This is slow, expensive, inconsistent, and not grounded in WHO standards. Pre-seeding gives instant load times, consistent quality, WHO-grounded content, and uses AI only for "refresh" operations.

**Additionally fixes:**
- Analysis save fails (structuredTips category enum missing domain values)
- Stories ignore child profile photo (backend should fetch from MinIO)
- Story prompts need age-appropriate adaptation using seeded activities
- Frontend parity gaps (Flutter missing custom stories, Desktop missing photo upload)

**NotebookLM integration:** User is building a WHO knowledge base in NotebookLM and will provide MCP access. Seed scripts are designed to work with any knowledge source — initially Gemini, switchable to NotebookLM when MCP is available.

---

## Phase 1: New Data Models

### 1A. Milestone Model (replaces hardcoded whoDataService arrays)

**File:** `backend/src/models/Milestone.js` (NEW)

```js
{
  uuid: String,              // UUIDv4, unique — used in API responses & cross-refs
  legacyId: String,          // e.g. 'head-control-tummy' — backward compat with Child.achievedMilestones
  title: String,
  description: String,
  domain: Enum ['motor', 'language', 'cognitive', 'social', 'sensory'],
  subDomain: String,         // 'gross_motor', 'fine_motor', 'receptive', 'expressive', etc.
  ageRangeStartMonths: Number,
  ageRangeEndMonths: Number,
  typicalMonths: Number,
  source: String,            // 'WHO', 'CDC', 'AAP'
  sourceUrl: String,
  tags: [String],
  isActive: { default: true }
}
// Indexes: { domain: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 }, { uuid: 1 unique }, { legacyId: 1 }
```

### 1B. Recipe Model (replaces RecipeCache)

**File:** `backend/src/models/Recipe.js` (NEW — note: RecipeCache.js stays temporarily)

```js
{
  name: String,
  description: String,
  mealType: Enum ['breakfast', 'lunch', 'dinner', 'snack', 'puree', 'fingerFood'],
  ageRangeStartMonths: Number,
  ageRangeEndMonths: Number,
  ingredients: [String],
  instructions: [String],
  prepTime: String,
  cookTime: String,
  difficulty: Enum ['easy', 'moderate', 'challenging'],
  allergens: [String],
  nutrition: { calories: Number, protein: String, fiber: String, iron: String },
  nutritionHighlights: [String],
  texture: String,           // 'smooth', 'mashed', 'soft_chunks', 'regular'
  region: String,            // 'IN', 'US', 'GB', 'global'
  tags: [String],
  isSeeded: { default: true },
  isActive: { default: true }
}
// Indexes: { ageRangeStartMonths: 1, ageRangeEndMonths: 1 }, { mealType: 1 }, { region: 1 }, { allergens: 1 }
```

### 1C. UserRecipeFavorite (junction table)

**File:** `backend/src/models/UserRecipeFavorite.js` (NEW)

```js
{
  userId: String,
  childId: String,
  recipeId: ObjectId ref 'Recipe',
  savedAt: { default: Date.now }
}
// Unique index: { userId: 1, childId: 1, recipeId: 1 }
```

### 1D. Tip Model

**File:** `backend/src/models/Tip.js` (NEW)

```js
{
  title: String,
  description: String,
  category: Enum ['sleep', 'feeding', 'behavior', 'safety', 'development', 'health', 'bonding', 'motor', 'language', 'cognitive', 'social'],
  ageRangeStartMonths: Number,
  ageRangeEndMonths: Number,
  actionSteps: [String],
  source: String,            // 'WHO', 'AAP', 'CDC'
  priority: Enum ['high', 'medium', 'low'],
  tags: [String],
  isActive: { default: true }
}
// Indexes: { category: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 }
```

### 1E. Product Model

**File:** `backend/src/models/Product.js` (NEW)

```js
{
  name: String,
  description: String,
  category: Enum ['toys', 'books', 'educational', 'outdoor', 'sensory', 'feeding', 'safety'],
  emoji: String,
  ageRangeStartMonths: Number,
  ageRangeEndMonths: Number,
  priceRange: String,
  developmentAreas: [String],   // ['motor', 'cognitive']
  whyRecommended: String,
  tags: [String],
  isActive: { default: true }
}
// Indexes: { category: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 }
```

### 1F. AgeActivity Model

**File:** `backend/src/models/AgeActivity.js` (NEW)

```js
{
  name: String,
  description: String,
  domain: Enum ['motor', 'language', 'cognitive', 'social', 'sensory'],
  ageRangeStartMonths: Number,
  ageRangeEndMonths: Number,
  category: Enum ['capability', 'interest', 'comprehension', 'play_style'],
  storyContext: String,         // how to reference in story prompts
  duration: String,
  materials: [String],
  skills: [String],
  steps: [String],
  difficulty: Enum ['easy', 'moderate', 'challenging'],
  relatedMilestoneUuids: [String],
  tags: [String],
  isActive: { default: true }
}
// Indexes: { domain: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 }, { category: 1 }
```

---

## Phase 2: Seed/Migration Scripts

All scripts follow the existing `001-seed-doctors.js` pattern: export `up()`, check `countDocuments` for idempotency, tracked by `Migration` model.

### Age Bracket System (shared across all seeds)

12 overlapping brackets, 0-60 months:

| # | Label | Start | End | Overlap |
|---|-------|-------|-----|---------|
| 1 | Newborn | 0 | 3 | — |
| 2 | Early Infant | 2 | 5 | 2-3 with #1 |
| 3 | Mid Infant | 4 | 7 | 4-5 with #2 |
| 4 | Late Infant | 6 | 9 | 6-7 with #3 |
| 5 | Pre-Toddler | 8 | 12 | 8-9 with #4 |
| 6 | Early Toddler | 10 | 15 | 10-12 with #5 |
| 7 | Mid Toddler | 13 | 18 | 13-15 with #6 |
| 8 | Late Toddler | 16 | 24 | 16-18 with #7 |
| 9 | Early Preschool | 20 | 30 | 20-24 with #8 |
| 10 | Mid Preschool | 27 | 36 | 27-30 with #9 |
| 11 | Late Preschool | 33 | 48 | 33-36 with #10 |
| 12 | Pre-Kindergarten | 42 | 60 | 42-48 with #11 |

### Script 002: Seed Milestones (static, no Gemini)

**File:** `backend/src/migrations/002-seed-milestones.js`

- Reads the 107 hardcoded milestones from `whoDataService.js` arrays
- Assigns UUIDv4 to each, maps old `id` → `legacyId`
- `insertMany` into `Milestone` collection
- Fast, no external API calls

### Script 003: Migrate Milestone IDs in Child documents

**File:** `backend/src/migrations/003-migrate-milestone-ids.js`

- Builds lookup: `{ legacyId → uuid }` from Milestone collection
- Updates all `Child.achievedMilestones[].milestoneId` and `Child.watchedMilestones[].milestoneId`
- Uses `bulkWrite` for efficiency

### Script 004: Seed Recipes (~1000+)

**File:** `backend/src/migrations/004-seed-recipes.js`

- For each bracket × region (IN, US, global) × mealType: generate 8-10 recipes via Gemini
- 12 brackets × 3 regions × 6 meal types × ~3 per combo = ~650+ recipes minimum
- Includes allergen labeling, texture progression (smooth→mashed→chunks→regular by age)
- Rate-limited: 1s delay between Gemini calls
- When NotebookLM MCP available: query for WHO nutrition guidelines per age → feed to Gemini as context

### Script 005: Seed Tips (~1000+)

**File:** `backend/src/migrations/005-seed-tips.js`

- For each bracket × category (11 categories): generate 8-10 tips
- 12 brackets × 11 categories × ~8 = ~1056 tips
- Include WHO/AAP/CDC source attribution
- Action steps per tip

### Script 006: Seed Products (~600+)

**File:** `backend/src/migrations/006-seed-products.js`

- For each bracket × product category (7): generate ~7 products
- 12 × 7 × 7 = ~588 products
- Include development areas mapping, age-appropriate recommendations

### Script 007: Seed Activities (~600+)

**File:** `backend/src/migrations/007-seed-activities.js`

- For each bracket × domain (5) × activity category (4): generate ~2-3
- 12 × 5 × 4 × 2.5 = ~600 activities
- Link to milestone UUIDs via `relatedMilestoneUuids`
- Include `storyContext` for story prompt integration

### Seed Generation Pattern (all Gemini-based scripts)

```js
async function generateBatch(bracket, context, count) {
  const prompt = `Generate ${count} age-appropriate [content type] for children aged ${bracket.start}-${bracket.end} months.

  WHO CONTEXT: [from NotebookLM or hardcoded guidelines]

  Return as JSON array with fields: [schema fields]

  Requirements:
  - Evidence-based, aligned with WHO child development standards
  - Age-appropriate for ${bracket.label} developmental stage
  - Include safety considerations
  - [content-specific requirements]`;

  const result = await geminiService.generateJSON(prompt);
  return result.map(item => ({ ...item, ageRangeStartMonths: bracket.start, ageRangeEndMonths: bracket.end }));
}
```

---

## Phase 3: API Updates

### 3A. Milestones — Switch from hardcoded to DB

**File:** `backend/src/routes/analysis.js` (line ~77, GET /milestones/:ageMonths)

Current: `whoDataService.getMilestonesForAge(ageMonths)`
New: `Milestone.find({ isActive: true, ageRangeStartMonths: { $lte: ageMonths + 3 }, ageRangeEndMonths: { $gte: ageMonths - 3 } })`

**Milestone range logic:**
- **Current** = `ageMonths - 3` to `ageMonths + 3` (6-month window centered on child)
- **Upcoming** = `ageMonths + 3` to `ageMonths + 7` (next 4 months after current)
- **Achieved** = cross-reference with `Child.achievedMilestones` (user-checked)

Fallback: If `Milestone.countDocuments() === 0`, use `whoDataService` arrays.

**File:** `backend/src/routes/children.js` — Milestone mark/unmark/watch routes

Accept both UUID and legacy IDs. Lookup: try `{ uuid: id }` first, then `{ legacyId: id }`.

**File:** `backend/src/services/whoDataService.js`

- Remove milestone arrays (MOTOR_MILESTONES, LANGUAGE_MILESTONES, etc.)
- Keep: growth medians, percentile calculations, growth curves, WHO/regional sources
- Add: `getMilestonesFromDB(ageMonths, domain)` wrapper

### 3B. Recipes — Switch from Gemini-on-demand to DB

**File:** `backend/src/routes/recommendations.js`

`GET /recipes/:childId` — Query from Recipe collection:
```
{ isActive: true, ageRangeStartMonths: { $lte: age }, ageRangeEndMonths: { $gte: age } }
+ optional: mealType, region, allergens exclusion ($nin)
```
Enrich with `isFavorited` from UserRecipeFavorite.

`POST /recipes/:childId/regenerate` — Keep Gemini generation, insert as `isSeeded: false`.

**New endpoints:**
- `POST /recipes/:recipeId/favorite` — Toggle favorite (upsert/delete UserRecipeFavorite)
- `GET /recipes/:childId/favorites` — Get user's favorited recipes

### 3C. Tips — Switch to DB

`GET /tips/:childId?focusArea=` → Query Tip collection by age range + category.
Keep `POST /tips/:childId/regenerate` for AI refresh.

### 3D. Products — Switch to DB

`GET /products/:childId?category=` → Query Product collection by age range + category.
Keep `POST /products/:childId/regenerate` for AI refresh.

### 3E. Activities — Switch to DB

`GET /activities/:childId?domain=` → Query AgeActivity collection by age range + domain.
Keep `POST /activities/:childId/regenerate` for AI refresh.

### 3F. Timeline Enhancement

**File:** `backend/src/models/Timeline.js`

Expand type enum: add `'story'`, `'recipe_save'`, `'voice_recording'`

**File:** `backend/src/routes/stories.js` — Create timeline entry when story is generated.

**File:** `backend/src/routes/recommendations.js` — Create timeline entry when recipe is favorited.

---

## Phase 4: Bug Fixes

### 4A. Analysis structuredTips Category Enum

**File:** `backend/src/models/Analysis.js` (line 94)

Add `'motor'`, `'language'`, `'cognitive'`, `'social'` to category enum.

**File:** `backend/src/services/geminiService.js`

Add `sanitizeStructuredTips()` — map unknown categories to `'development'` fallback. Apply in `_buildAnalysisResult()`.

### 4B. Backend Auto-Fetch Child Photo for Stories

**File:** `backend/src/services/storageService.js` — Add:
- `getObjectBuffer(bucket, objectName)` — stream from MinIO → Buffer
- `parseMinioUrl(url)` — parse URL into `{ bucket, objectName }`

**File:** `backend/src/routes/stories.js` — Add `fetchChildPhotoBase64(child)` helper.

Modify 3 endpoints:
| Endpoint | Change |
|----------|--------|
| `POST /stories` | If no `childPhotoBase64`, fetch from `child.profilePhotoUrl` |
| `POST /stories/illustration` | Accept optional `childId`, fetch photo if no base64 |
| `POST /stories/custom` | If no `childAvatarImage`, fall back to profile photo |

Frontend-provided photos take priority.

### 4C. Story Prompt Improvements

**File:** `backend/src/services/geminiService.js`

**Age-appropriate storytelling using seeded activities:**
- Query AgeActivity collection for child's age (all domains, random 20-30)
- Build developmental context block showing capabilities, interests, comprehension, play styles
- Age-dependent complexity rules (vocabulary, sentence length, plot complexity)

**Illustration variety:**
- Remove "always featured on every page" from prompt
- Add: "Child is the main character but doesn't need to appear in every illustration. Vary scenes: close-ups, wide shots, scenery, mood scenes. Feel like a real picture book."

**Custom story toy/character integration:**
- "Characters/toys appear naturally, NOT on every page. Toys can be companions, magical objects, or story elements."

---

## Phase 5: Frontend Parity

### 5A. Recipe Favorites (all 3 FEs)

| Frontend | File | Change |
|----------|------|--------|
| Desktop | `desktop-frontend/src/pages/Recipes.tsx` | Replace in-memory `Set<string>` with API calls to favorite/unfavorite |
| Web | `tinysteps-ai/components/RecipesView.tsx` | Same pattern |
| Flutter | `tinysteps_flutter/lib/screens/discover/recipes_screen.dart` | Add heart button, API calls |

### 5B. Custom Story Builder (Flutter + Desktop photo upload)

**Flutter — NEW screen:**
- Create `tinysteps_flutter/lib/screens/stories/custom_story_screen.dart`
- Fields: setting, action, moral, custom prompt
- Image picker for child avatar (camera/gallery)
- Image picker for character/toy photos (multiple, with name labels)
- API call to `POST /api/stories/custom`

**Flutter — Fix misleading button:**
- Modify `bedtime_stories_screen.dart` — "Create Custom Story" button navigates to new custom_story_screen instead of opening theme selector

**Flutter — Add API method:**
- Modify `tinysteps_flutter/lib/services/api_service.dart` — Add `generateCustomStory()` method

**Desktop — Add photo upload:**
- Modify `desktop-frontend/src/pages/Stories.tsx` — Add file inputs for child avatar and character/toy photos in CustomStoryBuilderModal

### 5C. Milestone Watch in Flutter

**File:** `tinysteps_flutter/lib/screens/milestones/milestones_screen.dart`

Add watch/unwatch toggle (eye icon) calling `POST/DELETE /api/children/:childId/milestones/:milestoneId/watch`.

### 5D. Timeline Enhancements (all 3 FEs)

Display new timeline types (`story`, `recipe_save`, `voice_recording`) with appropriate icons and formatting.

| Frontend | File |
|----------|------|
| Desktop | `desktop-frontend/src/pages/Timeline.tsx` |
| Web | `tinysteps-ai/components/TimelineView.tsx` |
| Flutter | `tinysteps_flutter/lib/screens/timeline/timeline_screen.dart` |

---

## Files Changed Summary

### New Files (11)
| File | Purpose |
|------|---------|
| `backend/src/models/Milestone.js` | Milestone schema with UUID |
| `backend/src/models/Recipe.js` | Recipe schema (proper model) |
| `backend/src/models/UserRecipeFavorite.js` | Recipe favorites junction |
| `backend/src/models/Tip.js` | Parenting tip schema |
| `backend/src/models/Product.js` | Product recommendation schema |
| `backend/src/models/AgeActivity.js` | Developmental activity schema |
| `backend/src/migrations/002-seed-milestones.js` | Static milestone seed |
| `backend/src/migrations/003-migrate-milestone-ids.js` | Child milestone ID migration |
| `backend/src/migrations/004-seed-recipes.js` | Gemini-generated recipe seed |
| `backend/src/migrations/005-seed-tips.js` | Gemini-generated tip seed |
| `backend/src/migrations/006-seed-products.js` | Gemini-generated product seed |
| `backend/src/migrations/007-seed-activities.js` | Gemini-generated activity seed |
| `tinysteps_flutter/lib/screens/stories/custom_story_screen.dart` | Flutter custom story builder |

### Modified Files (15)
| File | Changes |
|------|---------|
| `backend/src/models/Analysis.js` | Expand structuredTips category enum (+4 values) |
| `backend/src/models/Timeline.js` | Add story, recipe_save, voice_recording types |
| `backend/src/services/whoDataService.js` | Remove milestone arrays, keep growth data, add DB wrapper |
| `backend/src/services/storageService.js` | Add getObjectBuffer(), parseMinioUrl() |
| `backend/src/services/geminiService.js` | sanitizeStructuredTips(); age-aware story prompts; illustration variety |
| `backend/src/routes/analysis.js` | Milestone endpoint reads from DB instead of hardcoded |
| `backend/src/routes/children.js` | Accept UUID + legacy IDs for milestone operations |
| `backend/src/routes/recommendations.js` | All endpoints read from DB; add recipe favorite endpoints |
| `backend/src/routes/stories.js` | Auto-fetch child photo; timeline entry on creation |
| `backend/src/index.js` | Register any new route files if needed |
| `desktop-frontend/src/pages/Recipes.tsx` | Recipe favorites via API |
| `desktop-frontend/src/pages/Stories.tsx` | Photo upload in custom story modal |
| `desktop-frontend/src/pages/Timeline.tsx` | Display new timeline types |
| `tinysteps_flutter/lib/screens/stories/bedtime_stories_screen.dart` | Fix button → navigate to custom story |
| `tinysteps_flutter/lib/services/api_service.dart` | Add generateCustomStory(), recipe favorite methods |
| `tinysteps_flutter/lib/screens/discover/recipes_screen.dart` | Add favorite button |
| `tinysteps_flutter/lib/screens/milestones/milestones_screen.dart` | Add watch toggle |

---

## Execution Order

1. **Phase 4A** — Analysis enum fix (quick, unblocks analysis saving)
2. **Phase 1** — Create all 6 new models + junction table
3. **Phase 2 (002-003)** — Seed milestones + migrate IDs (static, fast)
4. **Phase 3A** — Switch milestone API to DB
5. **Phase 2 (004-007)** — Seed recipes, tips, products, activities (Gemini, long-running)
6. **Phase 3B-3E** — Switch all recommendation APIs to DB
7. **Phase 3F** — Timeline expansion
8. **Phase 4B-4C** — Story photo fetch + prompt improvements
9. **Phase 5A** — Recipe favorites (all 3 FEs)
10. **Phase 5B** — Custom story (Flutter new screen + Desktop photo upload)
11. **Phase 5C** — Milestone watch (Flutter)
12. **Phase 5D** — Timeline enhancements (all 3 FEs)

---

## NotebookLM Integration

When user provides MCP access:
1. Query NotebookLM for WHO developmental milestones → validate/expand the 107 seeded milestones
2. Query for WHO nutrition guidelines per age bracket → feed as context to recipe seed generation
3. Query for developmental activities per age → ground activity seeds in WHO data
4. Query for safety guidelines → enrich tip seeds

The seed scripts accept an optional `--source=notebooklm` flag. Default is Gemini with hardcoded WHO context. When NotebookLM MCP is available, it provides richer, curated context.

---

## Verification

1. **Milestone seed**: Run migration → 107+ milestones in DB with UUIDs. `GET /api/analysis/milestones/14` returns age-appropriate results.
2. **Milestone IDs migrated**: Existing `Child.achievedMilestones` reference UUIDs, old kebab-case IDs still resolve.
3. **Milestone ranges**: For 14-month child: Current=11-17mo, Upcoming=17-21mo, Achieved=user-checked items.
4. **Recipe seed**: 1000+ recipes in DB. `GET /api/recommendations/recipes/:childId` returns age-filtered, allergen-excluded results.
5. **Recipe favorites**: Favorite a recipe → persists across sessions, shows in "Favorites" across all 3 FEs.
6. **Tip seed**: 1000+ tips. `GET /api/recommendations/tips/:childId?focusArea=sleep` returns seeded tips instantly.
7. **Product seed**: 600+ products. Filtered by category and age.
8. **Activity seed**: 600+ activities. Used in story generation prompts.
9. **Analysis enum**: Analysis saves even when Gemini returns `language`/`social` as tip categories.
10. **Story photo**: Generate story from desktop for child WITH profile photo → illustrations reflect child without FE sending photo.
11. **Story age-appropriate**: Stories for 6mo vs 24mo vs 48mo differ in vocabulary, plot, and referenced activities.
12. **Custom story (Flutter)**: End-to-end: open builder → add characters/photos → generate → read.
13. **Custom story (Desktop)**: Upload toy photos → story integrates them naturally.
14. **Timeline**: Creating a story, favoriting a recipe, marking a milestone → all appear in timeline.
15. **Regenerate**: "Refresh" button on recipes/tips/products still calls Gemini for fresh content.

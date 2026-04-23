# DB Persistence Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all data that is only being stored in localStorage/memory and ensure it reaches MongoDB and MinIO.

**Architecture:** Five targeted fixes: backend security bug (children userId filter), timeline writes to backend, blocking analysis saves, backend-driven story generation, and illustration upload to MinIO. localStorage remains a read-cache only — all writes go to the backend first.

**Tech Stack:** Node.js/Express/MongoDB (backend), React/TypeScript (web), MinIO (binary storage)

---

## Task 1: Fix critical backend security bug — children not filtered by userId

**Problem:** `GET /children` calls `Child.find({})` with no userId filter — returns ALL children from ALL users in the database.

**Files:**
- Modify: `backend/src/routes/children.js:17`

**Step 1: Apply the fix**

Change line 17 from:
```js
const children = await Child.find({}).sort({ createdAt: -1 });
```
To:
```js
const children = await Child.find({ userId: String(req.user._id) }).sort({ createdAt: 1 });
```
Note: sort `createdAt: 1` (oldest first) so children appear in creation order in the UI.

**Step 2: Verify no other `Child.find({})` calls are missing userId**

Run:
```bash
grep -n "Child.find" backend/src/routes/children.js
```
Expected: Every `find` call includes `userId` in the filter.

**Step 3: Commit**
```bash
git add backend/src/routes/children.js
git commit -m "fix: filter children by userId in GET /children - was returning all users' children"
```

---

## Task 2: Fix timeline writes — addTimelineEntry must call the backend

**Problem:** `addTimelineEntry()` in `storageService.ts` only writes to localStorage. The backend `POST /timeline` endpoint exists but is never called on write.

**Files:**
- Modify: `tinysteps-ai/services/storageService.ts` (the `addTimelineEntry` function, lines 418–428)
- Modify: `tinysteps-ai/services/apiService.ts` (add `addTimelineEntry` method — check if it exists first)

**Step 1: Check if apiService already has an addTimelineEntry method**

Run:
```bash
grep -n "addTimeline\|postTimeline\|/timeline" tinysteps-ai/services/apiService.ts
```

If missing, add this to `apiService.ts` inside the class (near the other timeline methods):
```ts
async addTimelineEntry(entry: {
  childId: string;
  type: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  data?: any;
}) {
  return this.request('/timeline', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}
```

**Step 2: Replace the synchronous `addTimelineEntry` with an async version**

In `tinysteps-ai/services/storageService.ts`, replace the existing `addTimelineEntry` function (lines 418–428):

```ts
export async function addTimelineEntry(
  entry: Omit<TimelineEntry, 'id' | 'timestamp'>
): Promise<TimelineEntry> {
  // Write to backend first; use returned MongoDB _id
  if (isMongoId(entry.childId)) {
    try {
      const result = await apiService.addTimelineEntry({
        childId: entry.childId,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        mediaUrl: entry.mediaUrl,
        data: entry.data,
      });
      const data = result.data as any;
      if (data?.entry) {
        const saved: TimelineEntry = {
          id: data.entry._id || data.entry.id,
          childId: data.entry.childId,
          timestamp: data.entry.date || data.entry.createdAt || new Date().toISOString(),
          type: data.entry.type,
          title: data.entry.title,
          description: data.entry.description,
          mediaUrl: data.entry.mediaUrl,
          analysisId: data.entry.data?.analysisId,
          data: data.entry.data,
        };
        // Cache to localStorage
        const timeline = safeJsonParse<TimelineEntry[]>(
          localStorage.getItem(STORAGE_KEYS.TIMELINE), []
        );
        timeline.push(saved);
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
        return saved;
      }
    } catch (err) {
      console.error('API addTimelineEntry failed, falling back to localStorage:', err);
    }
  }

  // Fallback: local-only (offline or non-MongoDB child)
  const newEntry: TimelineEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const timeline = safeJsonParse<TimelineEntry[]>(
    localStorage.getItem(STORAGE_KEYS.TIMELINE), []
  );
  timeline.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
  return newEntry;
}
```

**Step 3: Fix all call sites — addTimelineEntry is now async**

Search for callers:
```bash
grep -rn "addTimelineEntry" tinysteps-ai/
```

Each caller of `addTimelineEntry` must now `await` it. The call inside `saveAnalysis` (storageService.ts:284) must be updated to:
```ts
// Inside saveAnalysis — make the function async too, or fire-and-forget with .catch()
addTimelineEntry({ ... }).catch(err => console.error('Timeline entry failed:', err));
```

**Step 4: Verify the timeline route accepts the entry shape**

Check `backend/src/routes/timeline.js` — the POST handler should accept `{childId, type, title, description, mediaUrl, data}`. If the field name for the date is `date` (not `timestamp`), the mapping in Step 2 already handles that via `data.entry.date || data.entry.createdAt`.

**Step 5: Commit**
```bash
git add tinysteps-ai/services/storageService.ts tinysteps-ai/services/apiService.ts
git commit -m "fix: timeline writes now sent to backend API before caching to localStorage"
```

---

## Task 3: Fix analysis saves — make backend save blocking

**Problem:** In `App.tsx:122-128`, `apiService.saveAnalysisResult()` is called fire-and-forget with `.catch()` only. If it fails, the analysis is only in localStorage and invisible across devices.

**Files:**
- Modify: `tinysteps-ai/App.tsx` (around lines 118–128, the `handleAnalyze` function)

**Step 1: Replace the non-blocking save with an awaited save**

Current code (App.tsx ~118–128):
```ts
const savedAnalysis = saveAnalysis(analysisResult);
setResult(savedAnalysis);
setStep(AppStep.RESULTS);

// Save pre-computed analysis result to backend (non-blocking)
apiService.saveAnalysisResult(currentChild.id, {
  ...analysisResult,
  childAgeMonths: currentChild.ageMonths,
}).catch((err) => {
  console.error('Failed to save analysis to backend:', err);
});
```

Replace with:
```ts
// Save to backend first; get MongoDB ID back
let finalAnalysis: AnalysisResult;
try {
  const backendResult = await apiService.saveAnalysisResult(currentChild.id, {
    ...analysisResult,
    childAgeMonths: currentChild.ageMonths,
  });
  const backendData = (backendResult as any).data;
  // Use backend-assigned MongoDB ID if available, otherwise fall back to local
  const analysisWithId = backendData?.analysis
    ? mapBackendAnalysis(backendData.analysis)
    : { ...analysisResult, id: generateId() };
  finalAnalysis = analysisWithId;
} catch (err) {
  console.error('Failed to save analysis to backend, saving locally:', err);
  finalAnalysis = { ...analysisResult, id: generateId() };
}

// Cache to localStorage
saveAnalysis(finalAnalysis);
setResult(finalAnalysis);
setStep(AppStep.RESULTS);
```

Note: `mapBackendAnalysis` and `generateId` are already exported from `storageService.ts`. Import them if not already imported at the top of App.tsx.

**Step 2: Verify imports in App.tsx**

```bash
grep "^import.*storageService" tinysteps-ai/App.tsx
```

Add `mapBackendAnalysis` and `generateId` to the destructured import if missing. They are not currently exported — check storageService.ts and export them:
```ts
// In storageService.ts, add `export` to:
export function generateId(): string { ... }
export function mapBackendAnalysis(a: any): AnalysisResult { ... }
```

**Step 3: Commit**
```bash
git add tinysteps-ai/App.tsx tinysteps-ai/services/storageService.ts
git commit -m "fix: analysis backend save is now blocking - uses MongoDB ID in result"
```

---

## Task 4: Fix story generation — use backend API instead of client-side Gemini

**Problem:** `handleGenerateStory` in `BedtimeStories.tsx:69-85` calls the frontend Gemini service and saves to localStorage only. `apiService.generateStory()` exists but is never called.

**Files:**
- Modify: `tinysteps-ai/components/BedtimeStories.tsx` (lines 69–85, `handleGenerateStory`)

**Step 1: Replace `handleGenerateStory` with backend API call**

Current code:
```ts
const handleGenerateStory = async (theme: string) => {
  setIsGenerating(true);
  setSelectedTheme(theme);
  try {
    const storyData = await generateBedtimeStory(child, theme);
    const newStory = saveStory(storyData);
    setStories([newStory, ...stories]);
    setSelectedStory(newStory);
    setCurrentPage(0);
  } catch (error) { ... }
};
```

Replace with:
```ts
const handleGenerateStory = async (theme: string) => {
  setIsGenerating(true);
  setSelectedTheme(theme);
  try {
    const result = await apiService.generateStory(child.id, theme);
    const data = (result as any).data;
    if (!data?.story) {
      throw new Error(result.error || 'Story generation failed');
    }
    // Map backend story shape to frontend BedtimeStory type
    const s = data.story;
    const newStory: BedtimeStory = {
      id: s._id || s.id,
      childId: s.childId,
      title: s.title,
      theme: typeof s.theme === 'object' ? s.theme.name : s.theme,
      content: s.pages ? s.pages.map((p: any) => p.text || '') : [],
      illustrations: s.pages ? s.pages.map((p: any, i: number) => ({
        sceneIndex: i,
        description: p.illustrationPrompt || '',
        imageUrl: p.illustrationUrl,
        style: 'storybook' as const,
      })) : [],
      duration: s.pages ? Math.ceil(s.pages.length * 0.5) : 5,
      createdAt: s.createdAt,
      characters: [],
      moral: s.moral,
    };
    // Cache to localStorage
    saveStory(newStory);
    setStories([newStory, ...stories]);
    setSelectedStory(newStory);
    setCurrentPage(0);
  } catch (error) {
    console.error('Failed to generate story:', error);
    alert('Failed to generate story. Please check your connection and try again.');
  } finally {
    setIsGenerating(false);
  }
};
```

**Step 2: Add apiService import to BedtimeStories.tsx**

```bash
grep "^import.*apiService" tinysteps-ai/components/BedtimeStories.tsx
```

If missing, add:
```ts
import apiService from '../services/apiService';
```

**Step 3: Remove unused import if generateBedtimeStory is no longer called**

```bash
grep "generateBedtimeStory" tinysteps-ai/components/BedtimeStories.tsx
```

If it's only referenced in the old `handleGenerateStory`, remove it from the import on line 20.

**Step 4: Commit**
```bash
git add tinysteps-ai/components/BedtimeStories.tsx
git commit -m "fix: story generation now uses backend API - stories saved to MongoDB"
```

---

## Task 5: Fix story illustrations — upload to MinIO and persist URL in MongoDB

**Problem:** `generateIllustrationForPage` generates a base64 data URL via client-side Gemini and saves it only to localStorage. `apiService.uploadImage()` already exists. Need to: convert data URL → File → upload to MinIO → patch the story page's `illustrationUrl` in MongoDB.

**Files:**
- Modify: `backend/src/routes/stories.js` (add PATCH endpoint for illustration URL)
- Modify: `tinysteps-ai/services/apiService.ts` (add `updateStoryPageIllustration` method)
- Modify: `tinysteps-ai/components/BedtimeStories.tsx` (`generateIllustrationForPage`, lines 107–159)

**Step 1: Add PATCH endpoint to backend stories route**

In `backend/src/routes/stories.js`, before the final `export default router;`, add:

```js
// Update illustration URL for a specific story page
router.patch('/:childId/:id/page/:pageNumber/illustration', authMiddleware, async (req, res) => {
  try {
    const { illustrationUrl } = req.body;
    if (!illustrationUrl) {
      return res.status(400).json({ error: 'illustrationUrl is required' });
    }

    const story = await Story.findOne({
      _id: req.params.id,
      childId: req.params.childId,
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const pageNumber = parseInt(req.params.pageNumber, 10);
    const page = story.pages.find(p => p.pageNumber === pageNumber);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    page.illustrationUrl = illustrationUrl;
    await story.save();

    res.json({ message: 'Illustration updated', illustrationUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update illustration' });
  }
});
```

**Step 2: Add `updateStoryPageIllustration` to apiService.ts**

Inside the `ApiService` class in `tinysteps-ai/services/apiService.ts` (near the other story methods around line 218):

```ts
async updateStoryPageIllustration(
  childId: string,
  storyId: string,
  pageNumber: number,
  illustrationUrl: string
) {
  return this.request(`/stories/${childId}/${storyId}/page/${pageNumber}/illustration`, {
    method: 'PATCH',
    body: JSON.stringify({ illustrationUrl }),
  });
}
```

**Step 3: Add a helper to convert data URL to File**

In `tinysteps-ai/services/apiService.ts`, outside the class (near the top), add:

```ts
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new File([array], filename, { type: mime });
}
```

**Step 4: Update `generateIllustrationForPage` in BedtimeStories.tsx**

Replace lines 107–159 with:

```ts
const generateIllustrationForPage = useCallback(async (pageIndex: number) => {
  if (!selectedStory || !child.profilePhoto) return;

  const cacheKey = `${selectedStory.id}-${pageIndex}`;
  if (illustrationCache[cacheKey] || selectedStory.illustrations[pageIndex]?.imageUrl) return;

  const illustration = selectedStory.illustrations[pageIndex];
  if (!illustration?.description) return;

  setGeneratingIllustration(pageIndex);

  try {
    const imageUrl = await generateStoryIllustration(
      child.profilePhoto,
      illustration.description,
      child.name,
      illustration.style || 'storybook'
    );

    if (!imageUrl) return;

    // Update local state immediately for instant display
    setIllustrationCache(prev => ({ ...prev, [cacheKey]: imageUrl }));

    // Persist to MinIO + MongoDB (non-blocking so UI doesn't freeze)
    (async () => {
      try {
        const file = dataUrlToFile(imageUrl, `story-${selectedStory.id}-page-${pageIndex}.png`);
        const uploadResult = await apiService.uploadImage(file, 'stories');
        const persistedUrl = uploadResult?.url;

        if (persistedUrl) {
          // Patch the story page in MongoDB
          await apiService.updateStoryPageIllustration(
            child.id,
            selectedStory.id,
            pageIndex,      // pageNumber (0-based index matches illustrationPrompt ordering)
            persistedUrl
          );
          // Update localStorage cache with the persistent MinIO URL
          const updatedIllustrations = [...selectedStory.illustrations];
          updatedIllustrations[pageIndex] = { ...updatedIllustrations[pageIndex], imageUrl: persistedUrl };
          const updatedStory = { ...selectedStory, illustrations: updatedIllustrations };
          updateStory(updatedStory);
          setSelectedStory(updatedStory);
          setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
        }
      } catch (persistErr) {
        console.error('Failed to persist illustration to backend:', persistErr);
        // UI still shows the locally-generated image via illustrationCache
      }
    })();
  } catch (error) {
    console.error('Failed to generate illustration:', error);
  } finally {
    setGeneratingIllustration(null);
  }
}, [selectedStory, child.profilePhoto, child.name, child.id, illustrationCache]);
```

**Step 5: Add dataUrlToFile import in BedtimeStories.tsx**

```ts
import apiService, { dataUrlToFile } from '../services/apiService';
```

**Step 6: Check the pageNumber alignment**

The backend `storyPageSchema` uses `pageNumber` starting from 1 (set by Gemini story generation). The frontend uses 0-based `pageIndex`. When patching, check whether backend pages are 1-indexed:

```bash
grep -n "pageNumber" backend/src/services/geminiService.js | head -20
```

If pages are 1-indexed in the backend, use `pageIndex + 1` in the PATCH call. Update the PATCH endpoint query accordingly:
```js
const page = story.pages.find(p => p.pageNumber === pageNumber);
```
This find works for either convention as long as the caller sends the right value.

**Step 7: Commit**
```bash
git add backend/src/routes/stories.js tinysteps-ai/services/apiService.ts tinysteps-ai/components/BedtimeStories.tsx
git commit -m "fix: story illustrations uploaded to MinIO and persisted to MongoDB"
```

---

## Verification Checklist

After all tasks are complete:

1. **Children**: Create a child, check MongoDB → `db.children.find({userId: <your_id>})` — should appear
2. **Children security**: Two different users should not see each other's children
3. **Timeline**: Add a measurement or complete a milestone → check `db.timeline.find({childId: <id>})`
4. **Analysis**: Upload a video → check `db.analyses.find({childId: <id>})`
5. **Stories**: Generate a story → check `db.stories.find({childId: <id>})`
6. **Illustrations**: Open a story page that generates an illustration → check MinIO `story-illustrations` bucket and `db.stories` for `illustrationUrl` on that page
7. **Cross-device**: Clear browser localStorage → reload → all data should still be present

Run the Docker stack before verifying:
```bash
docker-compose up -d
```

Then open the app at `http://localhost:5173`.

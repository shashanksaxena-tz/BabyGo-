import express from 'express';
import { body, validationResult } from 'express-validator';
import Child from '../models/Child.js';
import Story from '../models/Story.js';
import { authMiddleware } from '../middleware/auth.js';
import { geminiInit } from '../middleware/geminiInit.js';
import geminiService from '../services/geminiService.js';
import storageService, { BUCKETS } from '../services/storageService.js';

const router = express.Router();

// Story themes
const STORY_THEMES = [
  { id: 'adventure', name: 'Adventure', emoji: '🏔️', description: 'Exciting journeys', colorHex: '#F59E0B' },
  { id: 'animals', name: 'Animals', emoji: '🦁', description: 'Stories with animal friends', colorHex: '#10B981' },
  { id: 'space', name: 'Space', emoji: '🚀', description: 'Cosmic adventures', colorHex: '#6366F1' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', description: 'Underwater worlds', colorHex: '#0EA5E9' },
  { id: 'magic', name: 'Magic', emoji: '✨', description: 'Enchanted tales', colorHex: '#A855F7' },
  { id: 'dinosaurs', name: 'Dinosaurs', emoji: '🦕', description: 'Prehistoric adventures', colorHex: '#84CC16' },
  { id: 'dreams', name: 'Dreams', emoji: '🌙', description: 'Gentle sleepy stories', colorHex: '#8B5CF6' },
  { id: 'friendship', name: 'Friendship', emoji: '🤝', description: 'Being a good friend', colorHex: '#EC4899' },
];

// Get available themes
router.get('/themes', (_req, res) => {
  res.json({ themes: STORY_THEMES });
});

// POST /api/stories/illustration
router.post('/illustration', authMiddleware, geminiInit, async (req, res) => {
  try {
    const { prompt, childPhotoBase64, childPhotoMime } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Illustration prompt required' });

    const imageResult = await geminiService.generateIllustration(prompt, childPhotoBase64, childPhotoMime);

    if (!imageResult) {
      return res.status(500).json({ error: 'Failed to generate illustration' });
    }

    // Upload to MinIO
    const filename = `illustration-${Date.now()}.png`;
    const buffer = Buffer.from(imageResult.data, 'base64');
    const { url } = await storageService.uploadBuffer('story-illustrations', buffer, imageResult.mimeType, filename);

    res.json({ url, mimeType: imageResult.mimeType });
  } catch (error) {
    console.error('Illustration endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate illustration' });
  }
});

// Get stories for child
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const stories = await Story.find({ childId: String(child._id) })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ stories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Generate new story
router.post('/', authMiddleware, [
  body('childId').notEmpty(),
  body('themeId').notEmpty(),
], geminiInit, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { childId, themeId, childPhotoBase64, childPhotoMime } = req.body;

    // Get child
    const child = await Child.findOne({
      _id: childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Find theme
    const theme = STORY_THEMES.find(t => t.id === themeId);
    if (!theme) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    // Generate story
    const storyData = await geminiService.generateBedtimeStory(child, theme, childPhotoBase64 || null, childPhotoMime || 'image/jpeg');

    // Save story
    const story = new Story({
      childId: String(child._id),
      userId: String(req.user._id),
      title: storyData.title,
      theme: {
        id: theme.id,
        name: theme.name,
        emoji: theme.emoji,
        colorHex: theme.colorHex,
      },
      pages: storyData.pages,
      moral: storyData.moral,
      childAgeAtCreation: child.ageInMonths,
    });

    await story.save();

    res.status(201).json({
      message: 'Story generated',
      story,
    });
  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ error: 'Failed to generate story: ' + error.message });
  }
});

// Generate custom story
router.post('/custom', authMiddleware, geminiInit, async (req, res) => {
  try {
    const {
      childId,
      customPrompt = '',
      characters = [],        // string[]
      setting = '',
      action = '',
      characterImages = [],   // [{ name, base64, mimeType }]
      childAvatarImage = null, // { base64, mimeType }
    } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'childId is required' });
    }

    const child = await Child.findOne({ _id: childId });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // Describe uploaded character images via Vision
    const characterDescriptions = [];
    for (const img of characterImages) {
      try {
        const desc = await geminiService.describeImage(img.base64, img.mimeType || 'image/jpeg');
        characterDescriptions.push(desc);
      } catch {
        characterDescriptions.push(''); // non-fatal
      }
    }

    // Describe child's story avatar if provided
    let childAvatarDescription = '';
    if (childAvatarImage?.base64) {
      try {
        childAvatarDescription = await geminiService.describeImage(
          childAvatarImage.base64,
          childAvatarImage.mimeType || 'image/jpeg'
        );
      } catch { /* non-fatal */ }
    }

    const storyData = await geminiService.generateCustomStory(child, {
      customPrompt,
      characters,
      setting,
      action,
      characterDescriptions,
      childAvatarDescription,
    });

    const story = new Story({
      childId: String(child._id),
      userId: String(req.user._id),
      title: storyData.title,
      theme: { id: 'custom', name: 'Custom Story', emoji: '✨', colorHex: '#8B5CF6' },
      isCustom: true,
      customConfig: { characters, setting, action, customPrompt },
      pages: storyData.pages,
      moral: storyData.moral,
      childAgeAtCreation: child.ageInMonths,
    });

    await story.save();

    res.status(201).json({ message: 'Custom story generated', story });
  } catch (error) {
    console.error('Custom story generation error:', error);
    res.status(500).json({ error: 'Failed to generate custom story: ' + error.message });
  }
});

// Update story cover image URL
router.patch('/:childId/:id/cover', authMiddleware, async (req, res) => {
  try {
    const { coverImageUrl } = req.body;
    if (!coverImageUrl) return res.status(400).json({ error: 'coverImageUrl is required' });

    const story = await Story.findOne({ _id: req.params.id, childId: req.params.childId });
    if (!story) return res.status(404).json({ error: 'Story not found' });

    story.coverImageUrl = coverImageUrl;
    await story.save();

    res.json({ message: 'Cover updated', coverImageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cover' });
  }
});

// Get specific story
router.get('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      childId: req.params.childId
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Increment read count
    story.timesRead += 1;
    await story.save();

    // Persist illustrations if not already done
    if (!story.illustrationsGenerated) {
      try {
        const pagesNeedingIllustration = story.pages.filter(
          page => page.illustrationPrompt && !page.illustrationUrl
        );

        if (pagesNeedingIllustration.length > 0 && storageService.initialized) {
          const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
          if (apiKey) {
            geminiService.initialize(apiKey);

            for (const page of pagesNeedingIllustration) {
              try {
                const imageBuffer = await geminiService.generateIllustration(page.illustrationPrompt);
                if (imageBuffer) {
                  const { url } = await storageService.uploadBuffer(
                    BUCKETS.STORIES,
                    imageBuffer,
                    'image/png',
                    `story-${story._id}-page-${page.pageNumber}.png`
                  );
                  page.illustrationUrl = url;
                }
              } catch (illustrationErr) {
                // Individual illustration failure is non-blocking, skip this page
                console.warn(`Failed to generate illustration for page ${page.pageNumber}:`, illustrationErr.message);
              }
            }
          }
        }

        // Mark as generated so we don't retry on every read
        story.illustrationsGenerated = true;
        await story.save();
      } catch (persistErr) {
        // Illustration persistence is non-blocking
        console.warn('Illustration persistence error:', persistErr.message);
      }
    }

    res.json({ story });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// Toggle favorite
router.patch('/:childId/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      childId: req.params.childId
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    story.isFavorite = !story.isFavorite;
    await story.save();

    res.json({ message: 'Favorite updated', isFavorite: story.isFavorite });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update favorite' });
  }
});

// Delete story
router.delete('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({
      _id: req.params.id,
      childId: req.params.childId
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

// Update illustration URL for a specific story page (called after client-side illustration upload)
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

export default router;

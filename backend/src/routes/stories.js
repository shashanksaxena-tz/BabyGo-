import express from 'express';
import { body, validationResult } from 'express-validator';
import Child from '../models/Child.js';
import Story from '../models/Story.js';
import { authMiddleware } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';

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
router.get('/themes', (req, res) => {
  res.json({ themes: STORY_THEMES });
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

    const stories = await Story.find({ childId: child._id })
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
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { childId, themeId } = req.body;

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

    // Initialize Gemini
    const apiKey = req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    geminiService.initialize(apiKey);

    // Generate story
    const storyData = await geminiService.generateBedtimeStory(child, theme);

    // Save story
    const story = new Story({
      childId: child._id,
      userId: req.user._id,
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

export default router;

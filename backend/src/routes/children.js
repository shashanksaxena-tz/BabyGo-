import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Child from '../models/Child.js';
import Timeline from '../models/Timeline.js';
import { authMiddleware } from '../middleware/auth.js';
import whoDataService from '../services/whoDataService.js';

const router = express.Router();

// Helper to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;

// Get all children for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const children = await Child.find({}).sort({ createdAt: -1 });
    res.json({ children });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// Create child profile
router.post('/', authMiddleware, [
  body('name').trim().notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('weight').isFloat({ min: 0 }),
  body('height').isFloat({ min: 0 }),
  body('region').isIn(['afro', 'amro', 'searo', 'euro', 'emro', 'wpro']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const child = new Child({
      ...req.body,
      userId: req.user._id,
    });

    await child.save();

    res.status(201).json({
      message: 'Child profile created',
      child,
    });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Failed to create child profile' });
  }
});

// Get child by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ child });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch child' });
  }
});

// Update child profile
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOneAndUpdate(
      { _id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child profile updated', child });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update child profile' });
  }
});

// Delete child profile
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({
      _id: req.params.id
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child profile deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete child profile' });
  }
});

// ============ MILESTONE TRACKING ENDPOINTS ============

// Get all achieved milestones for a child
router.get('/:childId/milestones', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(childId)) {
      // Return empty arrays for localStorage-based child IDs
      // Frontend will fall back to localStorage
      return res.status(404).json({
        error: 'Child not found in database',
        hint: 'This child profile may be stored locally. Milestone tracking requires a backend-synced profile.',
      });
    }

    const child = await Child.findOne({ _id: childId });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({
      achievedMilestones: child.achievedMilestones || [],
      watchedMilestones: child.watchedMilestones || [],
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Mark milestone as achieved
router.post('/:childId/milestones/:milestoneId', authMiddleware, [
  body('achievedDate').optional().isISO8601(),
  body('notes').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { childId, milestoneId } = req.params;
    const { achievedDate, notes, confirmedBy } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        error: 'Invalid child ID format',
        hint: 'This child profile is stored locally. Please create a backend-synced profile for milestone tracking.',
      });
    }

    const child = await Child.findOne({ _id: childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Check if milestone already achieved
    const existingIndex = child.achievedMilestones.findIndex(
      m => m.milestoneId === milestoneId
    );

    if (existingIndex >= 0) {
      // Update existing achievement
      child.achievedMilestones[existingIndex] = {
        milestoneId,
        achievedDate: achievedDate ? new Date(achievedDate) : child.achievedMilestones[existingIndex].achievedDate,
        confirmedBy: confirmedBy || child.achievedMilestones[existingIndex].confirmedBy,
        notes: notes !== undefined ? notes : child.achievedMilestones[existingIndex].notes,
      };
    } else {
      // Add new achievement
      child.achievedMilestones.push({
        milestoneId,
        achievedDate: achievedDate ? new Date(achievedDate) : new Date(),
        confirmedBy: confirmedBy || 'parent',
        notes: notes || '',
      });

      // Remove from watched milestones if present
      child.watchedMilestones = child.watchedMilestones.filter(
        m => m.milestoneId !== milestoneId
      );

      // Create timeline entry for the achievement
      try {
        const milestoneData = whoDataService.getAllMilestones().find(m => m.id === milestoneId);
        const timelineEntry = new Timeline({
          childId,
          userId: req.user._id,
          type: 'milestone',
          title: milestoneData ? `${milestoneData.title} achieved!` : 'Milestone achieved!',
          description: milestoneData
            ? `${child.name} has achieved the "${milestoneData.title}" milestone: ${milestoneData.description}`
            : `A new milestone has been achieved by ${child.name}`,
          data: {
            milestoneId,
            domain: milestoneData?.domain,
            achievedDate: achievedDate || new Date(),
            confirmedBy: confirmedBy || 'parent',
          },
        });
        await timelineEntry.save();
      } catch (timelineError) {
        console.error('Failed to create timeline entry:', timelineError);
        // Continue even if timeline creation fails
      }
    }

    child.updatedAt = new Date();
    await child.save();

    res.json({
      message: 'Milestone marked as achieved',
      achievedMilestones: child.achievedMilestones,
    });
  } catch (error) {
    console.error('Mark milestone error:', error);
    res.status(500).json({ error: 'Failed to mark milestone as achieved' });
  }
});

// Remove milestone achievement (unmark)
router.delete('/:childId/milestones/:milestoneId', authMiddleware, async (req, res) => {
  try {
    const { childId, milestoneId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({ error: 'Invalid child ID format' });
    }

    const child = await Child.findOne({ _id: childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Remove from achieved milestones
    const initialLength = child.achievedMilestones.length;
    child.achievedMilestones = child.achievedMilestones.filter(
      m => m.milestoneId !== milestoneId
    );

    if (child.achievedMilestones.length === initialLength) {
      return res.status(404).json({ error: 'Milestone not found in achieved list' });
    }

    child.updatedAt = new Date();
    await child.save();

    res.json({
      message: 'Milestone removed from achieved list',
      achievedMilestones: child.achievedMilestones,
    });
  } catch (error) {
    console.error('Remove milestone error:', error);
    res.status(500).json({ error: 'Failed to remove milestone achievement' });
  }
});

// Add milestone to watch list
router.post('/:childId/milestones/:milestoneId/watch', authMiddleware, async (req, res) => {
  try {
    const { childId, milestoneId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({ error: 'Invalid child ID format' });
    }

    const child = await Child.findOne({ _id: childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Check if already watching or already achieved
    const isWatching = child.watchedMilestones.some(m => m.milestoneId === milestoneId);
    const isAchieved = child.achievedMilestones.some(m => m.milestoneId === milestoneId);

    if (isAchieved) {
      return res.status(400).json({ error: 'Milestone already achieved' });
    }

    if (isWatching) {
      return res.status(400).json({ error: 'Milestone already being watched' });
    }

    child.watchedMilestones.push({
      milestoneId,
      addedDate: new Date(),
    });

    child.updatedAt = new Date();
    await child.save();

    res.json({
      message: 'Milestone added to watch list',
      watchedMilestones: child.watchedMilestones,
    });
  } catch (error) {
    console.error('Watch milestone error:', error);
    res.status(500).json({ error: 'Failed to add milestone to watch list' });
  }
});

// Remove milestone from watch list
router.delete('/:childId/milestones/:milestoneId/watch', authMiddleware, async (req, res) => {
  try {
    const { childId, milestoneId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({ error: 'Invalid child ID format' });
    }

    const child = await Child.findOne({ _id: childId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const initialLength = child.watchedMilestones.length;
    child.watchedMilestones = child.watchedMilestones.filter(
      m => m.milestoneId !== milestoneId
    );

    if (child.watchedMilestones.length === initialLength) {
      return res.status(404).json({ error: 'Milestone not found in watch list' });
    }

    child.updatedAt = new Date();
    await child.save();

    res.json({
      message: 'Milestone removed from watch list',
      watchedMilestones: child.watchedMilestones,
    });
  } catch (error) {
    console.error('Unwatch milestone error:', error);
    res.status(500).json({ error: 'Failed to remove milestone from watch list' });
  }
});

export default router;

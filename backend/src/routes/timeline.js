import express from 'express';
import { body, validationResult } from 'express-validator';
import Child from '../models/Child.js';
import TimelineEntry from '../models/Timeline.js';
import Measurement from '../models/Measurement.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get timeline entries for child
router.get('/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Performance optimization: using .lean() for read-only queries to bypass document hydration
    const entries = await TimelineEntry.find({ childId: String(child._id) })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Add timeline entry
router.post('/', authMiddleware, [
  body('childId').notEmpty(),
  body('type').isIn(['analysis', 'milestone', 'measurement', 'photo', 'note']),
  body('title').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { childId, type, title, description, data, date } = req.body;

    const child = await Child.findOne({
      _id: childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const entry = new TimelineEntry({
      childId: String(child._id),
      userId: String(req.user._id),
      type,
      date: date || new Date(),
      title,
      description,
      data,
    });

    await entry.save();

    res.status(201).json({ message: 'Entry added', entry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// Delete timeline entry
router.delete('/:childId/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await TimelineEntry.findOneAndDelete({
      _id: req.params.id,
      childId: req.params.childId
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Add growth measurement
router.post('/measurement', authMiddleware, [
  body('childId').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { childId, weight, height, headCircumference, date, notes } = req.body;

    const child = await Child.findOne({
      _id: childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Save measurement
    const measurement = new Measurement({
      childId: String(child._id),
      userId: String(req.user._id),
      date: date || new Date(),
      weight,
      height,
      headCircumference,
      notes,
    });

    await measurement.save();

    // Update child's current measurements
    if (weight) child.weight = weight;
    if (height) child.height = height;
    if (headCircumference) child.headCircumference = headCircumference;
    await child.save();

    // Add timeline entry
    const entry = new TimelineEntry({
      childId: String(child._id),
      userId: String(req.user._id),
      type: 'measurement',
      date: date || new Date(),
      title: 'Growth Measurement',
      description: `Weight: ${weight || '-'} kg, Height: ${height || '-'} cm`,
      data: { measurementId: String(measurement._id), weight, height, headCircumference },
    });
    await entry.save();

    res.status(201).json({
      message: 'Measurement added',
      measurement,
      child,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add measurement' });
  }
});

// Get growth measurements for child
router.get('/measurements/:childId', authMiddleware, async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.childId
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Performance optimization: using .lean() for read-only queries to bypass document hydration
    const measurements = await Measurement.find({ childId: String(child._id) })
      .sort({ date: 1 })
      .lean();

    res.json({ measurements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

export default router;

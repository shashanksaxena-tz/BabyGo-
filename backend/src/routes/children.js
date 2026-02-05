import express from 'express';
import { body, validationResult } from 'express-validator';
import Child from '../models/Child.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

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

export default router;

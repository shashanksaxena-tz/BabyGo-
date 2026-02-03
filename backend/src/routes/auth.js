import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken, generateRefreshToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({ email, password, name });
    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(
      refreshToken,
      process.env.JWT_SECRET || 'tinysteps-dev-secret-change-in-production'
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      preferences: req.user.preferences,
    },
  });
});

// Update API key
router.put('/api-key', authMiddleware, [
  body('apiKey').notEmpty(),
], async (req, res) => {
  try {
    const { apiKey } = req.body;

    req.user.geminiApiKey = apiKey;
    await req.user.save();

    res.json({ message: 'API key updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Update preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { notifications, language, theme } = req.body;

    if (notifications !== undefined) req.user.preferences.notifications = notifications;
    if (language) req.user.preferences.language = language;
    if (theme) req.user.preferences.theme = theme;

    await req.user.save();

    res.json({ message: 'Preferences updated', preferences: req.user.preferences });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;

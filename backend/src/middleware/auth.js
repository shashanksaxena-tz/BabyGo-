import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tinysteps-dev-secret-change-in-production';

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow API key authentication for mobile apps
      const apiKey = req.headers['x-api-key'];
      if (apiKey) {
        // Find user by API key (simplified for demo)
        req.apiKey = apiKey;
        return next();
      }

      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if present
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

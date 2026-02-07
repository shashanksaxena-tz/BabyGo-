import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import storageService, { BUCKETS } from '../services/storageService.js';

const router = express.Router();

// Map user-facing bucket names to actual bucket constants
const BUCKET_MAP = {
  profiles: BUCKETS.PROFILES,
  stories: BUCKETS.STORIES,
  reports: BUCKETS.REPORTS,
};

// Configure multer with memory storage, 10MB limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

// POST /api/upload/image
// Upload an image to MinIO
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const bucketKey = req.body.bucket || 'profiles';
    const bucket = BUCKET_MAP[bucketKey];

    if (!bucket) {
      return res.status(400).json({
        error: `Invalid bucket. Must be one of: ${Object.keys(BUCKET_MAP).join(', ')}`,
      });
    }

    if (!storageService.initialized) {
      return res.status(503).json({ error: 'Storage service not available' });
    }

    const { url } = await storageService.uploadBuffer(
      bucket,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    res.json({
      url,
      bucket: bucketKey,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

export default router;

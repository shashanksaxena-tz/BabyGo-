import express from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { translateText, textToSpeech } from '../services/sarvamService.js';
import TranslationCache from '../models/TranslationCache.js';

const router = express.Router();

function makeCacheKey(text, targetLanguageCode) {
  return crypto.createHash('sha256').update(text + '|' + targetLanguageCode).digest('hex');
}

// POST /api/sarvam/translate
router.post('/translate', authMiddleware, async (req, res) => {
  const { text, targetLanguageCode } = req.body;
  if (!text || !targetLanguageCode) {
    return res.status(400).json({ error: 'text and targetLanguageCode are required' });
  }
  if (targetLanguageCode === 'en-IN') {
    return res.json({ translatedText: text });
  }
  try {
    const cacheKey = makeCacheKey(text, targetLanguageCode);
    // Check cache
    const cached = await TranslationCache.findOne({ cacheKey });
    if (cached) {
      return res.json({ translatedText: cached.translatedText });
    }
    // Call Sarvam
    const translatedText = await translateText(text, targetLanguageCode);
    // Store in cache (non-blocking)
    TranslationCache.create({ cacheKey, sourceText: text, targetLanguageCode, translatedText }).catch(() => {});
    res.json({ translatedText });
  } catch (error) {
    console.error('Sarvam translate error:', error);
    res.status(502).json({ error: 'Translation service unavailable' });
  }
});

// POST /api/sarvam/tts
router.post('/tts', authMiddleware, async (req, res) => {
  const { text, targetLanguageCode } = req.body;
  if (!text || !targetLanguageCode) {
    return res.status(400).json({ error: 'text and targetLanguageCode are required' });
  }
  try {
    const audioChunks = await textToSpeech(text, targetLanguageCode);
    res.json({ audioChunks });
  } catch (error) {
    console.error('Sarvam TTS error:', error);
    res.status(502).json({ error: 'Text-to-speech service unavailable' });
  }
});

export default router;

import mongoose from 'mongoose';

const translationCacheSchema = new mongoose.Schema({
  // SHA-256 hash of (sourceText + targetLanguageCode) for efficient lookup
  cacheKey: { type: String, required: true, unique: true, index: true },
  sourceText: { type: String, required: true },
  targetLanguageCode: { type: String, required: true },
  translatedText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // 30-day TTL
});

export default mongoose.model('TranslationCache', translationCacheSchema);

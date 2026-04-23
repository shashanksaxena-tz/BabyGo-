import geminiService from '../services/geminiService.js';

/**
 * Middleware that initializes the Gemini service with the user's API key
 * (or falls back to the server-wide GEMINI_API_KEY env var).
 *
 * Returns 400 if no key is available.
 */
export function geminiInit(req, res, next) {
  const apiKey = req.user?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key not configured' });
  }
  geminiService.initialize(apiKey);
  next();
}

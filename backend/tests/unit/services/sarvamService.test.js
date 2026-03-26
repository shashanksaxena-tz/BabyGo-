/**
 * Unit tests for src/services/sarvamService.js
 *
 * Mocks global.fetch to test HTTP behaviour without real network calls.
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock global.fetch before importing the service
// ---------------------------------------------------------------------------
const mockFetch = jest.fn();
global.fetch = mockFetch;

const { translateText, textToSpeech } = await import('../../../src/services/sarvamService.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock Response-like object. */
function makeFetchResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

// ---------------------------------------------------------------------------
// translateText
// ---------------------------------------------------------------------------
describe('translateText', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls Sarvam translate API with correct payload and returns translated text', async () => {
    mockFetch.mockResolvedValue(
      makeFetchResponse({ translated_text: 'नमस्ते दुनिया' })
    );

    const result = await translateText('Hello World', 'hi-IN');

    expect(result).toBe('नमस्ते दुनिया');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/translate');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.input).toBe('Hello World');
    expect(body.target_language_code).toBe('hi-IN');
    expect(body.source_language_code).toBe('en-IN');
    expect(body.model).toBe('sarvam-translate:v1');
  });

  it('throws when the Sarvam API returns a non-OK response', async () => {
    mockFetch.mockResolvedValue(makeFetchResponse({}, false, 429));

    await expect(translateText('Hello', 'hi-IN')).rejects.toThrow('Sarvam translate failed: 429');
  });
});

// ---------------------------------------------------------------------------
// textToSpeech
// ---------------------------------------------------------------------------
describe('textToSpeech', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('makes a single API call for short text (under 1800 chars)', async () => {
    mockFetch.mockResolvedValue(
      makeFetchResponse({ audios: ['base64audiodata'] })
    );

    const shortText = 'Hello, this is a short sentence.';
    const result = await textToSpeech(shortText, 'hi-IN');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['base64audiodata']);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/text-to-speech');
    const body = JSON.parse(options.body);
    expect(body.inputs).toEqual([shortText]);
    expect(body.target_language_code).toBe('hi-IN');
  });

  it('splits long text (>1800 chars) into multiple chunks and calls API per chunk', async () => {
    // Build a string longer than 1800 chars with sentence boundaries
    const sentence = 'This is a sentence. ';
    // ~2000 chars total
    const longText = sentence.repeat(100);

    mockFetch.mockResolvedValue(
      makeFetchResponse({ audios: ['chunk_audio'] })
    );

    const result = await textToSpeech(longText, 'ta-IN');

    // Should have been called more than once due to splitting
    expect(mockFetch.mock.calls.length).toBeGreaterThan(1);

    // Result should be an array with one audio per chunk
    expect(result.length).toBe(mockFetch.mock.calls.length);
    result.forEach(audio => expect(audio).toBe('chunk_audio'));
  });

  it('throws when the TTS API returns a non-OK response', async () => {
    mockFetch.mockResolvedValue(makeFetchResponse({}, false, 500));

    await expect(textToSpeech('Hello', 'hi-IN')).rejects.toThrow('Sarvam TTS failed: 500');
  });
});

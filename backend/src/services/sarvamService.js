const SARVAM_BASE = 'https://api.sarvam.ai';

function headers() {
  return {
    'Content-Type': 'application/json',
    'api-subscription-key': process.env.SARVAM_API_KEY,
  };
}

async function translateText(text, targetLanguageCode) {
  const res = await fetch(`${SARVAM_BASE}/translate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      input: text,
      source_language_code: 'en-IN',
      target_language_code: targetLanguageCode,
      model: 'sarvam-translate:v1',
      mode: 'formal',
    }),
  });
  if (!res.ok) throw new Error(`Sarvam translate failed: ${res.status}`);
  const data = await res.json();
  return data.translated_text;
}

// Sarvam TTS supports max 2000 chars per request; split long text into chunks
function splitIntoChunks(text, maxLength = 1800) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Try to split at sentence boundary within maxLength
    let splitAt = maxLength;
    const lastPeriod = remaining.lastIndexOf('.', maxLength);
    if (lastPeriod > maxLength * 0.5) splitAt = lastPeriod + 1;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  return chunks;
}

async function textToSpeech(text, targetLanguageCode) {
  const chunks = splitIntoChunks(text);
  const audioChunks = [];
  for (const chunk of chunks) {
    const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        inputs: [chunk],
        target_language_code: targetLanguageCode,
        model: 'bulbul:v2',
        speaker: 'anushka',
        output_audio_codec: 'mp3',
        enable_preprocessing: true,
      }),
    });
    if (!res.ok) throw new Error(`Sarvam TTS failed: ${res.status}`);
    const data = await res.json();
    audioChunks.push(data.audios[0]);
  }
  // If multiple chunks, return array; client can handle concatenation
  return audioChunks;
}

export { translateText, textToSpeech };

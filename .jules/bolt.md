## YYYY-MM-DD - Parallelize Vision APIs
**Learning:** Sequential calls to external APIs like Gemini for multiple image descriptions (e.g., character images in stories) block the event loop and add significant latency, scaling linearly with the number of images.
**Action:** Use 'Promise.all' to parallelize independent I/O-bound external API calls, ensuring individual failures are caught within the mapping function to maintain non-fatal error handling.

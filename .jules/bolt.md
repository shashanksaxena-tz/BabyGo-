## 2024-05-11 - Parallelize Gemini Vision API Calls
**Learning:** Sequential `await` in `for...of` loops over external APIs (like Gemini's image description) creates massive cumulative latency, especially in endpoints handling multiple images like `/custom` story generation.
**Action:** Use `Promise.all` with `Array.prototype.map` for I/O-bound tasks. To maintain stability, ensure errors are caught *within* the map callback so a single failed request doesn't reject the entire batch.

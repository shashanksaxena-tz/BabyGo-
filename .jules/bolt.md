
## 2026-06-14 - Parallelize independent external API calls
**Learning:** Sequential 'await' calls inside 'for' loops for external API calls (e.g., Gemini Vision/Illustration) create significant cumulative latency bottlenecks.
**Action:** Use 'Promise.all' with 'Array.prototype.map' to parallelize independent I/O-bound operations, ensuring individual catch blocks are maintained to handle non-fatal errors gracefully without failing the entire batch.

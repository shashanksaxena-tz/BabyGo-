## 2024-05-17 - Promise.all limits
**Learning:** We replaced sequential Gemini requests with unbounded Promise.all mapping. In this sandbox it went fine since requests are mocked/small, but for large scale parallelization of third-party API calls, unconstrained Promise.all may hit rate limits (e.g. 429 Too Many Requests). For real production scenarios, consider concurrency limiters or batching.
**Action:** Be cautious of parallelizing loops with high iteration counts that interact with external services; use p-limit or chunking if the list can be large.

## 2024-06-01 - [Parallelizing independent API calls]
**Learning:** Sequential `await` in loops (`for...of`) causes severe performance bottlenecks when making external API calls, such as Google Gemini image descriptions or generative AI API endpoints.
**Action:** Use `Promise.all` with `map` to run these tasks concurrently, ensuring to catch individual errors within each promise to maintain non-fatal handling.

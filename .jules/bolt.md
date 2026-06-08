## 2024-05-24 - Parallel Database Queries
**Learning:** Sequential database queries (like `find` and `countDocuments` for pagination, or fetching a post and its comments) can significantly block response latency.
**Action:** Use `Promise.all()` to execute independent database queries concurrently. This is a common performance pattern that yields a measurable reduction in response time without sacrificing code readability.

## 2024-05-14 - Use lean() on Mongoose queries
**Learning:** For read-only Mongoose queries, use `.lean()` to bypass document hydration, which significantly improves performance and memory usage. Note that this cannot be used if virtual fields or document methods are needed.
**Action:** Always check if a `.find()` or `.findOne()` query is strictly read-only and doesn't rely on Mongoose magic before applying `.lean()`.

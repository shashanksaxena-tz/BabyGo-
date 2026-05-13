## 2026-05-13 - Optimize Read-Only Queries with `.lean()`
**Learning:** Found multiple instances where `Mongoose.find()` was used for pure read operations (e.g., listing reports, timeline entries, analysis) without `.lean()`. This forces Mongoose to hydrate full documents, increasing memory usage and processing time unnecessarily when only JSON serialization is needed.
**Action:** Append `.lean()` to all read-only `find()` queries where virtuals and document methods are not needed, and include a comment explaining the optimization.

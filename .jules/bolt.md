
## 2024-03-20 - [Performance] Use .lean() for Read-Only Mongoose Queries
**Learning:** Found several endpoints (doctors, reports, timeline) performing read-only database queries (like `find()` and `findOne()`) without `.lean()`. This caused Mongoose to needlessly hydrate full document objects when raw JSON was sufficient, increasing memory overhead and serialization time. Also found cases where `.toObject()` was unnecessarily called manually after a hydrated query.
**Action:** Always append `.lean()` to Mongoose `.find()` and `.findOne()` queries when the documents are only being read and sent back via the API, avoiding manual `.toObject()` conversion. (Caveat: avoid `.lean()` when using Mongoose virtuals or document methods).

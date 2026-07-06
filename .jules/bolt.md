## 2024-07-06 - Parallelizing Mongoose Lookups with exists() and lean()
**Learning:** Checking for parent document existence (like Child) in isolation blocks data fetching. We can optimize latency by parallelizing an `exists()` check and using `.lean()` for read-only child collections.
**Action:** Use `Promise.all([Model.exists(...), RelatedModel.find(...).lean()])` instead of sequential `findOne` and `find` to reduce latency and memory overhead for read-only routes.

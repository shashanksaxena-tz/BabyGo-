## 2024-05-24 - Parallelize DB Queries in Timeline Routes
**Learning:** When validating the existence of a parent document before querying related records, using `Model.findOne()` followed by `Model.find()` causes sequential blocking.
**Action:** Use `Model.exists()` instead of `Model.findOne()` and parallelize the existence check with related data queries using `Promise.all()`. Combine with `.lean()` for read-only queries to save memory.

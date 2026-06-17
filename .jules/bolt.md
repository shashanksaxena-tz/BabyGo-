
## 2024-06-17 - Optimize Mongoose Queries with .lean() and Parallel Execution
**Learning:** When fetching records related to a parent document (e.g., timeline entries for a child), replacing sequential `Parent.findOne()` and `Child.find()` calls with `Promise.all([Parent.exists(), Child.find().lean()])` reduces database blocking and bypasses Mongoose hydration overhead. However, using `.lean()` drops virtual fields (like `id` mapped from `_id`), requiring manual mapping if the frontend expects them.
**Action:** Always parallelize existence checks with data queries using `Promise.all()` and `.exists()`. Append `.lean()` for read-only queries, but ensure manual mapping of `_id` to `id` for frontend compatibility to prevent breaking changes.

## 2024-05-18 - Promise.all Optimization for MongoDB Lookups
**Learning:** Sequential `.find()` and `.countDocuments()` on the same filter, or fetching parent and child records concurrently, provides a significant (~30-40%) latency reduction, especially on community routes.
**Action:** When a route performs independent database reads sequentially, refactor to execute them in parallel via `Promise.all`.

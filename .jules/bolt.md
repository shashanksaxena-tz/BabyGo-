## 2025-02-07 - Timeline Routes Sequential Query Blocking
**Learning:** Sequential parent existence checks and subsequent document fetch queries are synchronous bottlenecks. Instantiating Mongoose documents via `.findOne()` is computationally expensive when only validating a relationship exists.
**Action:** Use `Child.exists()` in parallel via `Promise.all()` and append `.lean()` to read-only queries. Validate Mongoose virtuals are unneeded before applying `.lean()`.

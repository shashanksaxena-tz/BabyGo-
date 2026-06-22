## 2024-06-22 - Backend Performance Optimization Pattern
**Learning:** In Mongoose routes, verifying a parent document's existence with `Child.findOne({ _id: childId })` before fetching related entries blocks the query sequentially. Additionally, `Model.exists()` is more efficient than `Model.findOne()` when only checking existence.
**Action:** Use `Promise.all` to run `Child.exists()` and the related items query (e.g., `TimelineEntry.find()`) concurrently. Apply `.lean()` on read-only queries when Mongoose virtuals are not needed.

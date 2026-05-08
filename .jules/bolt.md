## 2024-05-08 - Performance Optimization
**Learning:** Adding `.lean()` to Mongoose `.find()` queries for read-only operations can significantly improve performance and reduce memory usage by bypassing document hydration.
**Action:** Review all `.find()` calls in route handlers that only serialize data to JSON, and add `.lean()` where appropriate, being mindful of Mongoose virtuals.

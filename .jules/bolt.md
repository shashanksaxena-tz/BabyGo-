## 2024-07-24 - Mongoose Virtuals and .lean()
**Learning:** When applying `.lean()` optimizations to Mongoose queries for API responses, Mongoose's default virtual `.id` getter (which maps `_id` to a string) is omitted. If the frontend relies on `.id` instead of `._id`, it causes undefined mapping bugs in UI components.
**Action:** When migrating queries to `.lean()`, always manually map `id: doc._id.toString()` onto the returned objects to preserve frontend compatibility.

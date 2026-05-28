## 2025-02-18 - Mongoose `.lean()` and `.toObject()` interactions
**Learning:** Adding `.lean()` to Mongoose read-only queries improves performance by returning Plain Old JavaScript Objects (POJOs) instead of heavy Mongoose documents. However, this means subsequent calls to `.toObject()` on the returned elements will cause a `TypeError: d.toObject is not a function`.
**Action:** When adding `.lean()` to existing queries, always review the code that consumes the results and remove any redundant `.toObject()` calls.

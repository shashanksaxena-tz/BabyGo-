## 2024-05-18 - [Mongoose Query Performance: Bypassing Hydration]
**Learning:** For read-only operations that don't require Mongoose instance methods (like `save()` or virtuals), using `.lean()` significantly speeds up database queries and reduces memory usage by skipping document hydration and returning plain JavaScript objects.
**Action:** Always append `.lean()` to Mongoose `find()` or `findOne()` queries when the retrieved documents are only used for reading or mapping, and remove unnecessary `.toObject()` calls since the results are already plain objects.

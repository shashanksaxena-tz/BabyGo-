## 2024-05-24 - Bypass Mongoose Document Hydration for List Endpoints
**Learning:** Returning multiple Mongoose documents (e.g. from `.find()`) incurs significant overhead because Mongoose hydrates each document with virtuals, getters/setters, and save/update methods. The `toObject()` call is also unnecessary if the properties are mapped properly.
**Action:** Always append `.lean()` to Mongoose `.find()` queries for read-only API endpoints to return plain JavaScript objects, improving performance and memory usage. Remove any subsequent `.toObject()` calls on the results.

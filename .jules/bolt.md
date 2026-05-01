## 2024-05-01 - Missing .lean() on read-only queries
**Learning:** Found several read-only Mongoose queries missing `.lean()`, which causes a performance hit due to Mongoose hydrating documents. Memory mentioned this as a performance pattern.
**Action:** Add `.lean()` to all read-only Mongoose `.find()` queries where the returned documents aren't modified and saved back to the database.

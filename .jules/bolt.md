## 2024-05-07 - Missing .lean() on read-only queries
**Learning:** Found multiple instances where Mongoose `.find()` queries were not using `.lean()` for read-only operations. This is a significant performance anti-pattern as it unnecessarily hydrates full Mongoose documents when plain JavaScript objects would suffice, consuming excess memory and CPU.
**Action:** Always append `.lean()` to Mongoose read-only queries unless document methods (like `.save()`) or virtuals are explicitly needed.

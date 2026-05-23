## 2026-05-23 - Optimize Mongoose read-only queries with .lean()
**Learning:** Using .lean() on Mongoose .find() queries is an effective optimization pattern for read-only operations where Mongoose document instances aren't required. It avoids the overhead of document hydration.
**Action:** When making read-only database queries via Mongoose, always evaluate if .lean() can be appended, but be cautious of code that relies on virtual fields or specific document methods.

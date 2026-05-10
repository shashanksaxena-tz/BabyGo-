## 2026-05-10 - Add .lean() to read-only Mongoose queries
**Learning:** Found multiple routes where `.toObject()` or `.map(d => d.toObject())` were used on read-only endpoints in `backend/src/routes`. This is a classic anti-pattern since hydrating documents just to serialize them wastes memory.
**Action:** When finding read-only `.find()` queries, add `.lean()` and remove the redundant `.toObject()` conversions to prevent runtime TypeErrors while gaining performance.

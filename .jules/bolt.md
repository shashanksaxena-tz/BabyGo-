## 2024-06-04 - Missing lean() optimizations in list endpoints

**Learning:** When retrieving read-only lists of models without virtual methods, appending `.lean()` to Mongoose queries returns plain objects instead of heavy Mongoose Documents, dramatically reducing memory usage and CPU time spent on hydration.
**Action:** When querying large lists in Mongoose (`find()`), check if we can add `.lean()` and remove `.toObject()` calls, provided there are no virtual properties or `.save()` calls needed on those documents.

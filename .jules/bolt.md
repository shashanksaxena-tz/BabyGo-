## 2026-06-15 - [Initial]
**Learning:** Checking existence with `exists` instead of `findOne` is faster.
**Action:** When only validating presence, use `Model.exists()`. Parallelize it with the actual query when possible.

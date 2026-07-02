## 2024-07-02 - Timeline Optimization
**Learning:** Parallelizing parent existence checks with queries and using .lean() significantly improves read performance.
**Action:** Use Promise.all with Model.exists and Model.find().lean() for read-only endpoints fetching related data.

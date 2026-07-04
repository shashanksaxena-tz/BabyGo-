## 2026-07-04 - Optimize timeline and measurements GET endpoints
**Learning:** Use Promise.all with Child.exists and lean() to speed up related document queries.
**Action:** Parallelize existence check and lean queries.

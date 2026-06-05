## 2024-05-18 - Promise.all Optimization for Independent DB Queries
**Learning:** Sequential Mongoose queries that are independent of each other (like counting total documents and fetching paginated results, or fetching recommendations and user favorites simultaneously) create unnecessary sequential I/O blocking, increasing overall request latency.
**Action:** Use `Promise.all()` to parallelize these independent queries to significantly improve backend response times for routes making multiple database calls.

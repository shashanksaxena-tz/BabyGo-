
## 2024-06-09 - Sequential Database Queries in Pagination Routes
**Learning:** In backend endpoints returning paginated lists alongside total document counts (e.g., `GET /api/community/posts`), `Post.find` and `Post.countDocuments` are often executed sequentially, blocking the thread unnecessarily and increasing overall API response latency.
**Action:** When working on pagination endpoints, actively look to parallelize these independent queries using `Promise.all([findQuery, countQuery])` to reduce latency. This is a common and safe performance pattern.

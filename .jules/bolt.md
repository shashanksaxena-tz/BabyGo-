## 2026-06-11 - [Parallelizing Mongoose Queries]
**Learning:** Sequential  and  queries on independent models (like `Child` and `TimelineEntry`) cause unnecessary sequential blocking and increase endpoint latency. Using `Model.exists()` instead of `Model.findOne()` when only existence matters saves memory and parsing time.
**Action:** Use `Promise.all()` with `Model.exists()` and `Model.find().lean()` to fetch and verify data concurrently without the overhead of document hydration when readonly.
## 2026-06-11 - [Parallelizing Mongoose Queries]
**Learning:** Sequential `.findOne()` and `.find()` queries on independent models (like Child and TimelineEntry) cause unnecessary sequential blocking and increase endpoint latency. Using `Model.exists()` instead of `Model.findOne()` when only existence matters saves memory and parsing time.
**Action:** Use `Promise.all()` with `Model.exists()` and `Model.find().lean()` to fetch and verify data concurrently without the overhead of document hydration when readonly.

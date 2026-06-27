## 2024-06-27 - [Parallelize Existence Checks]
**Learning:** Checking for a parent document's existence (e.g. `Child.findOne()`) before querying for its related sub-documents (e.g. `TimelineEntry.find()`) causes sequential blocking and slow N+1 query patterns.
**Action:** Use `Promise.all([ParentModel.exists(), ChildModel.find().lean()])` to run the existence validation and data fetch concurrently. Ensure `.lean()` queries include mapping `_id` to `id` if the frontend expects Mongoose's `.id` virtual field.

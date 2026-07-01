## 2024-07-01 - Parallel Query and Lean Validation
**Learning:** Sequential `.findOne` for a parent document followed by `.find` for related records is an anti-pattern that creates blocking I/O and unnecessary overhead. Mongoose `.lean()` strips `.id` virtuals requiring manual mapping for frontend compatibility.
**Action:** Use `Promise.all([Model.exists({_id}), RelatedModel.find({...}).lean()])` to parallelize existence checks with querying. Always manually assign `.id = ._id` when using `.lean()` if the frontend depends on the `.id` field.

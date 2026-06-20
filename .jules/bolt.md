## 2024-06-20 - [Timeline Route Performance]
**Learning:** Checking for a parent document (`Child.findOne`) before fetching related collections (`TimelineEntry.find`, `Measurement.find`) creates unnecessary sequential DB blocks. Using `Model.exists()` and parallelizing queries via `Promise.all()` is preferred when full hydration isn't needed. Furthermore, `.lean()` should be applied for read-only timeline data.
**Action:** When adding timeline features, ensure `Child.exists()` and `.lean()` are used where appropriate.

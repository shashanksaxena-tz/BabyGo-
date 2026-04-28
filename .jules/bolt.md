## 2024-05-18 - [Add lean() to Mongoose Queries]
**Learning:** Some Mongoose queries in this project (e.g. in `reports.js`, `children.js`, `timeline.js`, `analysis.js`, `community.js`, `stories.js`) do not use `.lean()` when they are only fetching data for reading. Returning plain javascript objects using `.lean()` instead of full Mongoose Documents is faster, uses less memory, and is an excellent target for micro-optimizations.
**Action:** Append `.lean()` to Mongoose `.find()` queries where the returned document does not need to be updated and saved.

## 2024-05-18 - [Integration tests error on containerd overlay]
**Learning:** Running `npm test:integration` or `npm test` fails in this sandbox environment because `@testcontainers/mongodb` fails to mount due to an overlay error. The integration tests rely on Docker/Testcontainers which isn't fully supported in this restricted sandbox.
**Action:** Run `npm run test:unit` only to verify changes since integration tests are known to fail due to sandbox constraints.

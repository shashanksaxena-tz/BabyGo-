## 2024-05-25 - Backend Integration Tests Testcontainers Issue
**Learning:** Backend integration tests using `@testcontainers/mongodb` fail to start in this sandbox environment due to `containerd` overlay mount errors.
**Action:** Since unit tests run properly, rely on unit tests and syntax checks (`node -c <file_path>`) for verification within the sandbox when `test:integration` fails.

.PHONY: test test-backend test-desktop test-web test-e2e test-smoke test-a11y test-load

# Unit + integration tests
test-backend:
	cd backend && npm test

test-backend-unit:
	cd backend && npm run test:unit

test-backend-integration:
	cd backend && npm run test:integration

test-desktop:
	cd desktop-frontend && npx vitest run

test-web:
	cd tinysteps-ai && npx vitest run

# E2E tests (requires Docker compose running)
test-e2e:
	cd e2e && npx playwright test

test-smoke:
	cd e2e && npx playwright test --grep @smoke

test-a11y:
	cd e2e && npx playwright test --grep @a11y

# Load tests (requires k6 installed and Docker compose running)
test-load:
	cd load-tests && k6 run mixed-workload.js

# Run all unit tests (no Docker needed)
test-all-unit:
	$(MAKE) test-backend-unit test-desktop test-web

# Run everything (needs Docker for integration + E2E)
test:
	$(MAKE) test-backend test-desktop test-web test-e2e

import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// Set up MSW server with default handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test (allows per-test overrides)
afterEach(() => {
  server.resetHandlers();
});

// Stop server after all tests
afterAll(() => {
  server.close();
});

import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// jsdom 29 + vitest 4: localStorage may not be a proper Storage instance at module
// parse time, causing "localStorage.getItem is not a function". Provide a polyfill.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store: Record<string, string> = {};
  const localStorageMock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Set up MSW server with default handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test (allows per-test overrides) and clear storage state
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

// Stop server after all tests
afterAll(() => {
  server.close();
});

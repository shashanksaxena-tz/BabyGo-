import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// Polyfill localStorage for jsdom
if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  } as Storage;
}

// Mock window.speechSynthesis for jsdom
Object.defineProperty(window, 'speechSynthesis', {
  value: { cancel: () => {}, speak: () => {}, getVoices: () => [], pending: false, speaking: false, paused: false, onvoiceschanged: null, addEventListener: () => {}, removeEventListener: () => {} },
  writable: true,
  configurable: true,
});

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

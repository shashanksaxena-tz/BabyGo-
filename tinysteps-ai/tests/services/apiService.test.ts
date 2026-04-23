import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../setup/setup';
import { http, HttpResponse } from 'msw';
import apiService from '../../services/apiService';

const API_BASE = 'http://localhost:3001/api';

describe('apiService', () => {
  beforeEach(() => {
    // Clear any stored token between tests
    apiService.clearToken();
  });

  describe('getAppConfig', () => {
    it('returns app config data from /api/config', async () => {
      const result = await apiService.getAppConfig();

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      // Real backend returns domains as an object keyed by domain name
      expect(result.data.domains).toBeDefined();
      expect(typeof result.data.domains).toBe('object');
      expect(result.data.domains).not.toBeInstanceOf(Array);
      expect(result.data.domains.motor).toHaveProperty('key', 'motor');
      expect(result.data.domains.cognitive).toHaveProperty('label', 'Cognitive');
      // Config should also include statuses, supportedLanguages, timeFilters
      expect(result.data.statuses).toBeDefined();
      expect(result.data.supportedLanguages).toBeDefined();
      expect(result.data.timeFilters).toBeDefined();
    });

    it('returns an error when the server responds with an error status', async () => {
      server.use(
        http.get(`${API_BASE}/config`, () => {
          return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
        })
      );

      const result = await apiService.getAppConfig();

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('login', () => {
    it('returns token and user on successful login', async () => {
      const result = await apiService.login('test@example.com', 'password123');

      expect(result.error).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.token).toBe('mock-jwt-token');
      expect(result.data?.user).toHaveProperty('email', 'test@example.com');
    });

    it('stores token in localStorage on successful login', async () => {
      await apiService.login('test@example.com', 'password123');

      expect(localStorage.getItem('tinysteps_token')).toBe('mock-jwt-token');
    });

    it('returns an error on failed login', async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        })
      );

      const result = await apiService.login('bad@example.com', 'wrong');

      expect(result.error).toBe('Invalid credentials');
      expect(result.data).toBeUndefined();
    });

    it('includes Authorization header on subsequent requests after login', async () => {
      let capturedAuthHeader: string | null = null;

      server.use(
        http.get(`${API_BASE}/auth/me`, ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({ _id: 'user-123', name: 'Test Parent' });
        })
      );

      await apiService.login('test@example.com', 'password123');
      await apiService.getProfile();

      expect(capturedAuthHeader).toBe('Bearer mock-jwt-token');
    });
  });
});

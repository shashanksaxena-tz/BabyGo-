import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import api, { getAppConfig, getMilestones } from '../src/api';

describe('API client', () => {
    beforeEach(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    });

    afterEach(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    });

    describe('getAppConfig()', () => {
        it('calls GET /config and returns data with domains', async () => {
            const data = await getAppConfig();
            expect(data).toBeDefined();
            expect(data.domains).toBeDefined();
            expect(data.domains.motor).toBeDefined();
            expect(data.domains.cognitive).toBeDefined();
            expect(data.domains.language).toBeDefined();
            expect(data.domains.social).toBeDefined();
        });
    });

    describe('getMilestones(age)', () => {
        it('calls GET /analysis/milestones/:age and returns milestone data', async () => {
            const data = await getMilestones(6);
            expect(data).toBeDefined();
            expect(data.milestones).toBeDefined();
            expect(Array.isArray(data.milestones)).toBe(true);
            expect(data.ageMonths).toBe(6);
        });
    });

    describe('axios interceptor — Authorization header', () => {
        it('adds Authorization header when localStorage has token', async () => {
            localStorage.setItem('token', 'test-jwt-token');

            // Make a real request and inspect the interceptor behavior by checking
            // the request config via axios defaults approach
            let capturedHeaders: Record<string, string> | undefined;

            const interceptorId = api.interceptors.request.use((config) => {
                capturedHeaders = config.headers as Record<string, string>;
                return config;
            });

            await api.get('/config').catch(() => {});

            api.interceptors.request.eject(interceptorId);

            expect(capturedHeaders?.Authorization).toBe('Bearer test-jwt-token');
        });

        it('does not add Authorization header when no token in localStorage', async () => {
            // Ensure no token
            localStorage.removeItem('token');

            let capturedHeaders: Record<string, string> | undefined;

            const interceptorId = api.interceptors.request.use((config) => {
                capturedHeaders = config.headers as Record<string, string>;
                return config;
            });

            await api.get('/config').catch(() => {});

            api.interceptors.request.eject(interceptorId);

            expect(capturedHeaders?.Authorization).toBeUndefined();
        });
    });
});

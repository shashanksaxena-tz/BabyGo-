/**
 * Task 11: Config integration tests
 */
import '../setup/integrationBase.js';
import { request } from '../setup/integrationBase.js';

describe('GET /api/config', () => {
  it('returns full config without requiring auth', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    expect(res.body.domains).toBeDefined();
    expect(res.body.statuses).toBeDefined();
    expect(res.body.scoreThresholds).toBeDefined();
    expect(res.body.timeFilters).toBeDefined();
    expect(res.body.supportedLanguages).toBeDefined();
  });

  it('has all 4 required domains', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    const domainKeys = Object.keys(res.body.domains);
    expect(domainKeys).toContain('motor');
    expect(domainKeys).toContain('cognitive');
    expect(domainKeys).toContain('language');
    expect(domainKeys).toContain('social');
  });

  it('each domain has label and color', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    for (const [, domain] of Object.entries(res.body.domains)) {
      expect(domain.label).toBeDefined();
      expect(domain.color).toBeDefined();
    }
  });
});

describe('GET /api/config/domains', () => {
  it('returns domains only', async () => {
    const res = await request()
      .get('/api/config/domains')
      .expect(200);

    expect(res.body.domains).toBeDefined();
    // Should not have other config keys
    expect(res.body.statuses).toBeUndefined();
    expect(res.body.timeFilters).toBeUndefined();
  });
});

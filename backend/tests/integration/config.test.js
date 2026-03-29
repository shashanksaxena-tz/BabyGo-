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

    // Each top-level config key must be present and be an object (not undefined or null)
    expect(res.body.domains).toBeInstanceOf(Object);
    expect(res.body.statuses).toBeInstanceOf(Object);
    expect(res.body.scoreThresholds).toBeInstanceOf(Object);
    expect(res.body.timeFilters).toBeInstanceOf(Object);
    expect(Array.isArray(res.body.supportedLanguages)).toBe(true);
    expect(res.body.supportedLanguages.length).toBeGreaterThan(0);
  });

  it('contains the 4 core domains: motor, cognitive, language, social', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    const domainKeys = Object.keys(res.body.domains);
    expect(domainKeys).toContain('motor');
    expect(domainKeys).toContain('cognitive');
    expect(domainKeys).toContain('language');
    expect(domainKeys).toContain('social');
    // At least 4 domains (may include sensory or others)
    expect(domainKeys.length).toBeGreaterThanOrEqual(4);
  });

  it('each domain has a string label, string color, and string key', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    for (const [, domain] of Object.entries(res.body.domains)) {
      expect(typeof domain.label).toBe('string');
      expect(domain.label.length).toBeGreaterThan(0);
      expect(typeof domain.color).toBe('string');
      // Color must be a CSS hex string starting with '#'
      expect(domain.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(typeof domain.key).toBe('string');
    }
  });

  it('scoreThresholds has excellent, moderate, and concern keys each with a numeric min', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    const { scoreThresholds } = res.body;
    expect(scoreThresholds).toBeInstanceOf(Object);
    expect(typeof scoreThresholds.excellent.min).toBe('number');
    expect(typeof scoreThresholds.moderate.min).toBe('number');
    expect(typeof scoreThresholds.concern.min).toBe('number');
    // Thresholds must be ordered: excellent > moderate > concern
    expect(scoreThresholds.excellent.min).toBeGreaterThan(scoreThresholds.moderate.min);
    expect(scoreThresholds.moderate.min).toBeGreaterThan(scoreThresholds.concern.min);
  });

  it('timeFilters is a non-empty array of objects with id and label string fields', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    const { timeFilters } = res.body;
    expect(Array.isArray(timeFilters)).toBe(true);
    expect(timeFilters.length).toBeGreaterThan(0);

    for (const filter of timeFilters) {
      expect(typeof filter.id).toBe('string');
      expect(filter.id.length).toBeGreaterThan(0);
      expect(typeof filter.label).toBe('string');
      expect(filter.label.length).toBeGreaterThan(0);
    }
  });

  it('supportedLanguages entries have code and label string fields', async () => {
    const res = await request()
      .get('/api/config')
      .expect(200);

    expect(res.body.supportedLanguages.length).toBeGreaterThanOrEqual(1);
    for (const lang of res.body.supportedLanguages) {
      expect(typeof lang.code).toBe('string');
      expect(lang.code.length).toBeGreaterThan(0);
      expect(typeof lang.label).toBe('string');
      expect(lang.label.length).toBeGreaterThan(0);
    }
  });
});

describe('GET /api/config/domains', () => {
  it('returns domains object containing the 4 core domain keys and no other config sections', async () => {
    const res = await request()
      .get('/api/config/domains')
      .expect(200);

    expect(res.body.domains).toBeInstanceOf(Object);
    const domainKeys = Object.keys(res.body.domains);
    expect(domainKeys).toContain('motor');
    expect(domainKeys).toContain('cognitive');
    expect(domainKeys).toContain('language');
    expect(domainKeys).toContain('social');
    // Should not include other config sections
    expect(res.body.statuses).toBeUndefined();
    expect(res.body.timeFilters).toBeUndefined();
    expect(res.body.scoreThresholds).toBeUndefined();
    expect(res.body.supportedLanguages).toBeUndefined();
  });
});

/**
 * Unit tests for src/services/whoDataService.js
 *
 * whoDataService is a pure in-memory data service — no mocking needed.
 */

const whoDataService = (await import('../../../src/services/whoDataService.js')).default;

// ---------------------------------------------------------------------------
// getAllMilestones
// ---------------------------------------------------------------------------
describe('getAllMilestones', () => {
  it('returns a non-empty array', () => {
    const milestones = whoDataService.getAllMilestones();
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('each milestone has required fields: id, title, description, domain, minMonths, maxMonths, typicalMonths', () => {
    const milestones = whoDataService.getAllMilestones();
    for (const m of milestones) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('title');
      expect(m).toHaveProperty('description');
      expect(m).toHaveProperty('domain');
      expect(m).toHaveProperty('minMonths');
      expect(m).toHaveProperty('maxMonths');
      expect(m).toHaveProperty('typicalMonths');
    }
  });
});

// ---------------------------------------------------------------------------
// getMilestonesForAge
// ---------------------------------------------------------------------------
describe('getMilestonesForAge', () => {
  it('returns relevant milestones for age 6 months', () => {
    const milestones = whoDataService.getMilestonesForAge(6);
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones.length).toBeGreaterThan(0);

    // All returned milestones should be relevant for 6 months
    for (const m of milestones) {
      expect(m.minMonths - 1).toBeLessThanOrEqual(6);
      expect(m.maxMonths + 3).toBeGreaterThanOrEqual(6);
    }
  });

  it('returns milestones for age 0 (newborn)', () => {
    const milestones = whoDataService.getMilestonesForAge(0);
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('covers all 4 main domains for age 12 months', () => {
    const milestones = whoDataService.getMilestonesForAge(12);
    const domains = new Set(milestones.map(m => m.domain));
    expect(domains.has('motor')).toBe(true);
    expect(domains.has('language')).toBe(true);
    expect(domains.has('cognitive')).toBe(true);
    expect(domains.has('social')).toBe(true);
  });

  it('returns empty array for age 200 months (no relevant milestones)', () => {
    const milestones = whoDataService.getMilestonesForAge(200);
    expect(milestones).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSourcesForRegion
// ---------------------------------------------------------------------------
describe('getSourcesForRegion', () => {
  it('returns WHO base sources plus SEARO regional source for region "searo"', () => {
    const sources = whoDataService.getSourcesForRegion('searo');
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);

    // Should include a searo-specific regional source
    const regionalSource = sources.find(s => s.type === 'regional');
    expect(regionalSource).toBeDefined();
    expect(regionalSource.url).toContain('southeastasia');
  });

  it('returns only base WHO sources for an unknown region', () => {
    const baseSources = whoDataService.getSourcesForRegion('searo');
    const unknownSources = whoDataService.getSourcesForRegion('unknown-region-xyz');

    // Unknown region should return fewer sources (only WHO base, no regional)
    expect(unknownSources.length).toBeLessThan(baseSources.length);
    // All sources should be non-regional WHO sources
    const hasRegional = unknownSources.some(s => s.type === 'regional');
    expect(hasRegional).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// assessGrowth
// ---------------------------------------------------------------------------
describe('assessGrowth', () => {
  it('returns percentile data for weight and height', () => {
    const child = {
      weight: 7.5,
      height: 67,
      gender: 'male',
      ageInMonths: 6,
    };

    const results = whoDataService.assessGrowth(child);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(2);

    const weightResult = results.find(r => r.metric === 'weight');
    const heightResult = results.find(r => r.metric === 'height');

    expect(weightResult).toBeDefined();
    expect(weightResult.percentile).toBeGreaterThan(0);
    expect(weightResult.percentile).toBeLessThanOrEqual(100);
    expect(weightResult.interpretation).toBeTruthy();

    expect(heightResult).toBeDefined();
    expect(heightResult.percentile).toBeGreaterThan(0);
    expect(heightResult.percentile).toBeLessThanOrEqual(100);
    expect(heightResult.interpretation).toBeTruthy();
  });

  it('includes head circumference in results when provided and age < 36 months', () => {
    const child = {
      weight: 7.5,
      height: 67,
      headCircumference: 43,
      gender: 'female',
      ageInMonths: 6,
    };

    const results = whoDataService.assessGrowth(child);
    const hcResult = results.find(r => r.metric === 'headCircumference');
    expect(hcResult).toBeDefined();
    expect(hcResult.percentile).toBeGreaterThan(0);
  });
});

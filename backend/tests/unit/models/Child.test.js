/**
 * Unit tests for src/models/Child.js
 *
 * Uses mongodb-memory-server for an in-process MongoDB instance.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
const Child = (await import('../../../src/models/Child.js')).default;

// ---------------------------------------------------------------------------
// Shared valid payload
// ---------------------------------------------------------------------------
const VALID_CHILD = {
  userId: 'user123',
  name: 'Baby Leo',
  dateOfBirth: (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d;
  })(),
  gender: 'male',
  weight: 7.5,
  height: 65,
  region: 'searo',
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Child.deleteMany({});
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
describe('Child.create', () => {
  it('creates a child with required fields', async () => {
    const child = await Child.create(VALID_CHILD);

    expect(child._id).toBeDefined();
    expect(child.name).toBe(VALID_CHILD.name);
    expect(child.gender).toBe('male');
    expect(child.region).toBe('searo');
  });

  it('rejects invalid gender', async () => {
    await expect(
      Child.create({ ...VALID_CHILD, gender: 'robot' })
    ).rejects.toThrow();
  });

  it('rejects invalid region', async () => {
    await expect(
      Child.create({ ...VALID_CHILD, region: 'narnia' })
    ).rejects.toThrow();
  });

  it('rejects missing required fields', async () => {
    await expect(
      Child.create({ userId: 'user123', name: 'Incomplete' })
    ).rejects.toThrow();
  });

  it('accepts all valid region values', async () => {
    const validRegions = ['afro', 'amro', 'searo', 'euro', 'emro', 'wpro'];
    for (const region of validRegions) {
      const child = await Child.create({ ...VALID_CHILD, region });
      expect(child.region).toBe(region);
      await child.deleteOne();
    }
  });

  it('accepts all valid gender values', async () => {
    const validGenders = ['male', 'female', 'other'];
    for (const gender of validGenders) {
      const child = await Child.create({ ...VALID_CHILD, gender });
      expect(child.gender).toBe(gender);
      await child.deleteOne();
    }
  });
});

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------
describe('Child virtuals', () => {
  it('ageInMonths returns a non-negative integer for a 6-month-old child', async () => {
    const child = await Child.create(VALID_CHILD);
    const ageMonths = child.ageInMonths;

    expect(typeof ageMonths).toBe('number');
    // Should be around 6 months (allow ±1 for edge cases around month boundaries)
    expect(ageMonths).toBeGreaterThanOrEqual(5);
    expect(ageMonths).toBeLessThanOrEqual(7);
  });

  it('displayAge returns a human-readable string', async () => {
    const child = await Child.create(VALID_CHILD);
    const displayAge = child.displayAge;

    expect(typeof displayAge).toBe('string');
    expect(displayAge.length).toBeGreaterThan(0);
    // 6-month-old should contain "month"
    expect(displayAge).toMatch(/month/i);
  });

  it('displayAge returns days for a newborn (< 1 month)', async () => {
    const threeDaysOld = new Date();
    threeDaysOld.setDate(threeDaysOld.getDate() - 3);

    const child = await Child.create({ ...VALID_CHILD, dateOfBirth: threeDaysOld });
    expect(child.displayAge).toMatch(/day/i);
  });

  it('displayAge returns years for a child >= 24 months', async () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const child = await Child.create({ ...VALID_CHILD, dateOfBirth: twoYearsAgo });
    expect(child.displayAge).toMatch(/year/i);
  });

  it('virtuals are included in toJSON output', async () => {
    const child = await Child.create(VALID_CHILD);
    const json = child.toJSON();

    expect(json.ageInMonths).toBeDefined();
    expect(json.displayAge).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// findByAnyId
// ---------------------------------------------------------------------------
describe('Child.findByAnyId', () => {
  it('finds a child by valid ObjectId string', async () => {
    const created = await Child.create(VALID_CHILD);
    const found = await Child.findByAnyId(String(created._id));

    expect(found).not.toBeNull();
    expect(String(found._id)).toBe(String(created._id));
  });

  it('returns null for a non-ObjectId string', async () => {
    const result = await Child.findByAnyId('not-a-valid-id');
    expect(result).toBeNull();
  });

  it('returns null for an unknown but valid-format ObjectId', async () => {
    const result = await Child.findByAnyId('000000000000000000000001');
    expect(result).toBeNull();
  });
});

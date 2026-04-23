/**
 * Unit tests for src/services/storageService.js
 *
 * Mocks the minio Client and uuid so no real MinIO server is needed.
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock minio Client
// ---------------------------------------------------------------------------
const mockBucketExists = jest.fn();
const mockMakeBucket = jest.fn();
const mockSetBucketPolicy = jest.fn();

const MockMinioClient = jest.fn().mockImplementation(() => ({
  bucketExists: mockBucketExists,
  makeBucket: mockMakeBucket,
  setBucketPolicy: mockSetBucketPolicy,
}));

jest.unstable_mockModule('minio', () => ({
  Client: MockMinioClient,
}));

// ---------------------------------------------------------------------------
// Mock uuid
// ---------------------------------------------------------------------------
const mockUuidV4 = jest.fn().mockReturnValue('test-uuid-1234');

jest.unstable_mockModule('uuid', () => ({
  v4: mockUuidV4,
}));

// Import after mocks are registered
const storageServiceModule = await import('../../../src/services/storageService.js');
const { BUCKETS } = storageServiceModule;
// storageService is the default export (singleton)
const storageService = storageServiceModule.default;

// ---------------------------------------------------------------------------
// BUCKETS constant
// ---------------------------------------------------------------------------
describe('BUCKETS', () => {
  it('has PROFILES property', () => {
    expect(BUCKETS).toHaveProperty('PROFILES');
    expect(typeof BUCKETS.PROFILES).toBe('string');
    expect(BUCKETS.PROFILES.length).toBeGreaterThan(0);
  });

  it('has STORIES property', () => {
    expect(BUCKETS).toHaveProperty('STORIES');
    expect(typeof BUCKETS.STORIES).toBe('string');
    expect(BUCKETS.STORIES.length).toBeGreaterThan(0);
  });

  it('has REPORTS property', () => {
    expect(BUCKETS).toHaveProperty('REPORTS');
    expect(typeof BUCKETS.REPORTS).toBe('string');
    expect(BUCKETS.REPORTS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// initialize
// ---------------------------------------------------------------------------
describe('initialize', () => {
  beforeEach(() => {
    // Reset mocks and service state before each test
    mockBucketExists.mockReset();
    mockMakeBucket.mockReset();
    mockSetBucketPolicy.mockReset();
    MockMinioClient.mockClear();

    // Reset initialized flag so we can call initialize() multiple times
    storageService.initialized = false;
    storageService.client = null;
  });

  it('creates buckets that do not already exist', async () => {
    // All buckets do not exist
    mockBucketExists.mockResolvedValue(false);
    mockMakeBucket.mockResolvedValue(undefined);
    mockSetBucketPolicy.mockResolvedValue(undefined);

    await storageService.initialize();

    // Should have checked existence for each bucket
    expect(mockBucketExists).toHaveBeenCalledTimes(3);

    // Should have created each bucket since none existed
    expect(mockMakeBucket).toHaveBeenCalledTimes(3);
    expect(mockMakeBucket).toHaveBeenCalledWith(BUCKETS.PROFILES);
    expect(mockMakeBucket).toHaveBeenCalledWith(BUCKETS.STORIES);
    expect(mockMakeBucket).toHaveBeenCalledWith(BUCKETS.REPORTS);

    expect(storageService.initialized).toBe(true);
  });

  it('skips makeBucket for buckets that already exist', async () => {
    // All buckets already exist
    mockBucketExists.mockResolvedValue(true);
    mockSetBucketPolicy.mockResolvedValue(undefined);

    await storageService.initialize();

    expect(mockBucketExists).toHaveBeenCalledTimes(3);
    expect(mockMakeBucket).not.toHaveBeenCalled();

    // Policy should still be set for existing buckets
    expect(mockSetBucketPolicy).toHaveBeenCalledTimes(3);

    expect(storageService.initialized).toBe(true);
  });

  it('creates only non-existing buckets when some exist and some do not', async () => {
    // First bucket exists, second and third do not
    mockBucketExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    mockMakeBucket.mockResolvedValue(undefined);
    mockSetBucketPolicy.mockResolvedValue(undefined);

    await storageService.initialize();

    expect(mockMakeBucket).toHaveBeenCalledTimes(2);
  });
});

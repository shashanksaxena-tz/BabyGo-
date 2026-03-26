/**
 * Unit tests for src/middleware/auth.js
 *
 * Uses jest.unstable_mockModule for ESM-compatible mocking.
 */

import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const JWT_SECRET = 'tinysteps-dev-secret-change-in-production';

// ---------------------------------------------------------------------------
// Setup mock for User model
// ---------------------------------------------------------------------------

let mockFindById = jest.fn();

jest.unstable_mockModule('../../../src/models/User.js', () => ({
  default: {
    findById: (...args) => mockFindById(...args),
  },
}));

// Import auth module AFTER setting up mocks (dynamic import required for ESM)
const { generateToken, generateRefreshToken, authMiddleware, optionalAuth } =
  await import('../../../src/middleware/auth.js');

// ---------------------------------------------------------------------------
// generateToken
// ---------------------------------------------------------------------------
describe('generateToken', () => {
  it('returns a valid JWT containing userId', () => {
    const userId = 'user123';
    const token = generateToken(userId);
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.userId).toBe(userId);
  });

  it('expires in approximately 7 days', () => {
    const token = generateToken('user123');
    const decoded = jwt.decode(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const sevenDaysSeconds = 7 * 24 * 60 * 60;
    expect(decoded.exp - nowSeconds).toBeGreaterThan(sevenDaysSeconds - 60);
    expect(decoded.exp - nowSeconds).toBeLessThanOrEqual(sevenDaysSeconds + 60);
  });
});

// ---------------------------------------------------------------------------
// generateRefreshToken
// ---------------------------------------------------------------------------
describe('generateRefreshToken', () => {
  it('returns a JWT with type=refresh', () => {
    const userId = 'user456';
    const token = generateRefreshToken(userId);
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.userId).toBe(userId);
    expect(decoded.type).toBe('refresh');
  });

  it('expires in approximately 30 days', () => {
    const token = generateRefreshToken('user456');
    const decoded = jwt.decode(token);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const thirtyDaysSeconds = 30 * 24 * 60 * 60;
    expect(decoded.exp - nowSeconds).toBeGreaterThan(thirtyDaysSeconds - 60);
    expect(decoded.exp - nowSeconds).toBeLessThanOrEqual(thirtyDaysSeconds + 60);
  });
});

// ---------------------------------------------------------------------------
// authMiddleware
// ---------------------------------------------------------------------------
describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    mockFindById.mockReset();
  });

  it('attaches user to req when token is valid', async () => {
    const fakeUser = { _id: 'u1', name: 'Alice', geminiApiKey: null };
    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const token = generateToken('u1');
    req.headers.authorization = `Bearer ${token}`;

    await authMiddleware(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falls back to guest user when no token is provided', async () => {
    await authMiddleware(req, res, next);

    expect(req.user).toMatchObject({
      _id: '000000000000000000000000',
      name: 'Guest User',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falls back to guest user when token is expired', async () => {
    const expiredToken = jwt.sign({ userId: 'u1' }, JWT_SECRET, { expiresIn: -1 });
    req.headers.authorization = `Bearer ${expiredToken}`;

    await authMiddleware(req, res, next);

    expect(req.user).toMatchObject({
      _id: '000000000000000000000000',
      name: 'Guest User',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('falls back to guest user when user is not found in database', async () => {
    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const token = generateToken('nonexistentUser');
    req.headers.authorization = `Bearer ${token}`;

    await authMiddleware(req, res, next);

    expect(req.user).toMatchObject({
      _id: '000000000000000000000000',
      name: 'Guest User',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('attaches GEMINI_API_KEY from env when user has no geminiApiKey', async () => {
    const fakeUser = { _id: 'u1', name: 'Alice', geminiApiKey: null };
    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });
    process.env.GEMINI_API_KEY = 'env-gemini-key';

    const token = generateToken('u1');
    req.headers.authorization = `Bearer ${token}`;

    await authMiddleware(req, res, next);

    expect(req.user.geminiApiKey).toBe('env-gemini-key');

    delete process.env.GEMINI_API_KEY;
  });
});

// ---------------------------------------------------------------------------
// optionalAuth
// ---------------------------------------------------------------------------
describe('optionalAuth', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    mockFindById.mockReset();
  });

  it('attaches user when a valid token is provided', async () => {
    const fakeUser = { _id: 'u2', name: 'Bob' };
    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const token = generateToken('u2');
    req.headers.authorization = `Bearer ${token}`;

    await optionalAuth(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not attach user and still calls next when no token is provided', async () => {
    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid token and still calls next', async () => {
    req.headers.authorization = 'Bearer this.is.not.a.valid.token';

    await optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

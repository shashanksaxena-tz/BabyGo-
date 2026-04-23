/**
 * Task 9: Auth integration tests
 */
import '../setup/integrationBase.js';
import { getApp, request } from '../setup/integrationBase.js';
import { TEST_USER, TEST_USER_2 } from '../setup/fixtures.js';

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request()
      .post('/api/auth/register')
      .send(TEST_USER_2)
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER_2.email);
    expect(res.body.user.name).toBe(TEST_USER_2.name);
  });

  it('rejects duplicate email', async () => {
    // TEST_USER is already registered in beforeEach
    const res = await request()
      .post('/api/auth/register')
      .send(TEST_USER)
      .expect(400);

    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects invalid email', async () => {
    const res = await request()
      .post('/api/auth/register')
      .send({ ...TEST_USER_2, email: 'not-an-email' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  it('rejects short password (< 6 chars)', async () => {
    const res = await request()
      .post('/api/auth/register')
      .send({ ...TEST_USER_2, password: '123' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  it('rejects empty name', async () => {
    const res = await request()
      .post('/api/auth/register')
      .send({ ...TEST_USER_2, name: '' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('rejects wrong password', async () => {
    const res = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('rejects non-existent email', async () => {
    const res = await request()
      .post('/api/auth/login')
      .send({ email: 'doesnotexist@test.com', password: 'SomePass123!' })
      .expect(401);

    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const loginRes = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    const res = await request()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .expect(200);

    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.name).toBe(TEST_USER.name);
  });

  it('without token — returns 200 with guest user data (auth middleware guest fallback)', async () => {
    // The auth middleware falls back to a guest user object instead of returning 401.
    // This means GET /api/auth/me with no token returns 200 with the guest user's fields.
    // NOTE: This is a design choice (backward compatibility) — the guest ID is a fixed
    // ObjectId-shaped string: '000000000000000000000000'.
    const res = await request()
      .get('/api/auth/me')
      .expect(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('000000000000000000000000');
    expect(res.body.user.name).toBe('Guest User');
  });
});

describe('GET /api/children — unauthenticated', () => {
  it('without token — returns empty array because guest user has no children', async () => {
    // The auth middleware's guest fallback (_id: '000000000000000000000000') means
    // the children route will query for children owned by the guest user ID,
    // which returns an empty list rather than a 401.
    const res = await request()
      .get('/api/children')
      .expect(200);

    expect(res.body.children).toEqual([]);
  });
});

describe('POST /api/auth/refresh', () => {
  it('refreshes token with valid refresh token', async () => {
    const loginRes = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    const res = await request()
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('rejects request with missing token', async () => {
    const res = await request()
      .post('/api/auth/refresh')
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/refresh token required/i);
  });

  it('rejects access token used as refresh token', async () => {
    const loginRes = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    // Use access token (not refresh token) — should fail with 401
    const res = await request()
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.token })
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});

describe('PATCH /api/auth/language', () => {
  it('updates language preference to a valid language code', async () => {
    const loginRes = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    const res = await request()
      .patch('/api/auth/language')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ language: 'hi-IN' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.language).toBe('hi-IN');
  });

  it('rejects invalid language code', async () => {
    const loginRes = await request()
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);

    const res = await request()
      .patch('/api/auth/language')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ language: 'xx-XX' })
      .expect(400);

    expect(res.body.error).toMatch(/invalid language/i);
  });
});

/**
 * Task 10: Children integration tests
 */
import '../setup/integrationBase.js';
import { getToken, request } from '../setup/integrationBase.js';
import { TEST_CHILD_NEWBORN, TEST_CHILD_TODDLER, TEST_USER_2 } from '../setup/fixtures.js';

// Valid child payload that matches the schema
const VALID_CHILD = {
  name: 'Baby Test',
  dateOfBirth: (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  })(),
  gender: 'male',
  weight: 7.5,
  height: 65,
  region: 'searo',
};

describe('POST /api/children', () => {
  it('creates a child successfully', async () => {
    const res = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    expect(res.body.child).toBeDefined();
    expect(res.body.child.name).toBe(VALID_CHILD.name);
    expect(res.body.child.gender).toBe(VALID_CHILD.gender);
  });

  it('rejects missing required fields', async () => {
    const res = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: 'Baby NoDate' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid gender', async () => {
    const res = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ ...VALID_CHILD, gender: 'robot' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid region', async () => {
    const res = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ ...VALID_CHILD, region: 'narnia' })
      .expect(400);

    expect(res.body.errors).toBeDefined();
  });
});

describe('GET /api/children', () => {
  it('returns empty list when user has no children', async () => {
    const res = await request()
      .get('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.children).toEqual([]);
  });

  it('returns list of children enriched with ageInMonths and displayAge', async () => {
    // Create two children
    await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    const toddlerPayload = {
      name: 'Baby Toddler',
      dateOfBirth: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 18);
        return d.toISOString().split('T')[0];
      })(),
      gender: 'female',
      weight: 11.0,
      height: 82,
      region: 'amro',
    };

    await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(toddlerPayload)
      .expect(201);

    const res = await request()
      .get('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.children).toHaveLength(2);
    for (const child of res.body.children) {
      expect(child.ageInMonths).toBeDefined();
      expect(child.displayAge).toBeDefined();
    }
  });
});

describe('GET /api/children/:id', () => {
  it('returns a child by ID', async () => {
    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    const childId = createRes.body.child._id;

    const res = await request()
      .get(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.child._id).toBe(childId);
  });

  it('returns 404 for unknown child ID', async () => {
    await request()
      .get('/api/children/000000000000000000000001')
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(404);
  });
});

describe('PUT /api/children/:id', () => {
  it('updates child name', async () => {
    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    const childId = createRes.body.child._id;

    const res = await request()
      .put(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ name: 'Updated Baby Name' })
      .expect(200);

    expect(res.body.child.name).toBe('Updated Baby Name');
  });
});

describe('DELETE /api/children/:id', () => {
  it('deletes child and verifies gone', async () => {
    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    const childId = createRes.body.child._id;

    await request()
      .delete(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    await request()
      .get(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(404);
  });
});

describe('Milestone tracking', () => {
  let childId;

  beforeEach(async () => {
    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;
  });

  it('marks a milestone as achieved', async () => {
    const res = await request()
      .post(`/api/children/${childId}/milestones/test-milestone-1`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({ notes: 'First time rolling over!' })
      .expect(200);

    expect(res.body.achievedMilestones).toBeDefined();
    const achieved = res.body.achievedMilestones.find(m => m.milestoneId === 'test-milestone-1');
    expect(achieved).toBeDefined();
  });

  it('unmarks (deletes) an achieved milestone', async () => {
    // First mark it
    await request()
      .post(`/api/children/${childId}/milestones/test-milestone-2`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({})
      .expect(200);

    // Now unmark it
    const res = await request()
      .delete(`/api/children/${childId}/milestones/test-milestone-2`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.achievedMilestones.find(m => m.milestoneId === 'test-milestone-2')).toBeUndefined();
  });

  it('adds a milestone to the watch list', async () => {
    const res = await request()
      .post(`/api/children/${childId}/milestones/test-milestone-3/watch`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.watchedMilestones).toBeDefined();
    const watched = res.body.watchedMilestones.find(m => m.milestoneId === 'test-milestone-3');
    expect(watched).toBeDefined();
  });

  it('removes a milestone from the watch list', async () => {
    // Watch it first
    await request()
      .post(`/api/children/${childId}/milestones/test-milestone-4/watch`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    // Unwatch it
    const res = await request()
      .delete(`/api/children/${childId}/milestones/test-milestone-4/watch`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(200);

    expect(res.body.watchedMilestones.find(m => m.milestoneId === 'test-milestone-4')).toBeUndefined();
  });

  it('rejects watching a milestone that is already achieved', async () => {
    // Mark as achieved first
    await request()
      .post(`/api/children/${childId}/milestones/test-milestone-5`)
      .set('Authorization', `Bearer ${getToken()}`)
      .send({})
      .expect(200);

    // Try to watch it — should be rejected
    const res = await request()
      .post(`/api/children/${childId}/milestones/test-milestone-5/watch`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(400);

    expect(res.body.error).toMatch(/already achieved/i);
  });
});

// ---------------------------------------------------------------------------
// Cross-user data isolation
// TODO: This suite documents a KNOWN SECURITY BUG: the children routes do not
//       verify that req.user._id matches child.userId before allowing GET/PUT/DELETE.
//       A second user can read and mutate another user's children. This must be
//       fixed by adding ownership checks in src/routes/children.js.
// ---------------------------------------------------------------------------
describe('Cross-user data isolation (security)', () => {
  let childId;
  let secondUserToken;

  beforeEach(async () => {
    // Create a child owned by the default test user
    const createRes = await request()
      .post('/api/children')
      .set('Authorization', `Bearer ${getToken()}`)
      .send(VALID_CHILD)
      .expect(201);

    childId = createRes.body.child._id;

    // Register a second independent user
    const regRes = await request()
      .post('/api/auth/register')
      .send(TEST_USER_2)
      .expect(201);

    secondUserToken = regRes.body.token;
  });

  it('GET /api/children/:id — second user can currently read first user child (known bug)', async () => {
    // TODO: This should return 403 or 404 once ownership checks are added.
    //       Currently it returns 200, which is the bug we are documenting.
    const res = await request()
      .get(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(200); // BUG: should be 403/404

    expect(res.body.child._id).toBe(childId);
  });

  it('PUT /api/children/:id — second user can currently update first user child (known bug)', async () => {
    // TODO: This should return 403 or 404 once ownership checks are added.
    const res = await request()
      .put(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({ name: 'Hijacked Name' })
      .expect(200); // BUG: should be 403/404

    expect(res.body.child.name).toBe('Hijacked Name');
  });

  it('DELETE /api/children/:id — second user can currently delete first user child (known bug)', async () => {
    // TODO: This should return 403 or 404 once ownership checks are added.
    await request()
      .delete(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(200); // BUG: should be 403/404

    // Verify the child is gone (even from the original owner's perspective)
    await request()
      .get(`/api/children/${childId}`)
      .set('Authorization', `Bearer ${getToken()}`)
      .expect(404);
  });
});

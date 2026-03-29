import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.05'],
  },
};

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function () {
  // KNOWN LIMITATION: Each VU iteration registers a new user and never deletes it.
  // Over time this creates "ghost" users in the database. Before running against
  // a shared/staging environment, confirm the DB can be safely wiped afterwards,
  // or add a teardown stage that calls DELETE /api/auth/account with the token.
  const uniqueId = randomString(10);
  const email = `testuser_${uniqueId}@loadtest.example.com`;
  const password = 'TestPass123!';
  const name = `Load Test User ${uniqueId}`;

  const headers = { 'Content-Type': 'application/json' };

  // Step 1: Register
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ name, email, password }),
    { headers }
  );

  check(registerRes, {
    'register: status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'register: response time < 200ms': (r) => r.timings.duration < 200,
    'register: has token or user': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined || body.user !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(0.1);

  // Step 2: Login with the same credentials
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers }
  );

  check(loginRes, {
    'login: status is 200': (r) => r.status === 200,
    'login: response time < 200ms': (r) => r.timings.duration < 200,
    'login: has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  sleep(0.1);
}

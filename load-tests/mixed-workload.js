import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const options = {
  vus: 200,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'],
  },
};

// Sample ages (in months) for milestone lookups
const MILESTONE_AGES = [3, 6, 9, 12, 18, 24, 36];

function pickAge() {
  return MILESTONE_AGES[Math.floor(Math.random() * MILESTONE_AGES.length)];
}

export default function () {
  // Distribute traffic according to specified weights:
  // 40% config reads, 30% milestone reads, 20% health checks, 10% API docs
  const roll = Math.random();

  if (roll < 0.40) {
    // Config read (40%)
    const res = http.get(`${BASE_URL}/api/config`);
    check(res, {
      'config: status 200': (r) => r.status === 200,
      'config: p95 < 300ms': (r) => r.timings.duration < 300,
    });
  } else if (roll < 0.70) {
    // Milestone read (30%)
    const age = pickAge();
    const res = http.get(`${BASE_URL}/api/analysis/milestones/${age}`);
    check(res, {
      'milestones: status 200': (r) => r.status === 200,
      'milestones: p95 < 300ms': (r) => r.timings.duration < 300,
    });
  } else if (roll < 0.90) {
    // Health check (20%)
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: p95 < 300ms': (r) => r.timings.duration < 300,
    });
  } else {
    // API docs (10%)
    const res = http.get(`${BASE_URL}/api`);
    check(res, {
      'api-docs: status 200': (r) => r.status === 200,
      'api-docs: p95 < 300ms': (r) => r.timings.duration < 300,
    });
  }

  sleep(0.1);
}

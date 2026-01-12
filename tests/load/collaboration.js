import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '1m', target: 10 },  // Ramp up to 10 users
        { duration: '28m', target: 10 }, // Stay at 10 users
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        errors: ['rate<0.01'],             // Error rate must be less than 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export default function () {
    // Simulate user browsing to dashboard
    const res = http.get(`${BASE_URL}/workspace`);

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'verify page content': (r) => r.body && r.body.includes('SanadFlow'),
    });

    if (!success) {
        errorRate.add(1);
    }

    sleep(Math.random() * 3 + 1); // Think time 1-4s

    // Simulate API call (e.g. fetching documents)
    // Assuming a vague API structure since we don't have explicit docs.
    // Using health check as a proxy for backend availability if CRUD endpoints need auth.
    const healthRes = http.get(`${BASE_URL}/api/health`);
    check(healthRes, {
        'health check passed': (r) => r.status === 200,
    });

    sleep(1);
}

/**
 * k6 Load Testing Script
 * Phase 4: Load Testing & Optimization
 * 
 * Agent: qa-engineer
 * Reference: TDD v2.0 Section 7.1
 * 
 * Thresholds:
 * - p95 Response < 2s
 * - Error Rate < 1%
 * - 10 concurrent users
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const hadithCreated = new Counter('hadiths_created');
const searchLatency = new Trend('search_latency');
const graphqlErrors = new Counter('graphql_errors');

// Test configuration
export const options = {
    stages: [
        { duration: '1m', target: 5 },   // Ramp up to 5 users
        { duration: '5m', target: 10 },  // Hold at 10 concurrent users
        { duration: '2m', target: 10 },  // Continue steady state
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // p95 < 2 seconds
        http_req_failed: ['rate<0.01'],     // < 1% errors
        graphql_errors: ['count<10'],       // Max 10 GraphQL errors
        search_latency: ['p(95)<500'],      // Search < 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Sample Arabic text for hadith creation
const SAMPLE_HADITHS = [
    'عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    'عَنْ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
    'عَنْ أَنَسِ بْنِ مَالِكٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
];

// GraphQL mutations and queries
const SIGN_IN_MUTATION = `
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: { email: $email, password: $password }) {
      token
      user { id fullName }
    }
  }
`;

const CREATE_HADITH_MUTATION = `
  mutation CreateHadith($input: CreateHadithInput!) {
    createHadith(input: $input) {
      id
      arabicText
      grading
    }
  }
`;

const SEARCH_HADITHS_QUERY = `
  query SearchHadiths($input: SearchHadithsInput!) {
    searchHadiths(input: $input) {
      items {
        id
        arabicText
        grading
      }
      total
    }
  }
`;

const HEALTH_CHECK_QUERY = `
  query Health {
    health {
      status
      timestamp
    }
  }
`;

export function setup() {
    // Verify system is up
    const healthRes = graphqlRequest(HEALTH_CHECK_QUERY);
    check(healthRes, {
        'health check passed': (r) => r.status === 200,
    });

    return {
        token: null,
        workspaceId: 'test-workspace-id',
    };
}

export default function (data) {
    // Test 1: Health check
    group('Health Check', () => {
        const res = graphqlRequest(HEALTH_CHECK_QUERY);
        check(res, {
            'health is 200': (r) => r.status === 200,
            'health response valid': (r) => {
                const body = JSON.parse(r.body);
                return body.data?.health?.status === 'healthy';
            },
        });
    });

    sleep(1);

    // Test 2: Authentication
    group('Authentication', () => {
        const res = graphqlRequest(SIGN_IN_MUTATION, {
            email: `loadtest-${__VU}@example.com`,
            password: 'password123',
        });

        const success = check(res, {
            'login successful': (r) => r.status === 200,
        });

        if (!success) {
            graphqlErrors.add(1);
        }
    });

    sleep(1);

    // Test 3: Create Hadith (Arabic text)
    group('Create Hadith', () => {
        const randomHadith = SAMPLE_HADITHS[Math.floor(Math.random() * SAMPLE_HADITHS.length)];

        const res = graphqlRequest(CREATE_HADITH_MUTATION, {
            input: {
                workspaceId: data.workspaceId,
                arabicText: randomHadith,
                grading: 'SAHIH',
                topicTags: ['الإيمان', 'الأخلاق'],
            },
        });

        const success = check(res, {
            'hadith created': (r) => r.status === 200,
        });

        if (success) {
            hadithCreated.add(1);
        } else {
            graphqlErrors.add(1);
        }
    });

    sleep(2);

    // Test 4: Search Arabic text
    group('Search Hadiths', () => {
        const startTime = Date.now();

        const res = graphqlRequest(SEARCH_HADITHS_QUERY, {
            input: {
                workspaceId: data.workspaceId,
                query: 'الإيمان',
                limit: 20,
            },
        });

        const latency = Date.now() - startTime;
        searchLatency.add(latency);

        check(res, {
            'search successful': (r) => r.status === 200,
            'search < 500ms': () => latency < 500,
        });
    });

    sleep(3); // Think time
}

function graphqlRequest(query, variables = {}) {
    return http.post(
        `${BASE_URL}/api/graphql`,
        JSON.stringify({ query, variables }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}

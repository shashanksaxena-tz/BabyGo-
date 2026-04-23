import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3001/api';

export const handlers = [
    // ─── Auth ──────────────────────────────────────────────────────────────────
    http.post(`${BASE_URL}/auth/login`, () => {
        return HttpResponse.json({
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
            },
        });
    }),

    http.post(`${BASE_URL}/auth/register`, () => {
        return HttpResponse.json(
            {
                message: 'User registered successfully',
                token: 'mock-jwt-token',
                refreshToken: 'mock-refresh-token',
                user: {
                    id: 'user-1',
                    name: 'Test User',
                    email: 'test@example.com',
                },
            },
            { status: 201 }
        );
    }),

    http.get(`${BASE_URL}/auth/me`, () => {
        return HttpResponse.json({
            user: {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                preferences: { language: 'en' },
            },
        });
    }),

    // ─── Config ────────────────────────────────────────────────────────────────
    http.get(`${BASE_URL}/config`, () => {
        return HttpResponse.json({
            domains: {
                motor: {
                    key: 'motor',
                    label: 'Motor Skills',
                    emoji: '🏃',
                    color: '#3b82f6',
                    assessmentKey: 'motorAssessment',
                    description: 'Gross and fine motor development',
                },
                cognitive: {
                    key: 'cognitive',
                    label: 'Cognitive',
                    emoji: '🧠',
                    color: '#8b5cf6',
                    assessmentKey: 'cognitiveAssessment',
                    description: 'Problem solving, memory, and learning',
                },
                language: {
                    key: 'language',
                    label: 'Language',
                    emoji: '💬',
                    color: '#ec4899',
                    assessmentKey: 'languageAssessment',
                    description: 'Speech, comprehension, and communication',
                },
                social: {
                    key: 'social',
                    label: 'Social & Emotional',
                    emoji: '❤️',
                    color: '#f59e0b',
                    assessmentKey: 'socialAssessment',
                    description: 'Relationships, emotions, and self-regulation',
                },
            },
            statuses: {
                ahead: {
                    label: 'Ahead',
                    color: '#059669',
                    bgColor: '#d1fae5',
                    borderColor: '#a7f3d0',
                    severity: 0,
                },
                on_track: {
                    label: 'On Track',
                    color: '#10b981',
                    bgColor: '#d1fae5',
                    borderColor: '#a7f3d0',
                    severity: 1,
                },
                on_track_with_monitoring: {
                    label: 'On Track (Monitoring)',
                    color: '#0ea5e9',
                    bgColor: '#e0f2fe',
                    borderColor: '#bae6fd',
                    severity: 2,
                },
                emerging: {
                    label: 'Emerging',
                    color: '#f59e0b',
                    bgColor: '#fef3c7',
                    borderColor: '#fde68a',
                    severity: 3,
                },
                needs_support: {
                    label: 'Needs Support',
                    color: '#ef4444',
                    bgColor: '#fee2e2',
                    borderColor: '#fecaca',
                    severity: 4,
                },
            },
            scoreThresholds: {
                high: { min: 75, color: '#10b981', label: 'Strong' },
                medium: { min: 50, color: '#f59e0b', label: 'Developing' },
                low: { min: 0, color: '#ef4444', label: 'Needs Attention' },
            },
            percentileThresholds: [
                { max: 3, label: 'Very Low', advice: 'Consult a pediatrician', status: 'needs_support' },
                { max: 15, label: 'Low', advice: 'Monitor closely', status: 'monitor' },
                { max: 85, label: 'Normal', advice: 'Healthy range', status: 'on_track' },
                { max: 97, label: 'High', advice: 'Above average', status: 'on_track' },
                { max: 100, label: 'Very High', advice: 'Consult a pediatrician', status: 'monitor' },
            ],
            timeFilters: [
                { id: '1W', label: '1 Week', days: 7 },
                { id: '1M', label: '1 Month', days: 30 },
                { id: '3M', label: '3 Months', days: 90 },
                { id: '6M', label: '6 Months', days: 180 },
                { id: 'ALL', label: 'All Time', days: null },
            ],
            supportedLanguages: [
                { code: 'en-IN', label: 'English' },
                { code: 'hi-IN', label: 'Hindi' },
                { code: 'bn-IN', label: 'Bengali' },
                { code: 'gu-IN', label: 'Gujarati' },
                { code: 'kn-IN', label: 'Kannada' },
                { code: 'ml-IN', label: 'Malayalam' },
                { code: 'mr-IN', label: 'Marathi' },
                { code: 'od-IN', label: 'Odia' },
                { code: 'pa-IN', label: 'Punjabi' },
                { code: 'ta-IN', label: 'Tamil' },
                { code: 'te-IN', label: 'Telugu' },
            ],
            recipeCategories: [
                { id: 'puree', label: 'Purees', emoji: '🥣' },
                { id: 'finger_food', label: 'Finger Foods', emoji: '🥕' },
            ],
            regionCuisineMap: {
                north_india: { name: 'North Indian', description: 'Rich, hearty dishes' },
                south_india: { name: 'South Indian', description: 'Rice-based dishes' },
            },
        });
    }),

    // ─── Children ──────────────────────────────────────────────────────────────
    http.get(`${BASE_URL}/children`, () => {
        return HttpResponse.json([
            {
                _id: 'child-1',
                name: 'Leo',
                dateOfBirth: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
                gender: 'male',
                ageInMonths: 6,
                ageInDays: 180,
                displayAge: '6 months',
            },
        ]);
    }),

    http.get(`${BASE_URL}/children/:childId`, ({ params }) => {
        return HttpResponse.json({
            _id: params.childId,
            name: 'Leo',
            dateOfBirth: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            gender: 'male',
            ageInMonths: 6,
            ageInDays: 180,
            displayAge: '6 months',
        });
    }),

    // ─── Milestones ────────────────────────────────────────────────────────────
    http.get(`${BASE_URL}/analysis/milestones/:age`, ({ params }) => {
        return HttpResponse.json({
            ageMonths: Number(params.age),
            milestones: [
                {
                    _id: 'milestone-1',
                    title: 'Rolls over',
                    domain: 'motor',
                    ageRangeStart: 4,
                    ageRangeEnd: 6,
                    description: 'Baby can roll from tummy to back',
                    status: 'achieved',
                },
                {
                    _id: 'milestone-2',
                    title: 'Babbles',
                    domain: 'language',
                    ageRangeStart: 4,
                    ageRangeEnd: 8,
                    description: 'Baby makes babbling sounds',
                    status: 'on_track',
                },
            ],
        });
    }),

    // ─── Child-specific endpoints ──────────────────────────────────────────────
    http.get(`${BASE_URL}/timeline/:childId`, () => {
        return HttpResponse.json({ entries: [] });
    }),

    http.get(`${BASE_URL}/stories/:childId`, () => {
        return HttpResponse.json({ stories: [] });
    }),

    http.get(`${BASE_URL}/analysis/:childId`, () => {
        return HttpResponse.json({ analyses: [] });
    }),
];

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
                    assessmentKey: 'motorScore',
                    description: 'Physical movement and coordination',
                },
                cognitive: {
                    key: 'cognitive',
                    label: 'Cognitive',
                    emoji: '🧠',
                    color: '#8b5cf6',
                    assessmentKey: 'cognitiveScore',
                    description: 'Thinking, learning, and problem solving',
                },
                language: {
                    key: 'language',
                    label: 'Language',
                    emoji: '💬',
                    color: '#ec4899',
                    assessmentKey: 'languageScore',
                    description: 'Communication and speech development',
                },
                social: {
                    key: 'social',
                    label: 'Social & Emotional',
                    emoji: '❤️',
                    color: '#10b981',
                    assessmentKey: 'socialScore',
                    description: 'Emotional regulation and social interactions',
                },
            },
            statuses: {
                on_track: {
                    label: 'On Track',
                    color: '#10b981',
                    bgColor: '#d1fae5',
                    borderColor: '#6ee7b7',
                    severity: 0,
                },
                monitor: {
                    label: 'Monitor',
                    color: '#f59e0b',
                    bgColor: '#fef3c7',
                    borderColor: '#fcd34d',
                    severity: 1,
                },
                needs_support: {
                    label: 'Needs Support',
                    color: '#ef4444',
                    bgColor: '#fee2e2',
                    borderColor: '#fca5a5',
                    severity: 2,
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
                { id: '1m', label: '1 Month', days: 30 },
                { id: '3m', label: '3 Months', days: 90 },
                { id: '6m', label: '6 Months', days: 180 },
                { id: 'all', label: 'All Time', days: null },
            ],
            supportedLanguages: [
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'Hindi' },
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
];

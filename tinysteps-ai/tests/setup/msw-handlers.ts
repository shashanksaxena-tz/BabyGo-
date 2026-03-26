import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3001/api';

export const handlers = [
  // Auth - login
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        _id: 'user-123',
        name: 'Test Parent',
        email: 'test@example.com',
      },
    });
  }),

  // Auth - register
  http.post(`${API_BASE}/auth/register`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        _id: 'user-123',
        name: 'Test Parent',
        email: 'test@example.com',
      },
    });
  }),

  // Auth - me
  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      _id: 'user-123',
      name: 'Test Parent',
      email: 'test@example.com',
    });
  }),

  // Config - domains and app config
  http.get(`${API_BASE}/config`, () => {
    return HttpResponse.json({
      domains: [
        { key: 'motor', label: 'Motor Skills', color: '#3b82f6' },
        { key: 'cognitive', label: 'Cognitive', color: '#8b5cf6' },
        { key: 'language', label: 'Language', color: '#ec4899' },
        { key: 'social', label: 'Social', color: '#10b981' },
      ],
      statusLabels: {
        'on-track': 'On Track',
        'needs-attention': 'Needs Attention',
        'advanced': 'Advanced',
      },
      scoreThresholds: {
        advanced: 80,
        onTrack: 50,
      },
      timeFilters: ['1m', '3m', '6m', '1y'],
      languages: ['en', 'es', 'fr', 'de', 'zh'],
      recipeCategories: ['puree', 'finger-food', 'meal'],
      regionalCuisine: {},
    });
  }),

  // Children - list one child
  http.get(`${API_BASE}/children`, () => {
    return HttpResponse.json([
      {
        _id: 'child-456',
        name: 'Baby Leo',
        dateOfBirth: '2023-06-15',
        gender: 'male',
        ageInMonths: 18,
        ageInDays: 548,
        displayAge: '1 year, 6 months',
      },
    ]);
  }),

  // Children - single child
  http.get(`${API_BASE}/children/:childId`, ({ params }) => {
    return HttpResponse.json({
      _id: params.childId,
      name: 'Baby Leo',
      dateOfBirth: '2023-06-15',
      gender: 'male',
      ageInMonths: 18,
      ageInDays: 548,
      displayAge: '1 year, 6 months',
    });
  }),

  // Milestones
  http.get(`${API_BASE}/analysis/milestones/:age`, ({ params }) => {
    return HttpResponse.json({
      age: Number(params.age),
      milestones: [
        {
          id: 'milestone-1',
          domain: 'motor',
          title: 'Walks independently',
          description: 'Child can walk without support',
          ageMonths: 12,
          status: 'achieved',
        },
        {
          id: 'milestone-2',
          domain: 'language',
          title: 'Says 2-3 words',
          description: 'Child uses 2-3 meaningful words',
          ageMonths: 12,
          status: 'in-progress',
        },
      ],
    });
  }),
];

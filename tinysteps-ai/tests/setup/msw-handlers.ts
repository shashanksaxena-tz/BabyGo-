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
      user: {
        id: 'user-123',
        name: 'Test Parent',
        email: 'test@example.com',
        preferences: { language: 'en-IN' },
      },
    });
  }),

  // Config - domains and app config (matches real backend shape from appConfig.js)
  http.get(`${API_BASE}/config`, () => {
    return HttpResponse.json({
      domains: {
        motor: { key: 'motor', label: 'Motor Skills', emoji: '🏃', color: '#3b82f6', assessmentKey: 'motorAssessment', description: 'Gross and fine motor development' },
        cognitive: { key: 'cognitive', label: 'Cognitive', emoji: '🧠', color: '#8b5cf6', assessmentKey: 'cognitiveAssessment', description: 'Problem solving, memory, and learning' },
        language: { key: 'language', label: 'Language', emoji: '💬', color: '#ec4899', assessmentKey: 'languageAssessment', description: 'Speech, comprehension, and communication' },
        social: { key: 'social', label: 'Social & Emotional', emoji: '❤️', color: '#f59e0b', assessmentKey: 'socialAssessment', description: 'Relationships, emotions, and self-regulation' },
      },
      statuses: {
        on_track: { label: 'On Track', color: '#10b981', bgColor: '#d1fae5', borderColor: '#a7f3d0', severity: 1 },
        emerging: { label: 'Emerging', color: '#f59e0b', bgColor: '#fef3c7', borderColor: '#fde68a', severity: 3 },
        needs_support: { label: 'Needs Support', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#fecaca', severity: 4 },
      },
      scoreThresholds: {
        excellent: { min: 70, color: '#10b981', label: 'Excellent' },
        moderate: { min: 50, color: '#f59e0b', label: 'Moderate' },
        concern: { min: 0, color: '#ef4444', label: 'Needs Attention' },
      },
      percentileThresholds: [
        { max: 3, label: 'Below typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
        { max: 85, label: 'Healthy range', advice: 'Growing well, keep it up!', status: 'healthy' },
        { max: 100, label: 'Above typical range', advice: 'Consider consulting your pediatrician', status: 'concern' },
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
      ],
      recipeCategories: [
        { id: 'breakfast', label: 'Breakfast', emoji: '🍜' },
        { id: 'puree', label: 'Purees', emoji: '🥑' },
        { id: 'fingerFood', label: 'Finger Foods', emoji: '🫐' },
      ],
      regionCuisineMap: {
        IN: { name: 'Indian', description: 'dal, khichdi, roti, rice dishes, mild spices' },
        US: { name: 'American', description: 'varied, include familiar comfort foods' },
      },
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

  // Growth percentiles
  http.post(`${API_BASE}/analysis/growth-percentiles`, () => {
    return HttpResponse.json({
      weightPercentile: 55,
      heightPercentile: 60,
      headCircumferencePercentile: null,
    });
  }),

  // Timeline
  http.get(`${API_BASE}/timeline/:childId`, () => {
    return HttpResponse.json([]);
  }),

  // Analyses list
  http.get(`${API_BASE}/analysis/:childId`, () => {
    return HttpResponse.json([]);
  }),
];

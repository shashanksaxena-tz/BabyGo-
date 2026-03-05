import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// ─── Typed API helpers ──────────────────────────────────────────────────────
// These wrap the raw axios instance for frequently-used endpoints.
// Pages can use either `api.get(...)` directly or these named helpers.

/** Fetch app-wide configuration (domains, statuses, thresholds, etc.) */
export const getAppConfig = () =>
    api.get('/config').then(res => res.data);

/** Fetch analyses for a child */
export const getAnalyses = (childId: string) =>
    api.get(`/analysis/${childId}`).then(res => res.data);

/** Fetch trend data for a child */
export const getAnalysisTrends = (childId: string, period?: string) =>
    api.get(`/analysis/${childId}/trends`, { params: { period } }).then(res => res.data);

/** Fetch WHO milestones for a given age */
export const getMilestones = (ageMonths: number, params?: Record<string, string>) =>
    api.get(`/analysis/milestones/${ageMonths}`, { params }).then(res => res.data);

/** Fetch a child's achieved/watched milestones */
export const getChildMilestones = (childId: string) =>
    api.get(`/children/${childId}/milestones`).then(res => res.data);

/** Mark a milestone as achieved */
export const markMilestoneAchieved = (childId: string, milestoneId: string, data: { achievedDate: string; notes?: string; confirmedBy: string }) =>
    api.post(`/children/${childId}/milestones/${milestoneId}`, data).then(res => res.data);

/** Unmark a milestone */
export const unmarkMilestone = (childId: string, milestoneId: string) =>
    api.delete(`/children/${childId}/milestones/${milestoneId}`).then(res => res.data);

/** Fetch WHO growth curves */
export const getGrowthCurves = (gender: string, metric: string) =>
    api.get('/analysis/growth-curves', { params: { gender, metric } }).then(res => res.data);

/** Calculate growth percentiles */
export const getGrowthPercentiles = (data: { weight?: number; height?: number; headCircumference?: number; ageMonths: number; gender: string }) =>
    api.post('/analysis/growth-percentiles', data).then(res => res.data);

/** Fetch measurements for a child */
export const getMeasurements = (childId: string) =>
    api.get(`/timeline/measurements/${childId}`).then(res => res.data);

/** Add a new measurement */
export const addMeasurement = (data: { childId: string; weight?: number; height?: number; headCircumference?: number; date: string }) =>
    api.post('/timeline/measurement', data).then(res => res.data);

/** Fetch resources for domain improvement */
export const getResources = (childId: string, params?: { domain?: string; type?: string }) =>
    api.get(`/resources/${childId}`, { params }).then(res => res.data);

/** Regenerate resources for a child */
export const regenerateResources = (childId: string) =>
    api.post(`/resources/${childId}/regenerate`).then(res => res.data);

/**
 * API Service for TinySteps AI Web App
 * Connects to the backend service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('tinysteps_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('tinysteps_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('tinysteps_token');
  }

  // Auth
  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateApiKey(apiKey: string) {
    return this.request('/auth/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });
  }

  // Children
  async getChildren() {
    return this.request('/children');
  }

  async createChild(childData: any) {
    return this.request('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async getChild(childId: string) {
    return this.request(`/children/${childId}`);
  }

  async updateChild(childId: string, data: any) {
    return this.request(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChild(childId: string) {
    return this.request(`/children/${childId}`, {
      method: 'DELETE',
    });
  }

  // Analysis
  async createAnalysis(childId: string, mediaFiles: File[]) {
    const formData = new FormData();
    formData.append('childId', childId);

    for (const file of mediaFiles) {
      formData.append('media', file);
    }

    const url = `${API_BASE_URL}/analysis`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Analysis failed' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error during analysis' };
    }
  }

  async getAnalyses(childId: string) {
    return this.request(`/analysis/${childId}`);
  }

  async getAnalysis(childId: string, analysisId: string) {
    return this.request(`/analysis/${childId}/${analysisId}`);
  }

  async getMilestones(ageMonths: number) {
    return this.request(`/analysis/milestones/${ageMonths}`);
  }

  async getGrowthPercentiles(data: {
    weight: number;
    height: number;
    headCircumference?: number;
    ageMonths: number;
    gender: string;
  }) {
    return this.request('/analysis/growth-percentiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Stories
  async getStoryThemes() {
    return this.request('/stories/themes');
  }

  async getStories(childId: string) {
    return this.request(`/stories/${childId}`);
  }

  async generateStory(childId: string, themeId: string) {
    return this.request('/stories', {
      method: 'POST',
      body: JSON.stringify({ childId, themeId }),
    });
  }

  async getStory(childId: string, storyId: string) {
    return this.request(`/stories/${childId}/${storyId}`);
  }

  async toggleStoryFavorite(childId: string, storyId: string) {
    return this.request(`/stories/${childId}/${storyId}/favorite`, {
      method: 'PATCH',
    });
  }

  async deleteStory(childId: string, storyId: string) {
    return this.request(`/stories/${childId}/${storyId}`, {
      method: 'DELETE',
    });
  }

  // Timeline
  async getTimeline(childId: string) {
    return this.request(`/timeline/${childId}`);
  }

  async addTimelineEntry(data: any) {
    return this.request('/timeline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addMeasurement(data: any) {
    return this.request('/timeline/measurement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeasurements(childId: string) {
    return this.request(`/timeline/measurements/${childId}`);
  }

  // Recommendations
  async getProductRecommendations(childId: string, category: string = 'toys') {
    return this.request(`/recommendations/products/${childId}?category=${category}`);
  }

  async getActivities(childId: string, domain?: string) {
    const params = domain ? `?domain=${domain}` : '';
    return this.request(`/recommendations/activities/${childId}${params}`);
  }

  async getRecipes(childId: string, count: number = 3) {
    return this.request(`/recommendations/recipes/${childId}?count=${count}`);
  }

  async getParentingTips(childId: string, focusArea?: string) {
    const params = focusArea ? `?focusArea=${focusArea}` : '';
    return this.request(`/recommendations/tips/${childId}${params}`);
  }

  async getWHOSources(region?: string) {
    const params = region ? `?region=${region}` : '';
    return this.request(`/recommendations/sources${params}`);
  }

  // ============ MILESTONE TRACKING ============

  // Get all milestones for a child (achieved and watched)
  async getChildMilestones(childId: string) {
    return this.request<{
      achievedMilestones: Array<{
        milestoneId: string;
        achievedDate: string;
        confirmedBy: 'parent' | 'analysis';
        notes?: string;
      }>;
      watchedMilestones: Array<{
        milestoneId: string;
        addedDate: string;
      }>;
    }>(`/children/${childId}/milestones`);
  }

  // Mark milestone as achieved
  async markMilestoneAchieved(
    childId: string,
    milestoneId: string,
    data?: {
      achievedDate?: string;
      notes?: string;
      confirmedBy?: 'parent' | 'analysis';
    }
  ) {
    return this.request(`/children/${childId}/milestones/${milestoneId}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  // Remove milestone achievement
  async unmarkMilestoneAchieved(childId: string, milestoneId: string) {
    return this.request(`/children/${childId}/milestones/${milestoneId}`, {
      method: 'DELETE',
    });
  }

  // Add milestone to watch list
  async watchMilestone(childId: string, milestoneId: string) {
    return this.request(`/children/${childId}/milestones/${milestoneId}/watch`, {
      method: 'POST',
    });
  }

  // Remove milestone from watch list
  async unwatchMilestone(childId: string, milestoneId: string) {
    return this.request(`/children/${childId}/milestones/${milestoneId}/watch`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;

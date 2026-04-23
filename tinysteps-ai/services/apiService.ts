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

  // Save a pre-computed analysis result (from browser-side Gemini) to backend
  async saveAnalysisResult(childId: string, analysisData: any) {
    return this.request('/analysis/save', {
      method: 'POST',
      body: JSON.stringify({ childId, analysisData }),
    });
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

  async generateCustomStory(params: {
    childId: string;
    customPrompt?: string;
    characters?: string[];
    setting?: string;
    action?: string;
    characterImages?: Array<{ name: string; base64: string; mimeType: string }>;
    childAvatarImage?: { base64: string; mimeType: string } | null;
  }) {
    return this.request('/stories/custom', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateStoryCoverImage(childId: string, storyId: string, coverImageUrl: string) {
    return this.request(`/stories/${childId}/${storyId}/cover`, {
      method: 'PATCH',
      body: JSON.stringify({ coverImageUrl }),
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

  async updateStoryPageIllustration(
    childId: string,
    storyId: string,
    pageNumber: number,
    illustrationUrl: string
  ) {
    return this.request(`/stories/${childId}/${storyId}/page/${pageNumber}/illustration`, {
      method: 'PATCH',
      body: JSON.stringify({ illustrationUrl }),
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

  async getRecipes(childId: string) {
    return this.request(`/recommendations/recipes/${childId}`);
  }

  async toggleRecipeFavorite(recipeId: string, childId: string) {
    return this.request(`/recommendations/recipes/${recipeId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ childId }),
    });
  }

  async regenerateRecipes(childId: string, filters?: { excludeAllergens?: string[]; dietaryPreferences?: string[]; foodLikings?: string }) {
    return this.request(`/recommendations/recipes/${childId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    });
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

  // ============ DOCTORS ============

  async getRecommendedDoctors(childId: string) {
    return this.request(`/doctors/recommended/${childId}`);
  }

  async getDoctors(params?: { domain?: string; specialty?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/doctors${query ? `?${query}` : ''}`);
  }

  // ============ RESOURCES ============

  async getResources(childId: string, params?: { domain?: string; type?: string }) {
    const filteredParams: Record<string, string> = {};
    if (params?.domain) filteredParams.domain = params.domain;
    if (params?.type) filteredParams.type = params.type;
    const query = new URLSearchParams(filteredParams).toString();
    return this.request(`/resources/${childId}${query ? `?${query}` : ''}`);
  }

  async regenerateResources(childId: string) {
    return this.request(`/resources/${childId}/regenerate`, { method: 'POST' });
  }

  // ============ REPORTS ============

  async getReports(childId: string) {
    return this.request(`/reports/${childId}`);
  }

  async generateReport(childId: string) {
    return this.request(`/reports/${childId}/generate`, { method: 'POST' });
  }

  async getReport(childId: string, reportId: string) {
    return this.request(`/reports/${childId}/${reportId}`);
  }

  async getReportPdf(childId: string, reportId: string) {
    return this.request(`/reports/${childId}/${reportId}/pdf`);
  }

  async shareReport(childId: string, reportId: string, method: string, recipient?: string) {
    return this.request(`/reports/${childId}/${reportId}/share`, {
      method: 'POST',
      body: JSON.stringify({ method, recipient }),
    });
  }

  // ============ WHO EVIDENCE ============

  async getWHOEvidence(params?: { context?: string; analysisId?: string; region?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/recommendations/sources${query ? `?${query}` : ''}`);
  }

  // ============ UPLOAD ============

  async uploadImage(file: File, bucket: string) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('bucket', bucket);
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return response.json();
  }

  // ============ SARVAM LANGUAGE ============

  async translateText(text: string, targetLanguageCode: string): Promise<{ translatedText?: string; error?: string }> {
    const result = await this.request<{ translatedText: string }>('/sarvam/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguageCode }),
    });
    return result.data ? { translatedText: result.data.translatedText } : { error: result.error };
  }

  async getAudio(text: string, targetLanguageCode: string): Promise<{ audioChunks?: string[]; error?: string }> {
    const result = await this.request<{ audioChunks: string[] }>('/sarvam/tts', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguageCode }),
    });
    return result.data ? { audioChunks: result.data.audioChunks } : { error: result.error };
  }

  async updateUserLanguage(language: string): Promise<{ success?: boolean; error?: string }> {
    const result = await this.request<{ success: boolean; language: string }>('/auth/language', {
      method: 'PATCH',
      body: JSON.stringify({ language }),
    });
    return result.data ? { success: true } : { error: result.error };
  }
  // ============ BABY SOUNDS & TRANSCRIPTION ============

  async analyzeBabySounds(childId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('childId', childId);
    formData.append('audio', audioBlob);

    const url = `${API_BASE_URL}/analysis/baby-sounds`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Baby sound analysis failed' };
      return { data };
    } catch (error) {
      return { error: 'Network error during baby sound analysis' };
    }
  }

  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const url = `${API_BASE_URL}/analysis/transcribe`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) return { error: data.error || 'Transcription failed' };
      return { data };
    } catch (error) {
      return { error: 'Network error during transcription' };
    }
  }

  // ============ ILLUSTRATION ============

  async generateIllustration(prompt: string, childPhotoBase64?: string) {
    return this.request<{ url: string; mimeType: string }>('/stories/illustration', {
      method: 'POST',
      body: JSON.stringify({ prompt, childPhotoBase64 }),
    });
  }

  // ============ CONFIG & TRENDS ============

  async getAppConfig() {
    return this.request<any>('/config');
  }

  async getAnalysisTrends(childId: string, period: string = '3M') {
    return this.request<any>(`/analysis/${childId}/trends?period=${period}`);
  }

  // ============ COMMUNITY ============

  async getCommunityPosts(params?: { category?: string; search?: string; sort?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return this.request(`/community/posts${qs ? `?${qs}` : ''}`);
  }

  async createCommunityPost(data: { title: string; content: string; category?: string }) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCommunityPost(postId: string) {
    return this.request(`/community/posts/${postId}`);
  }

  async togglePostLike(postId: string) {
    return this.request(`/community/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId: string, content: string) {
    return this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getCommunityTopics() {
    return this.request('/community/topics');
  }
}

export const apiService = new ApiService();
export default apiService;

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new File([array], filename, { type: mime });
}

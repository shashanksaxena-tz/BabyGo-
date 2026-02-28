import {
  ChildProfile,
  AnalysisResult,
  TimelineEntry,
  BedtimeStory,
  ChildIllustration,
  Notification,
  UserPreferences,
  AppState,
} from '../types';
import apiService from './apiService';

const STORAGE_KEYS = {
  CHILDREN: 'tinysteps_children',
  CURRENT_CHILD_ID: 'tinysteps_current_child',
  ANALYSES: 'tinysteps_analyses',
  TIMELINE: 'tinysteps_timeline',
  STORIES: 'tinysteps_stories',
  ILLUSTRATIONS: 'tinysteps_illustrations',
  NOTIFICATIONS: 'tinysteps_notifications',
  PREFERENCES: 'tinysteps_preferences',
  ONBOARDING_COMPLETE: 'tinysteps_onboarding_complete',
};

// Helper functions
function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check if an ID is a valid MongoDB ObjectId (24-char hex string)
export function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Convert backend child data to frontend ChildProfile format
function backendChildToProfile(backendChild: any): ChildProfile {
  return {
    id: backendChild._id || backendChild.id,
    name: backendChild.name,
    nickname: backendChild.nickname,
    dateOfBirth: backendChild.dateOfBirth,
    ageMonths: backendChild.ageInMonths ?? backendChild.ageMonths ?? 0,
    gender: backendChild.gender,
    weight: backendChild.weight,
    height: backendChild.height,
    headCircumference: backendChild.headCircumference,
    region: typeof backendChild.region === 'string'
      ? { code: backendChild.region.toUpperCase(), name: backendChild.region, whoRegion: backendChild.region.toUpperCase() as any }
      : backendChild.region,
    interests: backendChild.interests || [],
    favoriteCharacters: backendChild.favoriteCharacters || [],
    favoriteToys: backendChild.favoriteToys || [],
    favoriteColors: backendChild.favoriteColors || [],
    profilePhoto: backendChild.profilePhotoUrl || backendChild.profilePhoto,
    createdAt: backendChild.createdAt,
    updatedAt: backendChild.updatedAt,
  };
}

// Convert frontend ChildProfile to backend API format
function profileToBackendChild(child: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): any {
  return {
    name: child.name,
    nickname: child.nickname,
    dateOfBirth: child.dateOfBirth,
    gender: child.gender,
    weight: child.weight,
    height: child.height,
    headCircumference: child.headCircumference,
    region: child.region?.whoRegion?.toLowerCase() || 'amro',
    interests: (child.interests || []).map((i: any) => typeof i === 'string' ? i : i.name),
    favoriteCharacters: child.favoriteCharacters || [],
    favoriteToys: child.favoriteToys || [],
    favoriteColors: child.favoriteColors || [],
    profilePhotoUrl: child.profilePhoto,
  };
}

// Child Profile Functions
export function getChildren(): ChildProfile[] {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.CHILDREN), []);
}

export function getChildById(id: string): ChildProfile | null {
  const children = getChildren();
  return children.find((c) => c.id === id) || null;
}

export function getCurrentChild(): ChildProfile | null {
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  if (!currentId) return null;
  return getChildById(currentId);
}

export function setCurrentChild(childId: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_CHILD_ID, childId);
}

export function saveChild(child: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>): ChildProfile {
  const children = getChildren();
  const newChild: ChildProfile = {
    ...child,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  children.push(newChild);
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));

  // If this is the first child, set as current
  if (children.length === 1) {
    setCurrentChild(newChild.id);
  }

  return newChild;
}

// Async API-backed version: creates child in backend first, caches to localStorage.
// This is the ONLY way to create a child. No local fallback -- children MUST have MongoDB IDs.
export async function saveChildAsync(child: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChildProfile> {
  const backendData = profileToBackendChild(child as any);
  const result = await apiService.createChild(backendData);
  const data = result.data as any;

  if (!data?.child) {
    throw new Error('Backend did not return a child object. Please check that the server is running.');
  }

  const newChild = backendChildToProfile(data.child);
  // Preserve original interests format (with icon/category) for frontend use
  newChild.interests = child.interests || [];
  newChild.region = child.region;
  newChild.profilePhoto = child.profilePhoto;

  // Cache to localStorage
  const children = getChildren();
  children.push(newChild);
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));

  if (children.length === 1) {
    setCurrentChild(newChild.id);
  }

  return newChild;
}

export function updateChild(id: string, updates: Partial<ChildProfile>): ChildProfile | null {
  const children = getChildren();
  const index = children.findIndex((c) => c.id === id);
  if (index === -1) return null;

  children[index] = {
    ...children[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  return children[index];
}

// Async API-backed version
export async function updateChildAsync(id: string, updates: Partial<ChildProfile>): Promise<ChildProfile | null> {
  // Update localStorage cache first for responsiveness
  const localResult = updateChild(id, updates);

  if (isMongoId(id)) {
    try {
      const backendData = profileToBackendChild({ ...localResult, ...updates } as any);
      await apiService.updateChild(id, backendData);
    } catch (err) {
      console.error('API updateChild failed, localStorage cache updated:', err);
    }
  }

  return localResult;
}

export function deleteChild(id: string): boolean {
  const children = getChildren();
  const filtered = children.filter((c) => c.id !== id);
  if (filtered.length === children.length) return false;

  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(filtered));

  // If deleted child was current, set new current
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  if (currentId === id && filtered.length > 0) {
    setCurrentChild(filtered[0].id);
  } else if (filtered.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  }

  return true;
}

// Async API-backed version
export async function deleteChildAsync(id: string): Promise<boolean> {
  // Delete from localStorage cache first
  const localResult = deleteChild(id);

  if (isMongoId(id)) {
    try {
      await apiService.deleteChild(id);
    } catch (err) {
      console.error('API deleteChild failed, localStorage cache updated:', err);
    }
  }

  return localResult;
}

// Sync a locally-created child to the backend, returning the new MongoDB-backed child.
// Throws an error if the sync fails -- callers should handle the error and show UI feedback.
export async function syncLocalChildToBackend(child: ChildProfile): Promise<ChildProfile> {
  const backendData = profileToBackendChild(child);
  const result = await apiService.createChild(backendData);
  const data = result.data as any;

  if (!data?.child) {
    throw new Error('Backend did not return a child object during sync.');
  }

  const newChild = backendChildToProfile(data.child);
  // Preserve frontend-specific fields
  newChild.interests = child.interests || [];
  newChild.region = child.region;
  newChild.profilePhoto = child.profilePhoto;

  // Replace old local child with new MongoDB-backed one in localStorage
  const children = getChildren();
  const index = children.findIndex((c) => c.id === child.id);
  if (index !== -1) {
    children[index] = newChild;
  } else {
    children.push(newChild);
  }
  localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));

  // Update current child reference
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD_ID);
  if (currentId === child.id) {
    setCurrentChild(newChild.id);
  }

  return newChild;
}

// Analysis Functions
export function getAnalyses(childId?: string): AnalysisResult[] {
  const analyses = safeJsonParse<AnalysisResult[]>(
    localStorage.getItem(STORAGE_KEYS.ANALYSES),
    []
  );
  if (childId) {
    return analyses.filter((a) => a.childId === childId);
  }
  return analyses;
}

export function getAnalysisById(id: string): AnalysisResult | null {
  const analyses = getAnalyses();
  return analyses.find((a) => a.id === id) || null;
}

export function saveAnalysis(analysis: Omit<AnalysisResult, 'id'>): AnalysisResult {
  const analyses = getAnalyses();
  const newAnalysis: AnalysisResult = {
    ...analysis,
    id: generateId(),
  };
  analyses.push(newAnalysis);
  localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));

  // Also add to timeline
  addTimelineEntry({
    childId: analysis.childId,
    type: 'analysis',
    title: analysis.headline,
    description: `Development analysis completed with score ${analysis.overallScore}/100`,
    analysisId: newAnalysis.id,
  }).catch(err => console.error('Timeline entry for analysis failed:', err));

  return newAnalysis;
}

// Map backend status values to frontend status values
function mapBackendStatus(status: string): string {
  switch (status) {
    case 'on_track':
      return 'on-track';
    case 'emerging':
      return 'monitor';
    case 'needs_support':
      return 'discuss';
    default:
      return status;
  }
}

// Map a single backend domain assessment to frontend DomainAssessment format
function mapBackendDomainAssessment(backendDomain: any, fallbackDomain: string): any {
  if (!backendDomain) {
    return {
      domain: fallbackDomain,
      score: 0,
      status: 'monitor',
      description: '',
      observations: [],
      recommendations: [],
    };
  }

  return {
    domain: backendDomain.domain || fallbackDomain,
    score: backendDomain.score || 0,
    status: mapBackendStatus(backendDomain.status || 'emerging'),
    description: backendDomain.description || '',
    percentile: backendDomain.percentile,
    ageEquivalent: backendDomain.ageEquivalent,
    observations: backendDomain.observations || [],
    // Map areasToSupport -> recommendations (frontend field name in DomainAssessment)
    recommendations: backendDomain.areasToSupport || backendDomain.recommendations || backendDomain.activities || [],
  };
}

// Map a full backend analysis object to frontend AnalysisResult format
export function mapBackendAnalysis(a: any): AnalysisResult {
  return {
    id: a._id || a.id,
    childId: a.childId,
    timestamp: a.timestamp || a.createdAt,
    mediaUploads: a.mediaUploads || a.mediaFiles || [],
    headline: a.headline || a.summary || '',
    overallScore: a.overallScore || 0,
    // Map backend domain field names to frontend field names, with status mapping
    motorSkills: mapBackendDomainAssessment(a.motorSkills || a.motorAssessment, 'motor'),
    cognitiveSkills: mapBackendDomainAssessment(a.cognitiveSkills || a.cognitiveAssessment, 'cognitive'),
    languageSkills: mapBackendDomainAssessment(a.languageSkills || a.languageAssessment, 'language'),
    socialEmotional: mapBackendDomainAssessment(a.socialEmotional || a.socialAssessment, 'social'),
    physicalGrowth: a.physicalGrowth || {
      status: mapBackendStatus(a.overallStatus || 'on_track'),
      description: '',
      weightPercentile: 0,
      heightPercentile: 0,
    },
    activity: a.activity || { pattern: '', description: '', engagementLevel: 'moderate' as const },
    milestones: a.milestones || [],
    tips: a.tips || (a.personalizedTips || []).map((t: string, i: number) => ({
      id: `tip-${i}`,
      category: 'activity' as const,
      title: t,
      description: t,
      forAgeMonths: { min: 0, max: 72 },
      difficulty: 'easy' as const,
      duration: '10 min',
    })),
    reassurance: a.reassurance || a.summary || '',
    sources: a.sources || [],
    warnings: a.warnings,
  };
}

// Async: Fetch analyses from API and cache to localStorage
export async function fetchAnalyses(childId: string): Promise<AnalysisResult[]> {
  // Safety check: don't make API calls with non-MongoDB IDs
  if (!isMongoId(childId)) {
    console.warn(`fetchAnalyses called with non-MongoDB ID: ${childId}. Returning empty array.`);
    return [];
  }

  try {
    const result = await apiService.getAnalyses(childId);
    const data = result.data as any;
    if (data?.analyses && Array.isArray(data.analyses)) {
      const analyses: AnalysisResult[] = data.analyses.map(mapBackendAnalysis);

      // Cache to localStorage
      const allAnalyses = safeJsonParse<AnalysisResult[]>(
        localStorage.getItem(STORAGE_KEYS.ANALYSES),
        []
      );
      // Remove old entries for this child and add new ones
      const otherAnalyses = allAnalyses.filter((a) => a.childId !== childId);
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify([...otherAnalyses, ...analyses]));

      return analyses;
    }
  } catch (err) {
    console.error('API fetchAnalyses failed, falling back to localStorage:', err);
  }

  return getAnalyses(childId);
}

// Timeline Functions
export function getTimeline(childId?: string): TimelineEntry[] {
  const timeline = safeJsonParse<TimelineEntry[]>(
    localStorage.getItem(STORAGE_KEYS.TIMELINE),
    []
  );
  if (childId) {
    return timeline
      .filter((t) => t.childId === childId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addTimelineEntry(
  entry: Omit<TimelineEntry, 'id' | 'timestamp'>
): Promise<TimelineEntry> {
  // Write to backend first; use returned MongoDB _id
  if (isMongoId(entry.childId)) {
    try {
      const result = await apiService.addTimelineEntry({
        childId: entry.childId,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        mediaUrl: entry.mediaUrl,
        data: entry.data,
      });
      const data = result.data as any;
      if (data?.entry) {
        const saved: TimelineEntry = {
          id: data.entry._id || data.entry.id,
          childId: data.entry.childId,
          timestamp: data.entry.date || data.entry.createdAt || new Date().toISOString(),
          type: data.entry.type,
          title: data.entry.title,
          description: data.entry.description,
          mediaUrl: data.entry.mediaUrl,
          analysisId: data.entry.data?.analysisId,
          data: data.entry.data,
        };
        // Cache to localStorage
        const timeline = safeJsonParse<TimelineEntry[]>(
          localStorage.getItem(STORAGE_KEYS.TIMELINE), []
        );
        timeline.push(saved);
        localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
        return saved;
      }
    } catch (err) {
      console.error('API addTimelineEntry failed, falling back to localStorage:', err);
    }
  }

  // Fallback: local-only entry (offline or non-MongoDB child)
  const newEntry: TimelineEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const timeline = safeJsonParse<TimelineEntry[]>(
    localStorage.getItem(STORAGE_KEYS.TIMELINE), []
  );
  timeline.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timeline));
  return newEntry;
}

export function deleteTimelineEntry(id: string): boolean {
  const timeline = getTimeline();
  const filtered = timeline.filter((t) => t.id !== id);
  if (filtered.length === timeline.length) return false;
  localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(filtered));
  return true;
}

// Async: Fetch timeline from API and cache to localStorage
export async function fetchTimeline(childId: string): Promise<TimelineEntry[]> {
  // Safety check: don't make API calls with non-MongoDB IDs
  if (!isMongoId(childId)) {
    console.warn(`fetchTimeline called with non-MongoDB ID: ${childId}. Returning empty array.`);
    return [];
  }

  try {
    const result = await apiService.getTimeline(childId);
    const data = result.data as any;
    if (data?.entries && Array.isArray(data.entries)) {
      const entries: TimelineEntry[] = data.entries.map((e: any) => ({
        id: e._id || e.id,
        childId: e.childId,
        timestamp: e.timestamp || e.date || e.createdAt,
        type: e.type,
        title: e.title,
        description: e.description,
        mediaUrl: e.mediaUrl,
        analysisId: e.data?.analysisId || e.analysisId,
        data: e.data,
      }));

      // Cache to localStorage
      const allTimeline = safeJsonParse<TimelineEntry[]>(
        localStorage.getItem(STORAGE_KEYS.TIMELINE),
        []
      );
      const otherEntries = allTimeline.filter((t) => t.childId !== childId);
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify([...otherEntries, ...entries]));

      return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (err) {
    console.error('API fetchTimeline failed, falling back to localStorage:', err);
  }

  return getTimeline(childId);
}

// Story Functions
export function getStories(childId?: string): BedtimeStory[] {
  const stories = safeJsonParse<BedtimeStory[]>(
    localStorage.getItem(STORAGE_KEYS.STORIES),
    []
  );
  if (childId) {
    return stories.filter((s) => s.childId === childId);
  }
  return stories;
}

export function saveStory(story: Omit<BedtimeStory, 'id' | 'createdAt'>): BedtimeStory {
  const stories = getStories();
  const newStory: BedtimeStory = {
    ...story,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  stories.push(newStory);
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
  return newStory;
}

export function updateStory(story: BedtimeStory): BedtimeStory | null {
  const stories = getStories();
  const index = stories.findIndex((s) => s.id === story.id);
  if (index === -1) return null;

  stories[index] = story;
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
  return stories[index];
}

export function deleteStory(id: string): boolean {
  const stories = getStories();
  const filtered = stories.filter((s) => s.id !== id);
  if (filtered.length === stories.length) return false;
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(filtered));
  return true;
}

// Async: Fetch stories from API and cache to localStorage
export async function fetchStories(childId: string): Promise<BedtimeStory[]> {
  // Safety check: don't make API calls with non-MongoDB IDs
  if (!isMongoId(childId)) {
    console.warn(`fetchStories called with non-MongoDB ID: ${childId}. Returning empty array.`);
    return [];
  }

  try {
    const result = await apiService.getStories(childId);
    const data = result.data as any;
    if (data?.stories && Array.isArray(data.stories)) {
      const stories: BedtimeStory[] = data.stories.map((s: any) => ({
        id: s._id || s.id,
        childId: s.childId,
        title: s.title,
        theme: typeof s.theme === 'object' ? s.theme.name : s.theme,
        content: s.pages ? s.pages.map((p: any) => p.text || p.content || '') : s.content || [],
        illustrations: s.pages ? s.pages.map((p: any, i: number) => ({
          sceneIndex: i,
          description: p.illustrationPrompt || p.description || '',
          imageUrl: p.illustrationUrl || p.imageUrl,
          style: 'storybook' as const,
        })) : s.illustrations || [],
        duration: s.duration || 5,
        createdAt: s.createdAt,
        characters: s.characters || [],
        moral: s.moral,
      }));

      // Cache to localStorage
      const allStories = safeJsonParse<BedtimeStory[]>(
        localStorage.getItem(STORAGE_KEYS.STORIES),
        []
      );
      const otherStories = allStories.filter((s) => s.childId !== childId);
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify([...otherStories, ...stories]));

      return stories;
    }
  } catch (err) {
    console.error('API fetchStories failed, falling back to localStorage:', err);
  }

  return getStories(childId);
}

// Async: Fetch all children from API and cache to localStorage.
// Backend is the source of truth -- local-only children (without MongoDB IDs) are discarded.
export async function fetchChildren(): Promise<ChildProfile[]> {
  try {
    const result = await apiService.getChildren();
    const data = result.data as any;
    if (data?.children && Array.isArray(data.children)) {
      const backendChildren: ChildProfile[] = data.children.map(backendChildToProfile);

      // Merge with localStorage to preserve frontend-specific fields (interests with icons, etc.)
      // for children that exist in the backend
      const localChildren = getChildren();
      const mergedChildren = backendChildren.map((bc) => {
        const localMatch = localChildren.find((lc) => lc.id === bc.id);
        if (localMatch) {
          // Preserve frontend-specific rich fields from localStorage cache
          return {
            ...bc,
            interests: localMatch.interests?.length ? localMatch.interests : bc.interests,
            region: localMatch.region || bc.region,
            profilePhoto: localMatch.profilePhoto || bc.profilePhoto,
          };
        }
        return bc;
      });

      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(mergedChildren));

      // If the current child ID points to a local-only child that no longer exists,
      // update it to the first backend child
      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHILD_ID);
      if (currentId && !mergedChildren.find((c) => c.id === currentId)) {
        if (mergedChildren.length > 0) {
          setCurrentChild(mergedChildren[0].id);
        } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_CHILD_ID);
        }
      }

      return mergedChildren;
    }
  } catch (err) {
    console.error('API fetchChildren failed, falling back to localStorage:', err);
  }

  return getChildren();
}

// Illustration Functions
export function getIllustrations(childId?: string): ChildIllustration[] {
  const illustrations = safeJsonParse<ChildIllustration[]>(
    localStorage.getItem(STORAGE_KEYS.ILLUSTRATIONS),
    []
  );
  if (childId) {
    return illustrations.filter((i) => i.childId === childId);
  }
  return illustrations;
}

export function saveIllustration(
  illustration: Omit<ChildIllustration, 'id' | 'createdAt'>
): ChildIllustration {
  const illustrations = getIllustrations();
  const newIllustration: ChildIllustration = {
    ...illustration,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  illustrations.push(newIllustration);
  localStorage.setItem(STORAGE_KEYS.ILLUSTRATIONS, JSON.stringify(illustrations));
  return newIllustration;
}

// Notification Functions
export function getNotifications(childId?: string): Notification[] {
  const notifications = safeJsonParse<Notification[]>(
    localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
    []
  );
  if (childId) {
    return notifications.filter((n) => n.childId === childId);
  }
  return notifications;
}

export function addNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Notification {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification); // Add to beginning
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return newNotification;
}

export function markNotificationRead(id: string): boolean {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return false;
  notifications[index].read = true;
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return true;
}

export function markAllNotificationsRead(childId: string): void {
  const notifications = getNotifications();
  notifications.forEach((n) => {
    if (n.childId === childId) {
      n.read = true;
    }
  });
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export function clearNotifications(childId: string): void {
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.childId !== childId);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(filtered));
}

// Preferences Functions
export function getPreferences(): UserPreferences {
  return safeJsonParse<UserPreferences>(localStorage.getItem(STORAGE_KEYS.PREFERENCES), {
    theme: 'light',
    language: 'en',
    measurementUnit: 'metric',
    notificationsEnabled: true,
    personalizationEnabled: true,
  });
}

export function updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  return updated;
}

// Onboarding Functions
export function isOnboardingComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
}

export function setOnboardingComplete(): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

export function resetOnboarding(): void {
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
}

// Get Full App State
export function getAppState(): AppState {
  const currentChild = getCurrentChild();
  return {
    currentChild,
    children: getChildren(),
    analyses: getAnalyses(),
    timeline: getTimeline(),
    stories: getStories(),
    illustrations: getIllustrations(),
    notifications: getNotifications(),
    preferences: getPreferences(),
  };
}

// Clear All Data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

// Export data for backup
export function exportData(): string {
  return JSON.stringify(getAppState(), null, 2);
}

// Import data from backup
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as AppState;

    if (data.children) {
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(data.children));
    }
    if (data.analyses) {
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(data.analyses));
    }
    if (data.timeline) {
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(data.timeline));
    }
    if (data.stories) {
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(data.stories));
    }
    if (data.illustrations) {
      localStorage.setItem(STORAGE_KEYS.ILLUSTRATIONS, JSON.stringify(data.illustrations));
    }
    if (data.notifications) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
    }
    if (data.preferences) {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(data.preferences));
    }
    if (data.currentChild) {
      setCurrentChild(data.currentChild.id);
    }

    return true;
  } catch {
    return false;
  }
}

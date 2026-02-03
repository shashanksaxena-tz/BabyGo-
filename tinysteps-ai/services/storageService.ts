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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  });

  return newAnalysis;
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

export function addTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'timestamp'>): TimelineEntry {
  const timeline = getTimeline();
  const newEntry: TimelineEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
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

export function deleteStory(id: string): boolean {
  const stories = getStories();
  const filtered = stories.filter((s) => s.id !== id);
  if (filtered.length === stories.length) return false;
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(filtered));
  return true;
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

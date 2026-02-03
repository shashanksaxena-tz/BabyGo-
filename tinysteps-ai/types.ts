export enum AppStep {
  ONBOARDING = 'ONBOARDING',
  PROFILE_SETUP = 'PROFILE_SETUP',
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  TIMELINE = 'TIMELINE',
  STORIES = 'STORIES',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
}

export interface ChildProfile {
  id: string;
  name: string;
  nickname?: string;
  dateOfBirth: string;
  ageMonths: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  headCircumference?: number; // in cm, for babies < 2 years
  region: Region;
  interests: Interest[];
  favoriteCharacters: string[];
  favoriteToys: string[];
  favoriteColors: string[];
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  code: string;
  name: string;
  whoRegion: WHORegion;
}

export type WHORegion =
  | 'AFRO'   // Africa
  | 'AMRO'   // Americas
  | 'SEARO'  // South-East Asia
  | 'EURO'   // Europe
  | 'EMRO'   // Eastern Mediterranean
  | 'WPRO';  // Western Pacific

export interface Interest {
  id: string;
  name: string;
  icon: string;
  category: 'animals' | 'vehicles' | 'nature' | 'fantasy' | 'sports' | 'arts' | 'science' | 'music' | 'other';
}

export interface MediaUpload {
  id: string;
  type: 'image' | 'video' | 'audio';
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number; // for video/audio
  timestamp: string;
  description?: string;
}

export interface AnalysisResult {
  id: string;
  childId: string;
  timestamp: string;
  mediaUploads: MediaUpload[];
  headline: string;
  overallScore: number; // 0-100
  motorSkills: DomainAssessment;
  cognitiveSkills: DomainAssessment;
  languageSkills: DomainAssessment;
  socialEmotional: DomainAssessment;
  physicalGrowth: GrowthAssessment;
  activity: ActivityAssessment;
  milestones: MilestoneProgress[];
  tips: DevelopmentTip[];
  reassurance: string;
  sources: WHOSource[];
  warnings?: DevelopmentWarning[];
}

export interface DomainAssessment {
  domain: string;
  status: 'ahead' | 'on-track' | 'monitor' | 'discuss';
  description: string;
  score: number; // 0-100
  percentile?: number;
  ageEquivalent?: string;
  observations: string[];
  recommendations: string[];
}

export interface GrowthAssessment {
  status: string;
  description: string;
  weightPercentile: number;
  heightPercentile: number;
  headCircumferencePercentile?: number;
  bmi?: number;
  bmiPercentile?: number;
  growthVelocity?: string;
}

export interface ActivityAssessment {
  pattern: string;
  description: string;
  engagementLevel: 'high' | 'moderate' | 'low';
  focusDuration?: string;
  playStyle?: string;
}

export interface MilestoneProgress {
  id: string;
  domain: 'motor' | 'cognitive' | 'language' | 'social' | 'sensory';
  title: string;
  description: string;
  expectedAgeMonths: { min: number; max: number };
  achieved: boolean;
  achievedDate?: string;
  source: WHOSource;
}

export interface DevelopmentTip {
  id: string;
  category: 'activity' | 'nutrition' | 'sleep' | 'play' | 'learning' | 'bonding';
  title: string;
  description: string;
  forAgeMonths: { min: number; max: number };
  difficulty: 'easy' | 'moderate' | 'challenging';
  duration: string;
  materials?: string[];
  source?: WHOSource;
}

export interface DevelopmentWarning {
  severity: 'info' | 'monitor' | 'discuss' | 'urgent';
  domain: string;
  message: string;
  recommendation: string;
}

export interface WHOSource {
  title: string;
  url: string;
  organization: 'WHO' | 'CDC' | 'AAP' | 'UNICEF' | 'Regional';
  region?: WHORegion;
  year?: number;
  type: 'guideline' | 'data' | 'research' | 'recommendation';
}

export interface TimelineEntry {
  id: string;
  childId: string;
  timestamp: string;
  type: 'analysis' | 'milestone' | 'measurement' | 'photo' | 'note';
  title: string;
  description: string;
  mediaUrl?: string;
  analysisId?: string;
  data?: any;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  description: string;
  category: 'toys' | 'books' | 'educational' | 'clothing' | 'safety' | 'nutrition' | 'outdoor';
  imageUrl: string;
  price: string;
  affiliateUrl: string;
  ageRange: { min: number; max: number };
  interests: string[];
  rating: number;
  benefits: string[];
  source: 'amazon' | 'target' | 'walmart' | 'specialty';
}

export interface BedtimeStory {
  id: string;
  childId: string;
  title: string;
  theme: string;
  content: string[];
  illustrations: StoryIllustration[];
  duration: number; // in minutes
  createdAt: string;
  characters: StoryCharacter[];
  moral?: string;
}

export interface StoryCharacter {
  name: string;
  role: 'protagonist' | 'sidekick' | 'mentor' | 'other';
  description: string;
  basedOnChild: boolean;
}

export interface StoryIllustration {
  sceneIndex: number;
  description: string;
  imageUrl?: string;
  style: 'watercolor' | 'cartoon' | 'realistic' | 'storybook';
}

export interface ChildIllustration {
  id: string;
  childId: string;
  style: 'cartoon' | 'anime' | 'watercolor' | 'disney' | 'storybook';
  activity: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ageRange: { min: number; max: number };
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionInfo: NutritionInfo;
  allergens: string[];
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: WHOSource;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  optional?: boolean;
  substitutes?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins?: string[];
}

export interface ParentingTip {
  id: string;
  category: 'sleep' | 'feeding' | 'behavior' | 'safety' | 'development' | 'health' | 'bonding';
  title: string;
  content: string;
  ageRange: { min: number; max: number };
  source: WHOSource;
  importance: 'essential' | 'recommended' | 'optional';
}

export interface Notification {
  id: string;
  childId: string;
  type: 'milestone' | 'tip' | 'reminder' | 'achievement' | 'story';
  title: string;
  message: string;
  theme?: string; // personalized based on interests
  icon?: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface AppState {
  currentChild: ChildProfile | null;
  children: ChildProfile[];
  analyses: AnalysisResult[];
  timeline: TimelineEntry[];
  stories: BedtimeStory[];
  illustrations: ChildIllustration[];
  notifications: Notification[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  measurementUnit: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  personalizationEnabled: boolean;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}

export interface AnalysisResult {
  headline: string;
  motorSkills: {
    status: string;
    description: string;
    score: number; // 0-100 for visualization
  };
  physicalGrowth: {
    status: string;
    description: string;
  };
  activity: {
    pattern: string;
    description: string;
  };
  tips: string[];
  reassurance: string;
  groundingUrls?: string[];
}

export interface ChildContext {
  age: string;
  notes: string;
}

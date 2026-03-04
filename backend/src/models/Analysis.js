import mongoose from 'mongoose';

const domainAssessmentSchema = new mongoose.Schema({
  domain: {
    type: String,
    enum: ['motor', 'language', 'cognitive', 'social'],
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  status: {
    type: String,
    enum: ['ahead', 'on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
    required: true,
  },
  observations: [String],
  strengths: [String],
  areasToSupport: [String],
  achievedMilestones: [{
    id: String,
    title: String,
    achievedDate: Date,
  }],
  upcomingMilestones: [{
    id: String,
    title: String,
    typicalMonths: Number,
  }],
  activities: [String],
});

const growthPercentileSchema = new mongoose.Schema({
  metric: {
    type: String,
    enum: ['weight', 'height', 'headCircumference'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  percentile: {
    type: Number,
    required: true,
  },
  interpretation: String,
});

const analysisSchema = new mongoose.Schema({
  childId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
  },
  mediaFiles: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] },
    filename: String,
  }],
  audioFile: {
    url: String,
    filename: String,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  overallStatus: {
    type: String,
    enum: ['ahead', 'on_track', 'on_track_with_monitoring', 'emerging', 'needs_support'],
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  motorAssessment: domainAssessmentSchema,
  languageAssessment: domainAssessmentSchema,
  cognitiveAssessment: domainAssessmentSchema,
  socialAssessment: domainAssessmentSchema,
  growthPercentiles: [growthPercentileSchema],
  personalizedTips: [String],
  activities: [String],
  // Structured tips (merged from Web's richer format)
  structuredTips: [{
    category: { type: String, enum: ['sleep', 'feeding', 'behavior', 'safety', 'development', 'health', 'bonding'] },
    title: String,
    description: String,
    priority: { type: String, enum: ['high', 'medium', 'low'] },
  }],
  // Activity tracking (from Web)
  activityProfile: {
    pattern: String,
    description: String,
    engagementLevel: String,
    focusDuration: String,
    playStyle: String,
  },
  // Warnings (from Web)
  warnings: [String],
  // Baby sound analysis data
  babySoundAnalysis: {
    vocalizations: [{
      type: String,
      description: String,
      developmentalSignificance: String,
    }],
    languageObservations: [String],
    recommendations: [String],
  },
  sources: [{
    title: String,
    url: String,
    type: { type: String },
  }],
  childAgeAtAnalysis: {
    type: Number, // months
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
analysisSchema.index({ childId: 1, createdAt: -1 });
analysisSchema.index({ userId: 1 });

export default mongoose.model('Analysis', analysisSchema);

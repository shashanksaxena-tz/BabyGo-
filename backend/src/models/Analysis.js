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
    enum: ['on_track', 'emerging', 'needs_support'],
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
    enum: ['on_track', 'emerging', 'needs_support'],
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
  sources: [{
    title: String,
    url: String,
    type: String,
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

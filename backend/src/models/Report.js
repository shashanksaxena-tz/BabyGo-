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
  whoRange: String,
  alertLevel: {
    type: String,
    enum: ['none', 'watch', 'concern'],
    default: 'none',
  },
}, { _id: false });

const growthPercentileSchema = new mongoose.Schema({
  metric: String,
  value: Number,
  percentile: Number,
  interpretation: String,
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  priority: Number,
  text: String,
  domain: String,
}, { _id: false });

const whoSourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  journal: String,
  year: Number,
  citations: Number,
  domain: String,
  summary: String,
}, { _id: false });

const sharedWithSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['email', 'link', 'download'],
  },
  recipient: String,
  sharedAt: Date,
}, { _id: false });

const reportSchema = new mongoose.Schema({
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
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true,
  },
  reportNumber: {
    type: String,
    required: true, // e.g., "RPT-2026-0207"
  },
  patientInfo: {
    name: {
      type: String,
      required: true,
    },
    gender: String,
    ageMonths: {
      type: Number,
      required: true,
    },
    dateOfBirth: Date,
    height: Number,
    weight: Number,
    headCircumference: Number,
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
  overallSummary: {
    type: String,
    required: true,
  },
  domainAssessments: [domainAssessmentSchema],
  growthPercentiles: [growthPercentileSchema],
  recommendations: [recommendationSchema],
  whoSources: [whoSourceSchema],
  pdfUrl: {
    type: String, // MinIO URL
  },
  sharedWith: [sharedWithSchema],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for efficient queries
reportSchema.index({ childId: 1, createdAt: -1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ analysisId: 1 });

export default mongoose.model('Report', reportSchema);

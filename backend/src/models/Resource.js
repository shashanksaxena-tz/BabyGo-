import mongoose from 'mongoose';

const whoSourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  domain: String,
}, { _id: false });

const resourceSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true,
  },
  domain: {
    type: String,
    enum: ['motor', 'language', 'cognitive', 'social'],
    required: true,
  },
  type: {
    type: String,
    enum: ['activity', 'book', 'video', 'toy', 'app'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: [String],
  ageRange: {
    type: String, // e.g., "12-18 months"
  },
  duration: {
    type: String, // e.g., "10-15 min"
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    default: 'easy',
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  imageUrl: {
    type: String,
  },
  sourceUrl: {
    type: String,
  },
  whoSources: [whoSourceSchema],
  isCurrent: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for efficient queries
resourceSchema.index({ childId: 1, analysisId: 1 });
resourceSchema.index({ childId: 1, domain: 1, isCurrent: 1 });
resourceSchema.index({ childId: 1, type: 1, isCurrent: 1 });

export default mongoose.model('Resource', resourceSchema);

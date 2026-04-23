import mongoose from 'mongoose';

const ageActivitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  domain: { type: String, enum: ['motor', 'language', 'cognitive', 'social', 'sensory'], required: true },
  ageRangeStartMonths: { type: Number, required: true },
  ageRangeEndMonths: { type: Number, required: true },
  category: { type: String, enum: ['capability', 'interest', 'comprehension', 'play_style'] },
  storyContext: { type: String },
  duration: { type: String },
  materials: [String],
  skills: [String],
  steps: [String],
  difficulty: { type: String, enum: ['easy', 'moderate', 'challenging'] },
  relatedMilestoneUuids: [String],
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ageActivitySchema.index({ domain: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 });
ageActivitySchema.index({ category: 1 });

export default mongoose.model('AgeActivity', ageActivitySchema);

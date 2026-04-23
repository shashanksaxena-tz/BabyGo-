import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  legacyId: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String },
  domain: { type: String, enum: ['motor', 'language', 'cognitive', 'social', 'sensory'], required: true },
  subDomain: { type: String },
  ageRangeStartMonths: { type: Number, required: true },
  ageRangeEndMonths: { type: Number, required: true },
  typicalMonths: { type: Number },
  source: { type: String, default: 'WHO' },
  sourceUrl: { type: String },
  tags: [String],
  isActive: { type: Boolean, default: true },
});

milestoneSchema.index({ domain: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 });

export default mongoose.model('Milestone', milestoneSchema);

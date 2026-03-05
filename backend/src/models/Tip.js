import mongoose from 'mongoose';

const tipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['sleep', 'feeding', 'behavior', 'safety', 'development', 'health', 'bonding', 'motor', 'language', 'cognitive', 'social'],
    required: true,
  },
  ageRangeStartMonths: { type: Number, required: true },
  ageRangeEndMonths: { type: Number, required: true },
  actionSteps: [String],
  source: { type: String },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

tipSchema.index({ category: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 });

export default mongoose.model('Tip', tipSchema);

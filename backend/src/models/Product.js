import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['toys', 'books', 'educational', 'outdoor', 'sensory', 'feeding', 'safety'],
    required: true,
  },
  emoji: { type: String },
  ageRangeStartMonths: { type: Number, required: true },
  ageRangeEndMonths: { type: Number, required: true },
  priceRange: { type: String },
  developmentAreas: [String],
  whyRecommended: { type: String },
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ category: 1, ageRangeStartMonths: 1, ageRangeEndMonths: 1 });

export default mongoose.model('Product', productSchema);

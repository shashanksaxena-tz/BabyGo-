import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'puree', 'fingerFood'], required: true },
  ageRangeStartMonths: { type: Number, required: true },
  ageRangeEndMonths: { type: Number, required: true },
  ingredients: [String],
  instructions: [String],
  prepTime: { type: String },
  cookTime: { type: String },
  difficulty: { type: String, enum: ['easy', 'moderate', 'challenging'] },
  allergens: [String],
  nutrition: {
    calories: Number,
    protein: String,
    fiber: String,
    iron: String,
  },
  nutritionHighlights: [String],
  texture: { type: String },
  region: { type: String, default: 'global' },
  tags: [String],
  isSeeded: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

recipeSchema.index({ ageRangeStartMonths: 1, ageRangeEndMonths: 1 });
recipeSchema.index({ mealType: 1 });
recipeSchema.index({ region: 1 });
recipeSchema.index({ allergens: 1 });

export default mongoose.model('Recipe', recipeSchema);

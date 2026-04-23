import mongoose from 'mongoose';

const userRecipeFavoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  childId: { type: String, required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  savedAt: { type: Date, default: Date.now },
});

userRecipeFavoriteSchema.index({ userId: 1, childId: 1, recipeId: 1 }, { unique: true });

export default mongoose.model('UserRecipeFavorite', userRecipeFavoriteSchema);

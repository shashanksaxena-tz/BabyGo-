import mongoose from 'mongoose';

const recipeCacheSchema = new mongoose.Schema({
  childId: { type: String, required: true, unique: true, index: true },
  recipes: [mongoose.Schema.Types.Mixed],
  cachedAt: { type: Date, default: Date.now },
});

export default mongoose.model('RecipeCache', recipeCacheSchema);

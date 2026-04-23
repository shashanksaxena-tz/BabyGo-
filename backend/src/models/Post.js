import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['general', 'motor-skills', 'language', 'cognitive', 'social', 'sleep', 'nutrition', 'milestones'],
    default: 'general',
  },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  replyCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ likes: -1 });

export default mongoose.model('Post', postSchema);

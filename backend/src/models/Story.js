import mongoose from 'mongoose';

const storyPageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  illustrationPrompt: String,
  illustrationUrl: String,
  readingTimeSeconds: {
    type: Number,
    default: 30,
  },
});

const storySchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
  },
  theme: {
    id: {
      type: String,
      required: true,
    },
    name: String,
    emoji: String,
    colorHex: String,
  },
  pages: [storyPageSchema],
  moral: {
    type: String,
    required: true,
  },
  childAgeAtCreation: {
    type: Number, // months
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  timesRead: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for total reading time
storySchema.virtual('totalReadingTimeSeconds').get(function() {
  return this.pages.reduce((sum, page) => sum + (page.readingTimeSeconds || 30), 0);
});

storySchema.set('toJSON', { virtuals: true });
storySchema.set('toObject', { virtuals: true });

// Index for efficient queries
storySchema.index({ childId: 1, createdAt: -1 });
storySchema.index({ userId: 1 });

export default mongoose.model('Story', storySchema);

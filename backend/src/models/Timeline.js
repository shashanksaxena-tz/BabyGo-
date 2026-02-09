import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  childId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['analysis', 'milestone', 'measurement', 'photo', 'note'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  data: mongoose.Schema.Types.Mixed, // Flexible data storage
  mediaPath: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
timelineEntrySchema.index({ childId: 1, date: -1 });

export default mongoose.model('TimelineEntry', timelineEntrySchema);

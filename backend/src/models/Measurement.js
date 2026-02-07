import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
  },
  weight: Number, // kg
  height: Number, // cm
  headCircumference: Number, // cm
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
measurementSchema.index({ childId: 1, date: 1 });

export default mongoose.model('Measurement', measurementSchema);

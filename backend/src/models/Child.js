import mongoose from 'mongoose';

// Schema for achieved milestones
const achievedMilestoneSchema = new mongoose.Schema({
  milestoneId: {
    type: String,
    required: true,
  },
  achievedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  confirmedBy: {
    type: String,
    enum: ['parent', 'analysis'],
    default: 'parent',
  },
  notes: {
    type: String,
    trim: true,
  },
}, { _id: false });

// Schema for watched/tracked milestones
const watchedMilestoneSchema = new mongoose.Schema({
  milestoneId: {
    type: String,
    required: true,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const childSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nickname: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  weight: {
    type: Number,
    required: true, // in kg
  },
  height: {
    type: Number,
    required: true, // in cm
  },
  headCircumference: {
    type: Number, // in cm, for babies < 36 months
  },
  region: {
    type: String,
    enum: ['afro', 'amro', 'searo', 'euro', 'emro', 'wpro'],
    required: true,
  },
  interests: [{
    type: String,
  }],
  favoriteCharacters: [{
    type: String,
  }],
  favoriteToys: [{
    type: String,
  }],
  favoriteColors: [{
    type: String,
  }],
  profilePhotoUrl: {
    type: String,
  },
  // Milestone tracking
  achievedMilestones: [achievedMilestoneSchema],
  watchedMilestones: [watchedMilestoneSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for age in months
childSchema.virtual('ageInMonths').get(function() {
  const now = new Date();
  const birth = new Date(this.dateOfBirth);
  return (now.getFullYear() - birth.getFullYear()) * 12 +
         (now.getMonth() - birth.getMonth());
});

// Virtual for display age
childSchema.virtual('displayAge').get(function() {
  const months = this.ageInMonths;
  if (months < 1) {
    const days = Math.floor((new Date() - new Date(this.dateOfBirth)) / (1000 * 60 * 60 * 24));
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (months < 24) {
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years === 1 ? '' : 's'}`;
    }
    return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  }
});

// Ensure virtuals are included in JSON
childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

// Update timestamp on save
childSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for user queries
childSchema.index({ userId: 1 });

export default mongoose.model('Child', childSchema);

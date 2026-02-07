import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  specialty: {
    type: String,
    required: true,
    trim: true,
  },
  subSpecialty: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.5,
  },
  experienceYears: {
    type: Number,
    required: true,
  },
  distance: {
    type: Number, // km from user
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  avatarUrl: {
    type: String,
  },
  domains: [{
    type: String,
    enum: ['motor', 'language', 'cognitive', 'social', 'general'],
  }],
  tags: [String],
  qualifications: [String],
  location: {
    clinic: String,
    address: String,
    city: {
      type: String,
      default: 'Bangalore',
    },
  },
  availableDays: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for efficient queries
doctorSchema.index({ domains: 1, rating: -1 });
doctorSchema.index({ specialty: 1 });

export default mongoose.model('Doctor', doctorSchema);

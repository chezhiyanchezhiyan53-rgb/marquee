const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 4000,
    },
    genre: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one genre is required',
      },
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 600,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    posterUrl: {
      type: String,
      required: true,
    },
    bannerUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon'],
      default: 'now_showing',
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

movieSchema.index(
  { title: 'text', description: 'text' },
  { language_override: 'none' }
);
movieSchema.index({ status: 1, releaseDate: -1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });

module.exports = mongoose.model('Movie', movieSchema);

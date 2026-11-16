const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

screenSchema.index({ theatre: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);

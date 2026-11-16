const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
      index: true,
    },
    row: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    seatNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    seatType: {
      type: String,
      enum: ['regular', 'premium', 'recliner'],
      default: 'regular',
    },
  },
  { timestamps: true }
);

// Prevent duplicate seat definitions within the same screen
seatSchema.index({ screen: 1, row: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ screen: 1, seatType: 1 });

module.exports = mongoose.model('Seat', seatSchema);

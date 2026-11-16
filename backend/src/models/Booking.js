const mongoose = require('mongoose');

const selectedSeatSchema = new mongoose.Schema(
  {
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat',
      required: true,
    },
    row: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    seatType: {
      type: String,
      enum: ['regular', 'premium', 'recliner'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seats: {
      type: [selectedSeatSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 8,
        message: 'Booking must include 1–8 seats',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

bookingSchema.index({ bookingReference: 1 }, { unique: true });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

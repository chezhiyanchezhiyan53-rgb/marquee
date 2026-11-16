const mongoose = require('mongoose');

/**
 * Per-show seat inventory.
 * Unique (show, seat) ensures the same seat cannot be confirmed twice for one show.
 * Status: available | reserved | booked
 * Reserved is a short-lived hold during checkout; booked is confirmed.
 */
const showSeatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked'],
      default: 'available',
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    reservedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Critical DBMS constraint: one inventory row per show-seat pair
showSeatSchema.index({ show: 1, seat: 1 }, { unique: true });
showSeatSchema.index({ show: 1, status: 1 });
showSeatSchema.index({ booking: 1 });

module.exports = mongoose.model('ShowSeat', showSeatSchema);

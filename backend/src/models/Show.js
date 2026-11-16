const mongoose = require('mongoose');

const ticketPricesSchema = new mongoose.Schema(
  {
    regular: { type: Number, required: true, min: 0 },
    premium: { type: Number, required: true, min: 0 },
    recliner: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
      index: true,
    },
    showDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'startTime must be HH:MM'],
    },
    ticketPrices: {
      type: ticketPricesSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, showDate: 1, status: 1 });
showSchema.index({ screen: 1, showDate: 1, startTime: 1 });

module.exports = mongoose.model('Show', showSchema);

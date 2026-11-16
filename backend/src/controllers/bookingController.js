const { body } = require('express-validator');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  createBooking,
  cancelBooking,
  simulatePayment,
} = require('../services/bookingService');

const createValidators = [
  body('showId').isMongoId().withMessage('Valid showId required'),
  body('seatIds')
    .isArray({ min: 1, max: 8 })
    .withMessage('seatIds must be an array of 1–8 seat IDs'),
  body('seatIds.*').isMongoId().withMessage('Each seatId must be a valid ID'),
];

const create = asyncHandler(async (req, res) => {
  const { showId, seatIds } = req.body;
  const booking = await createBooking({
    userId: req.user._id,
    showId,
    seatIds,
  });

  res.status(201).json({
    success: true,
    message: 'Booking created. Complete demo payment to confirm payment status.',
    data: { booking },
  });
});

const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: 'show',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { bookings } });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: 'show',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    })
    .populate('user', 'name email');

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  const isOwner = String(booking.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }

  res.json({ success: true, data: { booking } });
});

const cancel = asyncHandler(async (req, res) => {
  const booking = await cancelBooking(req.params.id, req.user, {
    isAdmin: req.user.role === 'admin',
  });

  res.json({
    success: true,
    message: 'Booking cancelled. Seats released.',
    data: { booking },
  });
});

const pay = asyncHandler(async (req, res) => {
  const booking = await simulatePayment(req.params.id, req.user);
  res.json({
    success: true,
    message: 'Demo payment successful',
    data: { booking },
  });
});

module.exports = {
  create,
  myBookings,
  getBooking,
  cancel,
  pay,
  createValidators,
};

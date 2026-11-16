const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const ShowSeat = require('../models/ShowSeat');
const AppError = require('../utils/AppError');
const { generateBookingReference } = require('../utils/bookingRef');
const { supportsTransactions } = require('../config/db');

const MAX_SEATS = 8;

/**
 * Atomically create a booking with seat inventory reservation.
 *
 * Strategy:
 * 1. If MongoDB supports transactions (replica set / Atlas), use a multi-doc transaction.
 * 2. Otherwise fall back to atomic findOneAndUpdate + unique (show, seat) index.
 *    Partial failures release any seats already reserved for this attempt.
 */
async function createBooking({ userId, showId, seatIds }) {
  if (!Array.isArray(seatIds) || seatIds.length < 1 || seatIds.length > MAX_SEATS) {
    throw new AppError(`Select between 1 and ${MAX_SEATS} seats`, 400);
  }

  const uniqueSeatIds = [...new Set(seatIds.map(String))];
  if (uniqueSeatIds.length !== seatIds.length) {
    throw new AppError('Duplicate seats in request', 400);
  }

  const show = await Show.findById(showId).populate({
    path: 'screen',
    populate: { path: 'theatre' },
  });

  if (!show || show.status !== 'scheduled') {
    throw new AppError('Show not available for booking', 404);
  }

  const seats = await Seat.find({
    _id: { $in: uniqueSeatIds },
    screen: show.screen._id,
  });

  if (seats.length !== uniqueSeatIds.length) {
    throw new AppError('One or more seats are invalid for this show', 400);
  }

  const seatMap = new Map(seats.map((s) => [String(s._id), s]));
  const selectedSeats = uniqueSeatIds.map((id) => {
    const seat = seatMap.get(String(id));
    const price = show.ticketPrices[seat.seatType];
    if (price == null) {
      throw new AppError(`No price configured for seat type: ${seat.seatType}`, 500);
    }
    return {
      seat: seat._id,
      row: seat.row,
      seatNumber: seat.seatNumber,
      seatType: seat.seatType,
      price,
    };
  });

  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const bookingReference = generateBookingReference();

  if (supportsTransactions()) {
    return createBookingWithTransaction({
      userId,
      show,
      uniqueSeatIds,
      selectedSeats,
      totalAmount,
      bookingReference,
    });
  }

  return createBookingWithAtomicFallback({
    userId,
    show,
    uniqueSeatIds,
    selectedSeats,
    totalAmount,
    bookingReference,
  });
}

async function createBookingWithTransaction({
  userId,
  show,
  uniqueSeatIds,
  selectedSeats,
  totalAmount,
  bookingReference,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Expire stale reservations for these seats
    await ShowSeat.updateMany(
      {
        show: show._id,
        seat: { $in: uniqueSeatIds },
        status: 'reserved',
        reservedUntil: { $lt: new Date() },
      },
      { $set: { status: 'available', reservedUntil: null, booking: null } },
      { session }
    );

    const now = new Date();
    const reservedUntil = new Date(now.getTime() + 10 * 60 * 1000);

    // Atomically claim available seats
    const claimResult = await ShowSeat.updateMany(
      {
        show: show._id,
        seat: { $in: uniqueSeatIds },
        status: 'available',
      },
      {
        $set: {
          status: 'reserved',
          reservedUntil,
        },
      },
      { session }
    );

    if (claimResult.modifiedCount !== uniqueSeatIds.length) {
      throw new AppError(
        'One or more selected seats are no longer available. Please choose different seats.',
        409
      );
    }

    const [booking] = await Booking.create(
      [
        {
          bookingReference,
          user: userId,
          show: show._id,
          seats: selectedSeats,
          totalAmount,
          bookingStatus: 'confirmed',
          paymentStatus: 'pending',
        },
      ],
      { session }
    );

    await ShowSeat.updateMany(
      {
        show: show._id,
        seat: { $in: uniqueSeatIds },
        status: 'reserved',
      },
      {
        $set: {
          status: 'booked',
          booking: booking._id,
          reservedUntil: null,
        },
      },
      { session }
    );

    await session.commitTransaction();

    return Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      })
      .populate('user', 'name email');
  } catch (err) {
    await session.abortTransaction();
    if (err instanceof AppError) throw err;
    if (err.code === 11000) {
      throw new AppError(
        'One or more selected seats were just booked by another user.',
        409
      );
    }
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Fallback when transactions are unavailable (standalone MongoDB).
 * Uses sequential atomic updates; rolls back reserved seats on failure.
 * The unique (show, seat) index still prevents double-booking of inventory rows.
 */
async function createBookingWithAtomicFallback({
  userId,
  show,
  uniqueSeatIds,
  selectedSeats,
  totalAmount,
  bookingReference,
}) {
  const claimed = [];

  try {
    // Release expired reservations
    await ShowSeat.updateMany(
      {
        show: show._id,
        seat: { $in: uniqueSeatIds },
        status: 'reserved',
        reservedUntil: { $lt: new Date() },
      },
      { $set: { status: 'available', reservedUntil: null, booking: null } }
    );

    const reservedUntil = new Date(Date.now() + 10 * 60 * 1000);

    for (const seatId of uniqueSeatIds) {
      const updated = await ShowSeat.findOneAndUpdate(
        {
          show: show._id,
          seat: seatId,
          status: 'available',
        },
        {
          $set: {
            status: 'reserved',
            reservedUntil,
          },
        },
        { new: true }
      );

      if (!updated) {
        throw new AppError(
          'One or more selected seats are no longer available. Please choose different seats.',
          409
        );
      }
      claimed.push(updated._id);
    }

    const booking = await Booking.create({
      bookingReference,
      user: userId,
      show: show._id,
      seats: selectedSeats,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
    });

    await ShowSeat.updateMany(
      { _id: { $in: claimed } },
      {
        $set: {
          status: 'booked',
          booking: booking._id,
          reservedUntil: null,
        },
      }
    );

    return Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      })
      .populate('user', 'name email');
  } catch (err) {
    if (claimed.length) {
      await ShowSeat.updateMany(
        { _id: { $in: claimed }, status: { $in: ['reserved', 'booked'] } },
        { $set: { status: 'available', reservedUntil: null, booking: null } }
      );
    }
    if (err instanceof AppError) throw err;
    if (err.code === 11000) {
      throw new AppError(
        'One or more selected seats were just booked by another user.',
        409
      );
    }
    throw err;
  }
}

async function cancelBooking(bookingId, user, { isAdmin = false } = {}) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!isAdmin && String(booking.user) !== String(user._id)) {
    throw new AppError('You can only cancel your own bookings', 403);
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new AppError('Booking is already cancelled', 400);
  }

  const show = await Show.findById(booking.show);
  if (show && show.status === 'completed') {
    throw new AppError('Cannot cancel a booking for a completed show', 400);
  }

  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      booking.bookingStatus = 'cancelled';
      if (booking.paymentStatus === 'paid') {
        booking.paymentStatus = 'refunded';
      }
      await booking.save({ session });

      await ShowSeat.updateMany(
        { booking: booking._id, status: 'booked' },
        {
          $set: {
            status: 'available',
            booking: null,
            reservedUntil: null,
          },
        },
        { session }
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    booking.bookingStatus = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    await ShowSeat.updateMany(
      { booking: booking._id, status: 'booked' },
      {
        $set: {
          status: 'available',
          booking: null,
          reservedUntil: null,
        },
      }
    );
  }

  return Booking.findById(booking._id)
    .populate({
      path: 'show',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    })
    .populate('user', 'name email');
}

async function simulatePayment(bookingId, user) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  if (String(booking.user) !== String(user._id) && user.role !== 'admin') {
    throw new AppError('Unauthorized', 403);
  }
  if (booking.bookingStatus === 'cancelled') {
    throw new AppError('Cannot pay for a cancelled booking', 400);
  }
  if (booking.paymentStatus === 'paid') {
    throw new AppError('Payment already completed', 400);
  }

  // Demo payment — always succeeds for the mini-project
  booking.paymentStatus = 'paid';
  await booking.save();

  return Booking.findById(booking._id)
    .populate({
      path: 'show',
      populate: [
        { path: 'movie' },
        { path: 'screen', populate: { path: 'theatre' } },
      ],
    })
    .populate('user', 'name email');
}

async function getShowSeatAvailability(showId) {
  const show = await Show.findById(showId);
  if (!show) {
    throw new AppError('Show not found', 404);
  }

  // Release expired reservations before returning availability
  await ShowSeat.updateMany(
    {
      show: showId,
      status: 'reserved',
      reservedUntil: { $lt: new Date() },
    },
    { $set: { status: 'available', reservedUntil: null, booking: null } }
  );

  const inventory = await ShowSeat.find({ show: showId })
    .populate('seat')
    .lean();

  return {
    showId,
    seats: inventory.map((item) => ({
      showSeatId: item._id,
      seatId: item.seat._id,
      row: item.seat.row,
      seatNumber: item.seat.seatNumber,
      seatType: item.seat.seatType,
      status: item.status === 'reserved' || item.status === 'booked' ? 'booked' : 'available',
    })),
    ticketPrices: show.ticketPrices,
  };
}

module.exports = {
  createBooking,
  cancelBooking,
  simulatePayment,
  getShowSeatAvailability,
  MAX_SEATS,
};

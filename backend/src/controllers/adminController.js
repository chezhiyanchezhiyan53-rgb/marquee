const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const ShowSeat = require('../models/ShowSeat');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ---------- Movies ----------
const listMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { movies } });
});

const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({ success: true, data: { movie } });
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, data: { movie } });
});

const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new AppError('Movie not found', 404);
  res.json({ success: true, message: 'Movie deleted' });
});

// ---------- Theatres ----------
const listTheatres = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find().sort({ city: 1, name: 1 });
  res.json({ success: true, data: { theatres } });
});

const createTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(req.body);
  res.status(201).json({ success: true, data: { theatre } });
});

const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!theatre) throw new AppError('Theatre not found', 404);
  res.json({ success: true, data: { theatre } });
});

const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findByIdAndDelete(req.params.id);
  if (!theatre) throw new AppError('Theatre not found', 404);
  res.json({ success: true, message: 'Theatre deleted' });
});

// ---------- Screens ----------
const listScreens = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.theatreId) filter.theatre = req.query.theatreId;
  const screens = await Screen.find(filter).populate('theatre').sort({ name: 1 });
  res.json({ success: true, data: { screens } });
});

const createScreen = asyncHandler(async (req, res) => {
  const { theatre, name, totalSeats, seatLayout } = req.body;
  const theatreDoc = await Theatre.findById(theatre);
  if (!theatreDoc) throw new AppError('Theatre not found', 404);

  const screen = await Screen.create({ theatre, name, totalSeats });

  // Optional seat layout: [{ row, count, seatType }]
  if (Array.isArray(seatLayout) && seatLayout.length) {
    const seats = [];
    for (const rowDef of seatLayout) {
      for (let n = 1; n <= rowDef.count; n++) {
        seats.push({
          screen: screen._id,
          row: rowDef.row,
          seatNumber: n,
          seatType: rowDef.seatType || 'regular',
        });
      }
    }
    await Seat.insertMany(seats, { ordered: false });
    screen.totalSeats = seats.length;
    await screen.save();
  }

  res.status(201).json({ success: true, data: { screen } });
});

const updateScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!screen) throw new AppError('Screen not found', 404);
  res.json({ success: true, data: { screen } });
});

const deleteScreen = asyncHandler(async (req, res) => {
  const screen = await Screen.findByIdAndDelete(req.params.id);
  if (!screen) throw new AppError('Screen not found', 404);
  await Seat.deleteMany({ screen: screen._id });
  res.json({ success: true, message: 'Screen and seats deleted' });
});

const listSeats = asyncHandler(async (req, res) => {
  const seats = await Seat.find({ screen: req.params.screenId }).sort({
    row: 1,
    seatNumber: 1,
  });
  res.json({ success: true, data: { seats } });
});

const createSeats = asyncHandler(async (req, res) => {
  const screen = await Screen.findById(req.params.screenId);
  if (!screen) throw new AppError('Screen not found', 404);

  const seatsInput = req.body.seats;
  if (!Array.isArray(seatsInput) || !seatsInput.length) {
    throw new AppError('seats array required', 400);
  }

  const docs = seatsInput.map((s) => ({
    screen: screen._id,
    row: s.row,
    seatNumber: s.seatNumber,
    seatType: s.seatType || 'regular',
  }));

  const seats = await Seat.insertMany(docs, { ordered: false });
  screen.totalSeats = await Seat.countDocuments({ screen: screen._id });
  await screen.save();

  res.status(201).json({ success: true, data: { seats } });
});

// ---------- Shows ----------
async function ensureShowInventory(show) {
  const seats = await Seat.find({ screen: show.screen });
  const inventory = seats.map((seat) => ({
    show: show._id,
    seat: seat._id,
    status: 'available',
  }));
  if (inventory.length) {
    await ShowSeat.insertMany(inventory, { ordered: false });
  }
}

const listShows = asyncHandler(async (req, res) => {
  const shows = await Show.find()
    .populate('movie')
    .populate({ path: 'screen', populate: { path: 'theatre' } })
    .sort({ showDate: -1, startTime: 1 });
  res.json({ success: true, data: { shows } });
});

const createShow = asyncHandler(async (req, res) => {
  const show = await Show.create(req.body);
  await ensureShowInventory(show);
  const populated = await Show.findById(show._id)
    .populate('movie')
    .populate({ path: 'screen', populate: { path: 'theatre' } });
  res.status(201).json({ success: true, data: { show: populated } });
});

const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('movie')
    .populate({ path: 'screen', populate: { path: 'theatre' } });
  if (!show) throw new AppError('Show not found', 404);
  res.json({ success: true, data: { show } });
});

const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findByIdAndDelete(req.params.id);
  if (!show) throw new AppError('Show not found', 404);
  await ShowSeat.deleteMany({ show: show._id });
  res.json({ success: true, message: 'Show and inventory deleted' });
});

// ---------- Bookings & Analytics ----------
const listBookings = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.bookingStatus = req.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie' },
          { path: 'screen', populate: { path: 'theatre' } },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

const analytics = asyncHandler(async (req, res) => {
  const [totals, popularMovies, revenueByDay] = await Promise.all([
    Booking.aggregate([
      {
        $facet: {
          confirmed: [
            { $match: { bookingStatus: 'confirmed' } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                tickets: { $sum: { $size: '$seats' } },
                revenue: {
                  $sum: {
                    $cond: [
                      { $eq: ['$paymentStatus', 'paid'] },
                      '$totalAmount',
                      0,
                    ],
                  },
                },
              },
            },
          ],
          cancelled: [
            { $match: { bookingStatus: 'cancelled' } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showDoc',
        },
      },
      { $unwind: '$showDoc' },
      {
        $lookup: {
          from: 'movies',
          localField: 'showDoc.movie',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $group: {
          _id: '$movie._id',
          title: { $first: '$movie.title' },
          bookings: { $sum: 1 },
          tickets: { $sum: { $size: '$seats' } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
            },
          },
        },
      },
      { $sort: { tickets: -1 } },
      { $limit: 10 },
    ]),
    Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 14 },
    ]),
  ]);

  const confirmed = totals[0]?.confirmed?.[0] || {
    count: 0,
    tickets: 0,
    revenue: 0,
  };
  const cancelled = totals[0]?.cancelled?.[0]?.count || 0;

  res.json({
    success: true,
    data: {
      summary: {
        confirmedBookings: confirmed.count || 0,
        cancelledBookings: cancelled,
        ticketsSold: confirmed.tickets || 0,
        paidRevenue: confirmed.revenue || 0,
      },
      popularMovies,
      revenueByDay,
    },
  });
});

module.exports = {
  listMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  listTheatres,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  listScreens,
  createScreen,
  updateScreen,
  deleteScreen,
  listSeats,
  createSeats,
  listShows,
  createShow,
  updateShow,
  deleteShow,
  listBookings,
  analytics,
};

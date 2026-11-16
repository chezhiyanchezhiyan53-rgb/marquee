const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getShowSeatAvailability } = require('../services/bookingService');

const listShows = asyncHandler(async (req, res) => {
  const { movieId, date, city } = req.query;
  const filter = { status: 'scheduled' };

  if (movieId) filter.movie = movieId;

  if (date) {
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.showDate = { $gte: start, $lt: end };
  }

  let shows = await Show.find(filter)
    .populate('movie')
    .populate({
      path: 'screen',
      populate: { path: 'theatre' },
    })
    .sort({ showDate: 1, startTime: 1 });

  if (city) {
    const cityLower = city.toLowerCase();
    shows = shows.filter(
      (s) =>
        s.screen &&
        s.screen.theatre &&
        s.screen.theatre.city &&
        s.screen.theatre.city.toLowerCase() === cityLower
    );
  }

  res.json({ success: true, data: { shows } });
});

const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie')
    .populate({
      path: 'screen',
      populate: { path: 'theatre' },
    });

  if (!show) {
    throw new AppError('Show not found', 404);
  }

  res.json({ success: true, data: { show } });
});

const getShowSeats = asyncHandler(async (req, res) => {
  const availability = await getShowSeatAvailability(req.params.id);
  res.json({ success: true, data: availability });
});

const listTheatres = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const filter = {};
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  const theatres = await Theatre.find(filter).sort({ city: 1, name: 1 });
  res.json({ success: true, data: { theatres } });
});

module.exports = { listShows, getShow, getShowSeats, listTheatres };

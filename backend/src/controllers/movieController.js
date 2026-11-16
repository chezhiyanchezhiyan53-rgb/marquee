const Movie = require('../models/Movie');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listMovies = asyncHandler(async (req, res) => {
  const {
    status,
    genre,
    search,
    language,
    page = 1,
    limit = 24,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (genre) filter.genre = genre;
  if (language) filter.language = new RegExp(`^${language}$`, 'i');
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 24));
  const skip = (pageNum - 1) * limitNum;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1 }).skip(skip).limit(limitNum),
    Movie.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      movies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }
  res.json({ success: true, data: { movie } });
});

const getGenres = asyncHandler(async (req, res) => {
  const genres = await Movie.distinct('genre');
  res.json({ success: true, data: { genres: genres.sort() } });
});

module.exports = { listMovies, getMovie, getGenres };

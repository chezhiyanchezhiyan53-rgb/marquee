const express = require('express');
const { listMovies, getMovie, getGenres } = require('../controllers/movieController');

const router = express.Router();

router.get('/', listMovies);
router.get('/genres/list', getGenres);
router.get('/:id', getMovie);

module.exports = router;

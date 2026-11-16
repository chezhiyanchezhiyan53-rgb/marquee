const express = require('express');
const {
  listShows,
  getShow,
  getShowSeats,
} = require('../controllers/showController');

const router = express.Router();

router.get('/', listShows);
router.get('/:id/seats', getShowSeats);
router.get('/:id', getShow);

module.exports = router;

const express = require('express');
const {
  create,
  myBookings,
  getBooking,
  cancel,
  pay,
  createValidators,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post('/', createValidators, validate, create);
router.get('/my', myBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancel);
router.post('/:id/pay', pay);

module.exports = router;

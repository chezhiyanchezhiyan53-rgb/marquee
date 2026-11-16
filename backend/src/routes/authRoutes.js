const express = require('express');
const {
  register,
  login,
  logout,
  me,
  registerValidators,
  loginValidators,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerValidators, validate, register);
router.post('/login', loginValidators, validate, login);
router.post('/logout', logout);
router.get('/me', protect, me);

module.exports = router;

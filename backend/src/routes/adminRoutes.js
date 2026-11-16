const express = require('express');
const admin = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

// Movies
router.get('/movies', admin.listMovies);
router.post('/movies', admin.createMovie);
router.put('/movies/:id', admin.updateMovie);
router.delete('/movies/:id', admin.deleteMovie);

// Theatres
router.get('/theatres', admin.listTheatres);
router.post('/theatres', admin.createTheatre);
router.put('/theatres/:id', admin.updateTheatre);
router.delete('/theatres/:id', admin.deleteTheatre);

// Screens
router.get('/screens', admin.listScreens);
router.post('/screens', admin.createScreen);
router.put('/screens/:id', admin.updateScreen);
router.delete('/screens/:id', admin.deleteScreen);
router.get('/screens/:screenId/seats', admin.listSeats);
router.post('/screens/:screenId/seats', admin.createSeats);

// Shows
router.get('/shows', admin.listShows);
router.post('/shows', admin.createShow);
router.put('/shows/:id', admin.updateShow);
router.delete('/shows/:id', admin.deleteShow);

// Bookings & analytics
router.get('/bookings', admin.listBookings);
router.get('/analytics', admin.analytics);

module.exports = router;

/**
 * Basic API tests for CineBook.
 * Requires a running MongoDB and seeded (or empty) database.
 * Run: npm test --prefix backend
 *
 * These tests bootstrap their own Express app + DB connection.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Movie = require('../src/models/Movie');
const Theatre = require('../src/models/Theatre');
const Screen = require('../src/models/Screen');
const Seat = require('../src/models/Seat');
const Show = require('../src/models/Show');
const ShowSeat = require('../src/models/ShowSeat');
const Booking = require('../src/models/Booking');

let app;
let token;
let showId;
let screenId;
let theatreId;
let movieId;
let seatIds = [];
let bookingId;
const testUserEmails = [];

before(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI required for tests');
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_key_cinebook';
  }

  await connectDB(process.env.MONGODB_URI);
  app = createApp();

  // Minimal fixtures in a test-safe namespace via unique emails
  const email = `test_${Date.now()}@cinebook.test`;
  testUserEmails.push(email);
  const hash = await bcrypt.hash('Test@12345', 10);
  const user = await User.create({
    name: 'Test User',
    email,
    passwordHash: hash,
    role: 'user',
  });

  const movie = await Movie.create({
    title: 'Test Film (Demo)',
    description: 'Automated test movie',
    genre: ['Action'],
    language: 'English',
    durationMinutes: 100,
    rating: 7,
    releaseDate: new Date(),
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
    bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1400',
    status: 'now_showing',
    isDemo: true,
  });
  movieId = movie._id;

  const theatre = await Theatre.create({
    name: 'Test Theatre',
    address: '1 Test Road',
    city: 'TestCity',
  });
  theatreId = theatre._id;

  const screen = await Screen.create({
    theatre: theatre._id,
    name: 'Test Screen',
    totalSeats: 4,
  });
  screenId = screen._id;

  const seats = await Seat.insertMany([
    { screen: screen._id, row: 'A', seatNumber: 1, seatType: 'regular' },
    { screen: screen._id, row: 'A', seatNumber: 2, seatType: 'regular' },
    { screen: screen._id, row: 'A', seatNumber: 3, seatType: 'premium' },
    { screen: screen._id, row: 'A', seatNumber: 4, seatType: 'premium' },
  ]);

  const show = await Show.create({
    movie: movie._id,
    screen: screen._id,
    showDate: new Date(),
    startTime: '19:00',
    ticketPrices: { regular: 100, premium: 150, recliner: 200 },
    status: 'scheduled',
  });

  await ShowSeat.insertMany(
    seats.map((s) => ({ show: show._id, seat: s._id, status: 'available' }))
  );

  showId = show._id.toString();
  seatIds = seats.slice(0, 2).map((s) => s._id.toString());

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Test@12345' });

  assert.equal(login.status, 200);
  token = login.body.data.token;
  assert.ok(token);
});

after(async () => {
  try {
    if (showId) {
      await Booking.deleteMany({ show: showId });
      await ShowSeat.deleteMany({ show: showId });
      await Show.deleteOne({ _id: showId });
    }
    if (screenId) {
      await Seat.deleteMany({ screen: screenId });
      await Screen.deleteOne({ _id: screenId });
    }
    if (theatreId) await Theatre.deleteOne({ _id: theatreId });
    if (movieId) await Movie.deleteOne({ _id: movieId });
    if (testUserEmails.length) {
      await User.deleteMany({ email: { $in: testUserEmails } });
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
});

describe('CineBook API', () => {
  it('lists movies', async () => {
    const res = await request(app).get('/api/movies');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.movies));
  });

  it('registers duplicate email fails', async () => {
    const email = `dup_${Date.now()}@cinebook.test`;
    testUserEmails.push(email);
    const first = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User A', email, password: 'secret12' });
    assert.equal(first.status, 201);

    const second = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User B', email, password: 'secret12' });
    assert.equal(second.status, 409);
  });

  it('creates a booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId, seatIds });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.booking.bookingReference);
    bookingId = res.body.data.booking._id;
  });

  it('prevents duplicate seat booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ showId, seatIds });

    assert.equal(res.status, 409);
  });

  it('cancels booking and releases seats', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.booking.bookingStatus, 'cancelled');

    const available = await ShowSeat.countDocuments({
      show: showId,
      seat: { $in: seatIds },
      status: 'available',
    });
    assert.equal(available, 2);
  });
});

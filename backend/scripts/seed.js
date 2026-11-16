/**
 * CineBook Database Seed Script
 * Run: npm run seed (from root or backend)
 *
 * Creates demo movies, theatres, screens, seats, shows, inventory,
 * an admin user, a sample user, and optional sample bookings.
 *
 * All movie data is DEMONSTRATION data for the DBMS mini-project.
 * It does not reflect real cinema schedules or availability.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');

const User = require('../src/models/User');
const Movie = require('../src/models/Movie');
const Theatre = require('../src/models/Theatre');
const Screen = require('../src/models/Screen');
const Seat = require('../src/models/Seat');
const Show = require('../src/models/Show');
const ShowSeat = require('../src/models/ShowSeat');
const Booking = require('../src/models/Booking');

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop';
const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1400&h=500&fit=crop';

const demoMovies = [
  {
    title: 'Neon Horizon (Demo)',
    description:
      'In a neon-lit megacity, a courier discovers a conspiracy that could rewrite reality. Demonstration movie data for CineBook.',
    genre: ['Sci-Fi', 'Action'],
    language: 'English',
    durationMinutes: 132,
    rating: 8.4,
    releaseDate: daysFromNow(-10),
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
  {
    title: 'Monsoon Melody (Demo)',
    description:
      'A classical musician and a street drummer find harmony amid monsoon rains. Demonstration movie data for CineBook.',
    genre: ['Romance', 'Drama'],
    language: 'Hindi',
    durationMinutes: 148,
    rating: 7.9,
    releaseDate: daysFromNow(-5),
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
  {
    title: 'Chennai Express: Recut (Demo)',
    description:
      'A high-speed comedy chase across South India — reimagined for this demo. Demonstration movie data for CineBook.',
    genre: ['Comedy', 'Adventure'],
    language: 'Tamil',
    durationMinutes: 140,
    rating: 7.2,
    releaseDate: daysFromNow(-2),
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    bannerUrl: FALLBACK_BANNER,
    status: 'now_showing',
  },
  {
    title: 'Shadow Protocol (Demo)',
    description:
      'An elite cyber unit races against a zero-day exploit. Demonstration movie data for CineBook.',
    genre: ['Thriller', 'Action'],
    language: 'English',
    durationMinutes: 118,
    rating: 8.1,
    releaseDate: daysFromNow(-7),
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
  {
    title: 'Kitchen Kingdom (Demo)',
    description:
      'Rival chefs battle for the crown in a culinary reality spectacle. Demonstration movie data for CineBook.',
    genre: ['Comedy', 'Family'],
    language: 'English',
    durationMinutes: 105,
    rating: 6.8,
    releaseDate: daysFromNow(-1),
    posterUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
  {
    title: 'Bay of Stars (Demo)',
    description:
      'A coastal town mystery unfolds under a night sky full of secrets. Demonstration movie data for CineBook.',
    genre: ['Mystery', 'Drama'],
    language: 'Malayalam',
    durationMinutes: 155,
    rating: 8.7,
    releaseDate: daysFromNow(-14),
    posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
  {
    title: 'Orbital Drift (Demo)',
    description:
      'Astronauts stranded beyond Mars must invent a way home. Coming soon — demonstration data.',
    genre: ['Sci-Fi', 'Adventure'],
    language: 'English',
    durationMinutes: 160,
    rating: 0,
    releaseDate: daysFromNow(21),
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&h=500&fit=crop',
    status: 'coming_soon',
  },
  {
    title: 'The Last Interval (Demo)',
    description:
      'A theatre troupe stages one final play that blurs fiction and fate. Coming soon — demonstration data.',
    genre: ['Drama', 'Thriller'],
    language: 'Hindi',
    durationMinutes: 135,
    rating: 0,
    releaseDate: daysFromNow(30),
    posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1400&h=500&fit=crop',
    status: 'coming_soon',
  },
  {
    title: 'Pixel Warriors (Demo)',
    description:
      'Gamers are pulled into their favourite arcade world. Demonstration movie data for CineBook.',
    genre: ['Action', 'Adventure', 'Family'],
    language: 'English',
    durationMinutes: 112,
    rating: 7.5,
    releaseDate: daysFromNow(-3),
    posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1400&h=500&fit=crop',
    status: 'now_showing',
  },
];

function daysFromNow(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function buildSeatLayout(screenId) {
  const seats = [];
  // Rows A–D: regular (10 seats)
  for (const row of ['A', 'B', 'C', 'D']) {
    for (let n = 1; n <= 10; n++) {
      seats.push({ screen: screenId, row, seatNumber: n, seatType: 'regular' });
    }
  }
  // Rows E–F: premium (8 seats)
  for (const row of ['E', 'F']) {
    for (let n = 1; n <= 8; n++) {
      seats.push({ screen: screenId, row, seatNumber: n, seatType: 'premium' });
    }
  }
  // Row G: recliner (6 seats)
  for (let n = 1; n <= 6; n++) {
    seats.push({ screen: screenId, row: 'G', seatNumber: n, seatType: 'recliner' });
  }
  return seats;
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await connectDB(process.env.MONGODB_URI);

  console.log('Clearing existing collections...');
  try { await Movie.collection.dropIndexes(); } catch (e) {}
  await Promise.all([
    Booking.deleteMany({}),
    ShowSeat.deleteMany({}),
    Show.deleteMany({}),
    Seat.deleteMany({}),
    Screen.deleteMany({}),
    Theatre.deleteMany({}),
    Movie.deleteMany({}),
    User.deleteMany({}),
  ]);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cinebook.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const adminName = process.env.SEED_ADMIN_NAME || 'CineBook Admin';

  console.log('Creating users...');
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const userHash = await bcrypt.hash('User@12345', 12);

  const [admin, demoUser] = await User.create([
    {
      name: adminName,
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
    },
    {
      name: 'Demo User',
      email: 'user@cinebook.local',
      passwordHash: userHash,
      role: 'user',
    },
  ]);

  console.log('Creating movies (demonstration data)...');
  const movies = await Movie.insertMany(
    demoMovies.map((m) => ({
      ...m,
      posterUrl: m.posterUrl || FALLBACK_POSTER,
      bannerUrl: m.bannerUrl || FALLBACK_BANNER,
      isDemo: true,
    }))
  );

  console.log('Creating theatres...');
  const theatres = await Theatre.insertMany([
    {
      name: 'CineBook Grand Plaza',
      address: '12 MG Road, Near Central Mall',
      city: 'Chennai',
    },
    {
      name: 'CineBook Lakeside Multiplex',
      address: '45 Lake View Avenue',
      city: 'Bengaluru',
    },
    {
      name: 'CineBook Metro Screens',
      address: '88 Cinema Circle, Andheri West',
      city: 'Mumbai',
    },
  ]);

  console.log('Creating screens and seats...');
  const screens = [];
  for (const theatre of theatres) {
    for (const screenName of ['Screen 1', 'Screen 2']) {
      const screen = await Screen.create({
        theatre: theatre._id,
        name: screenName,
        totalSeats: 62,
      });
      const seats = buildSeatLayout(screen._id);
      await Seat.insertMany(seats);
      screen.totalSeats = seats.length;
      await screen.save();
      screens.push(screen);
    }
  }

  console.log('Creating shows and seat inventory...');
  const nowShowing = movies.filter((m) => m.status === 'now_showing');
  const times = ['10:30', '13:45', '17:00', '20:15'];
  const priceSets = [
    { regular: 180, premium: 250, recliner: 350 },
    { regular: 200, premium: 280, recliner: 400 },
    { regular: 150, premium: 220, recliner: 320 },
  ];

  const allSeats = await Seat.find({});
  const seatsByScreen = new Map();
  for (const s of allSeats) {
    const key = s.screen.toString();
    if (!seatsByScreen.has(key)) seatsByScreen.set(key, []);
    seatsByScreen.get(key).push(s);
  }

  const shows = [];
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const showDate = daysFromNow(dayOffset);
    for (let i = 0; i < nowShowing.length; i++) {
      const movie = nowShowing[i];
      const screen = screens[i % screens.length];
      const startTime = times[i % times.length];
      const ticketPrices = priceSets[i % priceSets.length];

      const show = await Show.create({
        movie: movie._id,
        screen: screen._id,
        showDate,
        startTime,
        ticketPrices,
        status: 'scheduled',
      });
      shows.push(show);

      const seats = seatsByScreen.get(screen._id.toString()) || [];
      await ShowSeat.insertMany(
        seats.map((seat) => ({
          show: show._id,
          seat: seat._id,
          status: 'available',
        }))
      );
    }
  }

  console.log('Creating a sample booking...');
  const sampleShow = shows[0];
  const availableSeats = await ShowSeat.find({ show: sampleShow._id, status: 'available' })
    .populate('seat')
    .limit(2);

  if (availableSeats.length === 2) {
    const selected = availableSeats.map((ss) => ({
      seat: ss.seat._id,
      row: ss.seat.row,
      seatNumber: ss.seat.seatNumber,
      seatType: ss.seat.seatType,
      price: sampleShow.ticketPrices[ss.seat.seatType],
    }));
    const totalAmount = selected.reduce((s, x) => s + x.price, 0);

    const booking = await Booking.create({
      bookingReference: 'CB-SEED0001',
      user: demoUser._id,
      show: sampleShow._id,
      seats: selected,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });

    await ShowSeat.updateMany(
      { _id: { $in: availableSeats.map((s) => s._id) } },
      { $set: { status: 'booked', booking: booking._id } }
    );
  }

  console.log('\n========== Seed Complete ==========');
  console.log(`Movies:     ${movies.length}`);
  console.log(`Theatres:   ${theatres.length}`);
  console.log(`Screens:    ${screens.length}`);
  console.log(`Shows:      ${shows.length}`);
  console.log(`Admin:      ${adminEmail} / ${adminPassword}`);
  console.log('Demo user:  user@cinebook.local / User@12345');
  console.log('Note: All movie titles are labelled (Demo) — demonstration data only.');
  console.log('===================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('\nSeed failed:', err.message || err);
  console.error('\nNext steps:');
  console.error('  1. Start local MongoDB, OR');
  console.error('  2. Put a MongoDB Atlas URI in .env as MONGODB_URI');
  console.error('     (copy from .env.example and replace the placeholder)\n');
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});

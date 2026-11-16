/**
 * CineBook — Useful MongoDB Queries & Aggregation Pipelines
 * ===========================================================
 * For DBMS viva / demonstration. Run inside mongosh against the cinebook DB,
 * or adapt these pipelines in Node using Model.aggregate(...).
 *
 * Note: Collection names are Mongoose plurals (movies, theatres, screens,
 * seats, shows, showseats, bookings, users).
 */

/*
// 1) Text movies by title (uses text index when available)
db.movies.find({ $text: { $search: "Neon" } })

// 2) List now-showing movies sorted by rating
db.movies.find({ status: "now_showing" }).sort({ rating: -1 })

// 3) Shows for a movie on a given date
db.shows.find({
  movie: ObjectId("MOVIE_ID"),
  showDate: { $gte: ISODate("2026-10-29"), $lt: ISODate("2026-10-30") },
  status: "scheduled"
})

// 4) Seat inventory for a show (availability)
db.showseats.aggregate([
  { $match: { show: ObjectId("SHOW_ID") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// 5) Booking history for a user
db.bookings.find({ user: ObjectId("USER_ID") }).sort({ createdAt: -1 })

// 6) Total confirmed bookings, tickets, and paid revenue
db.bookings.aggregate([
  { $match: { bookingStatus: "confirmed" } },
  {
    $group: {
      _id: null,
      bookings: { $sum: 1 },
      tickets: { $sum: { $size: "$seats" } },
      paidRevenue: {
        $sum: {
          $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
        }
      }
    }
  }
])

// 7) Popular movies by tickets sold
db.bookings.aggregate([
  { $match: { bookingStatus: "confirmed" } },
  {
    $lookup: {
      from: "shows",
      localField: "show",
      foreignField: "_id",
      as: "showDoc"
    }
  },
  { $unwind: "$showDoc" },
  {
    $lookup: {
      from: "movies",
      localField: "showDoc.movie",
      foreignField: "_id",
      as: "movie"
    }
  },
  { $unwind: "$movie" },
  {
    $group: {
      _id: "$movie._id",
      title: { $first: "$movie.title" },
      tickets: { $sum: { $size: "$seats" } },
      bookings: { $sum: 1 }
    }
  },
  { $sort: { tickets: -1 } },
  { $limit: 10 }
])

// 8) Revenue by day (last 14 days conceptually — filter as needed)
db.bookings.aggregate([
  { $match: { bookingStatus: "confirmed", paymentStatus: "paid" } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      revenue: { $sum: "$totalAmount" },
      bookings: { $sum: 1 }
    }
  },
  { $sort: { _id: -1 } }
])

// 9) One-to-many: theatres → screens
db.screens.aggregate([
  {
    $lookup: {
      from: "theatres",
      localField: "theatre",
      foreignField: "_id",
      as: "theatre"
    }
  },
  { $unwind: "$theatre" },
  {
    $group: {
      _id: "$theatre.name",
      screens: { $push: "$name" },
      totalSeats: { $sum: "$totalSeats" }
    }
  }
])

// 10) Prove unique show-seat constraint (should fail on second insert)
// db.showseats.insertOne({ show: ObjectId("SHOW_ID"), seat: ObjectId("SEAT_ID"), status: "available" })
*/

console.log('Open backend/scripts/demo-queries.js for mongosh aggregation examples.');
console.log('These pipelines demonstrate search, joins, revenue, and inventory analytics.');

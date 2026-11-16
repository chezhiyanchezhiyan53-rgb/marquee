# CineBook — MongoDB Demonstration Queries

Use these in **mongosh** against the `cinebook` database for your DBMS viva.

```js
use cinebook
```

## 1. Movie search (text / regex)

```js
db.movies.find({ title: /Neon/i })
db.movies.find({ status: "now_showing" }).sort({ rating: -1 })
db.movies.find({ genre: "Action" })
```

## 2. One-to-many: Theatre → Screens

```js
db.screens.aggregate([
  { $lookup: { from: "theatres", localField: "theatre", foreignField: "_id", as: "theatre" } },
  { $unwind: "$theatre" },
  { $group: { _id: "$theatre.name", screens: { $push: "$name" }, seats: { $sum: "$totalSeats" } } }
])
```

## 3. Showtimes for a movie on a date

```js
const movie = db.movies.findOne({ title: /Neon Horizon/ })
db.shows.find({
  movie: movie._id,
  status: "scheduled",
  showDate: {
    $gte: ISODate("2026-10-29T00:00:00.000Z"),
    $lt: ISODate("2026-10-30T00:00:00.000Z")
  }
})
```

## 4. Seat inventory for a show

```js
const show = db.shows.findOne({ status: "scheduled" })
db.showseats.aggregate([
  { $match: { show: show._id } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## 5. Unique constraint demo (double booking prevention)

```js
// ShowSeat has unique index on { show: 1, seat: 1 }
// Inserting the same pair twice must fail with E11000
```

## 6. User booking history

```js
const user = db.users.findOne({ email: "user@cinebook.local" })
db.bookings.find({ user: user._id }).sort({ createdAt: -1 })
```

## 7. Total bookings & paid revenue

```js
db.bookings.aggregate([
  { $match: { bookingStatus: "confirmed" } },
  {
    $group: {
      _id: null,
      bookings: { $sum: 1 },
      tickets: { $sum: { $size: "$seats" } },
      paidRevenue: {
        $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] }
      }
    }
  }
])
```

## 8. Popular movies

```js
db.bookings.aggregate([
  { $match: { bookingStatus: "confirmed" } },
  { $lookup: { from: "shows", localField: "show", foreignField: "_id", as: "showDoc" } },
  { $unwind: "$showDoc" },
  { $lookup: { from: "movies", localField: "showDoc.movie", foreignField: "_id", as: "movie" } },
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
```

## 9. Indexes to inspect

```js
db.movies.getIndexes()
db.seats.getIndexes()
db.showseats.getIndexes()
db.bookings.getIndexes()
```

Look for:

- `showseats`: unique `{ show: 1, seat: 1 }`
- `seats`: unique `{ screen: 1, row: 1, seatNumber: 1 }`
- `users`: unique `email`
- `bookings`: unique `bookingReference`

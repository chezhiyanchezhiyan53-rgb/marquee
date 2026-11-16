# CineBook — Online Movie Ticketing System

**Your Movies. Your Seats. Your Experience.**

A complete DBMS mini-project: Node.js + Express + MongoDB (Mongoose) backend with a modern cinematic HTML/CSS/JS frontend.

> All movie titles, posters, and showtimes in the seed data are **demonstration data** for academic use. They are not live cinema feeds.

---

## Features

- Browse Now Showing / Coming Soon with search and genre filters
- Movie details with theatre showtimes
- Interactive seat map (available / selected / booked)
- Atomic seat booking with unique `(show, seat)` inventory constraint
- Demo payment flow (no real payment gateway)
- My Bookings + cancellation (releases seats)
- Admin dashboard (movies, theatres, screens, shows, bookings, analytics)
- JWT + httpOnly cookie auth; bcrypt password hashing; admin authorization on API routes

---

## Project Structure

```
cinebook/
  frontend/          # Static HTML/CSS/JS (served by Express)
  backend/
    src/
      config/        # DB connection + transaction detection
      models/        # Mongoose schemas
      routes/
      controllers/
      middleware/
      services/      # Booking logic (transactions + atomic fallback)
      utils/
    scripts/
      seed.js        # Demo data seeder
      demo-queries.js
    tests/
    server.js
  .env.example
  package.json
  README.md
```

---

## Prerequisites

- Node.js 18+
- MongoDB either:
  - **MongoDB Atlas** (recommended — transactions supported), or
  - **Local MongoDB**

### Important: MongoDB transactions

Multi-document transactions require a **replica set** or **sharded cluster**.

| Deployment | Transactions |
|---|---|
| MongoDB Atlas | Supported |
| Local replica set | Supported |
| Local standalone (`mongod` default) | **Not supported** |

CineBook detects this at startup and:

- Uses **transactions** when available
- Falls back to **atomic `findOneAndUpdate` + unique index** on standalone MongoDB

You will see one of these logs on startup:

```
Transactions: SUPPORTED (replica set / Atlas)
Transactions: NOT SUPPORTED on this deployment (standalone). Booking uses atomic unique-index fallback.
```

The unique index on `ShowSeat (show, seat)` still prevents double-booking either way.

---

## Setup

### 1. Clone / open the project

```bash
cd dbms
```

### 2. Configure environment

```bash
copy .env.example .env
```

Edit `.env`:

**Atlas example:**

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/cinebook?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string
PORT=5000
```

**Local MongoDB example:**

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cinebook
JWT_SECRET=replace_with_a_long_random_string
PORT=5000
```

### 3. Install dependencies

```bash
npm run install:all
```

### 4. Seed demonstration data

```bash
npm run seed
```

Creates:

- 9 demo movies (labelled Demo)
- 3 theatres, multiple screens, seat layouts
- Shows across several days
- Admin + demo user accounts
- One sample paid booking

Default credentials (from seed / `.env`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinebook.local` | `Admin@12345` |
| User | `user@cinebook.local` | `User@12345` |

### 5. Start the server

```bash
npm run dev
```

Open **http://localhost:5000**

API health: **http://localhost:5000/api/health**

---

## Scripts

| Command | Description |
|---|---|
| `npm run install:all` | Install backend dependencies |
| `npm run seed` | Seed MongoDB with demo data |
| `npm run dev` | Start API + frontend with nodemon |
| `npm start` | Start in production mode |
| `npm test` | Run API tests |

---

## API Overview

### Public
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/theatres`
- `GET /api/shows?movieId=&date=&city=`
- `GET /api/shows/:id/seats`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Bookings (authenticated)
- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`
- `POST /api/bookings/:id/pay` (demo payment)

### Admin (role = admin)
- CRUD `/api/admin/movies`
- CRUD `/api/admin/theatres`
- CRUD `/api/admin/screens`
- CRUD `/api/admin/shows`
- `GET /api/admin/bookings`
- `GET /api/admin/analytics`

---

## Database Design (DBMS highlights)

Collections: `users`, `movies`, `theatres`, `screens`, `seats`, `shows`, `showseats`, `bookings`

Key constraints:

- Unique email on users
- Unique `(screen, row, seatNumber)` on seats
- Unique `(show, seat)` on **showseats** inventory (prevents double booking)
- Unique `bookingReference`
- Indexes for movie search, show lookup, booking history

Booking flow:

1. Load seat availability for a show  
2. User selects seats (max 8)  
3. Server validates show + seats and prices on the server  
4. Atomically reserves inventory rows  
5. Creates booking document  
6. Marks inventory as booked  
7. Cancel releases inventory again  

See `backend/scripts/demo-queries.js` for aggregation examples (revenue, popular movies, joins).

---

## Optional: Local replica set (for real transactions)

```bash
# Example one-node replica set
mongod --replSet rs0 --port 27017
# Then in mongosh:
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
```

Use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/cinebook?replicaSet=rs0
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Server fails to start | Check `MONGODB_URI` and that MongoDB/Atlas is reachable |
| Seed fails | Ensure `.env` exists and URI is correct |
| 401 on booking | Log in first |
| 403 on `/admin` | Use the seeded admin account |
| Seat already booked | Another user claimed it — pick different seats |
| Transactions warning | Expected on standalone MongoDB; fallback is active |

---

## License

MIT — academic / demonstration use.

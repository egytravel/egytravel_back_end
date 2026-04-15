# EgyTravel Backend — Project Context
> Single source of truth for all developers and Kiro instances.
> Read this fully before making any changes.
> Last updated: Heroku deployment + PostgreSQL migration complete

---

## Live URLs

- **API (Production):** `https://egy-travel-89eca3b6683d.herokuapp.com`
- **GitHub:** `https://github.com/egytravel/egytravel_back_end`
- **Flutter App:** `https://github.com/egytravel/egytravel_flutter`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 4 |
| Database | PostgreSQL (Heroku) |
| ORM | Sequelize 6 |
| Secondary DB | MongoDB (Mongoose) — optional, future use |
| Auth | JWT (365d expiry) |
| Password hashing | bcrypt (12 rounds) |
| Caching | node-cache (in-memory) |
| Logging | Winston |
| Hosting | Heroku (app + database, same account) |
| External APIs | Amadeus (flights + hotels), OpenTripMap (places), Wikipedia (descriptions) |
| AI Model | Groq LLM + custom RAG system (separate service, not in this repo) |

---

## Setup (New Developer)

```bash
git clone https://github.com/egytravel/egytravel_back_end.git
cd egytravel_back_end
npm install
# Create .env file with credentials (get from team lead)
npm run dev
```

### .env contents (share privately, never commit)

```env
DATABASE_URL=postgres://ubvl25ekkpha43:p3b45811c71b4bfc7d3695dbaa2d42da5a752b61a2c50c2ce02eebac629c95d78@c67hs3bvvl3st5.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/df6ljigg8c34hd

JWT_SECRET=egytravel-super-secret-jwt-key-2025
JWT_EXPIRES_IN=365d

PORT=3000
NODE_ENV=development

BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

LOG_LEVEL=info

OPENTRIPMAP_API_KEY=5ae2e3f221c38a28845f05b6ab9e86b8f36265dcef309c0a2aa3098a

AMADEUS_API_KEY=2L0yGBuUmDxdl5b2344z2uja01UulaHZ
AMADEUS_API_SECRET=aHSM0o1Kem3AA0De
AMADEUS_API_BASE_URL=https://test.api.amadeus.com

API_TIMEOUT=30000
API_RETRY_ATTEMPTS=2
API_RETRY_DELAY=1000

CACHE_TTL_SEARCH=3600
CACHE_TTL_HOTEL=7200
CACHE_TTL_LOCATION=86400
```

### If port 3000 is in use (Windows)
```
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Project Structure

```
EgyTravel/
├── server.js                    # Entry point — registers all routes
├── Procfile                     # Heroku process definition
├── package.json
├── .env                         # Local secrets (NOT committed to git)
├── .env.example                 # Template for env vars
├── PROJECT_CONTEXT.md           # This file
├── src/
│   ├── config/
│   │   ├── database.js          # Auto-detects PostgreSQL (DATABASE_URL) or MySQL
│   │   ├── mongodb.js           # Mongoose connection (optional)
│   │   ├── amadeus.js           # Amadeus API config
│   │   └── jwt.js               # JWT config
│   ├── controllers/
│   │   ├── homeController.js    # Homescreen + destinations + map + OpenTripMap + Wikipedia
│   │   ├── exploreController.js # Explore screen (places/restaurants/hotels/flights/map/search)
│   │   ├── hotelController.js   # Hotel search + details (Amadeus)
│   │   ├── flightController.js  # Flight search + pricing + locations (Amadeus)
│   │   ├── bookingController.js # Booking CRUD
│   │   ├── favoriteController.js# Favorites CRUD
│   │   ├── tripController.js    # Trip CRUD (built, NOT yet wired in server.js)
│   │   └── userController.js    # User profile management
│   ├── data/
│   │   ├── destinations.js      # Curated Egyptian destinations (static, with lat/lng)
│   │   └── exploreData.js       # Curated places, restaurants, hotels, flight routes
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── roleAuth.js          # Role-based access control
│   │   └── validation.js        # Input validation (express-validator)
│   ├── migrations/              # Database migration scripts
│   ├── models/sql/
│   │   ├── index.js             # Model associations + syncDatabase()
│   │   ├── User.js
│   │   ├── PasswordResetToken.js
│   │   ├── Booking.js
│   │   ├── Favorite.js
│   │   └── Trip.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── home.js
│   │   ├── explore.js
│   │   ├── hotels.js
│   │   ├── flights.js
│   │   ├── bookings.js
│   │   ├── favorites.js
│   │   └── trips.js             # Exists but NOT registered in server.js yet
│   ├── services/
│   │   ├── authService.js
│   │   ├── jwtService.js
│   │   ├── amadeusService.js
│   │   ├── openTripMapService.js
│   │   ├── wikipediaService.js
│   │   └── cacheService.js
│   └── utils/
│       ├── logger.js
│       ├── validators.js
│       ├── affiliateLink.js
│       └── cityCodes.js
```

---

## API Response Format

### Success
```json
{ "success": true, "data": { ... } }
```

### Auth endpoints
```json
{ "code": 200, "message": "LOGIN SUCCESSFUL", "data": { "token": "...", "user_id": 1, "name": "Ahmed", "email": "...", "role": "user" } }
```

### Error
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

### Auth header (protected routes)
```
Authorization: Bearer <jwt_token>
```

---

## Complete API Reference

Base URL (prod): `https://egy-travel-89eca3b6683d.herokuapp.com`
Base URL (local): `http://localhost:3000`

---

### Health
```
GET /health
GET /
```

---

### Auth — /api/auth

| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | None | `{name, email, password, role?}` |
| POST | `/api/auth/login` | None | `{email, password}` |
| POST | `/api/auth/logout` | Bearer | — |
| POST | `/api/auth/refresh` | None | `{refreshToken}` |
| POST | `/api/auth/forgot-password` | None | `{email}` |
| POST | `/api/auth/reset-password` | None | `{token, password}` |
| GET | `/api/auth/me` | Bearer | — |

---

### Users — /api/users

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/users/profile` | Bearer |
| PUT | `/api/users/profile` | Bearer |
| POST | `/api/users/change-password` | Bearer |
| GET | `/api/users/admin/users` | Bearer + Admin |
| PUT | `/api/users/admin/users/:userId/role` | Bearer + Admin |
| DELETE | `/api/users/admin/users/:userId` | Bearer + Admin |

---

### Homescreen — /api/home (all public)

| Endpoint | Query Params | Description |
|---|---|---|
| `GET /api/home` | — | Full homescreen (featured + popular + cities) |
| `GET /api/home/search` | `q` | Search curated destinations |
| `GET /api/home/destinations` | `category`, `city`, `featured`, `popular` | All destinations |
| `GET /api/home/destinations/:id` | — | Detail + Wikipedia enrichment |
| `GET /api/home/cities` | — | City cards |
| `GET /api/home/map/markers` | `category?`, `city?` | Map pins |
| `GET /api/home/map/search` | `q`, `category?`, `city?` | Search + mapView camera |
| `GET /api/home/places/search` | `q` | Live OpenTripMap search |
| `GET /api/home/places/city/:cityId` | `limit?` | Real city attractions |
| `GET /api/home/places/:xid` | — | Real place detail + Wikipedia |

cityId values: `cairo`, `luxor`, `aswan`, `sharm-el-sheikh`, `hurghada`, `alexandria`, `dahab`, `siwa`

---

### Explore Screen — /api/explore (all public)

| Endpoint | Query Params | Description |
|---|---|---|
| `GET /api/explore` | — | Full explore screen payload |
| `GET /api/explore/places` | `category?`, `limit?` | Places by category |
| `GET /api/explore/places/:id` | — | Single place detail |
| `GET /api/explore/restaurants` | `city?`, `category?`, `limit?` | Restaurants |
| `GET /api/explore/restaurants/:id` | — | Single restaurant |
| `GET /api/explore/hotels` | `city?`, `category?` | Curated hotels |
| `GET /api/explore/flights` | — | Popular Egyptian routes |
| `GET /api/explore/map` | `type?` (places/restaurants/hotels/all) | Map pins |
| `GET /api/explore/search` | `q`, `type?` | Search across all types |

Place categories: `Recent`, `Historical`, `Beaches`, `Religious`, `Entertainment`, `Nature & Adventure`

---

### Hotels — /api/hotels (public, Amadeus)

| Endpoint | Query Params |
|---|---|
| `GET /api/hotels/search` | `location`* (IATA), `checkin`* (YYYY-MM-DD), `checkout`, `guests`, `rooms` |
| `GET /api/hotels/:hotelId` | `checkin`, `checkout`, `guests`, `rooms` |

IATA codes: `CAI`, `LXR`, `ASW`, `SSH`, `HRG`, `ALY`

---

### Flights — /api/flights (public, Amadeus)

| Endpoint | Params |
|---|---|
| `GET /api/flights/search` | `origin`*, `destination`*, `departureDate`*, `returnDate?`, `adults?`, `travelClass?` |
| `POST /api/flights/price` | body: `{flightOffer}` |
| `GET /api/flights/locations` | `keyword` |

travelClass: `ECONOMY`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST`

---

### Bookings — /api/bookings (Bearer required)

| Method | Endpoint | Body/Query |
|---|---|---|
| POST | `/api/bookings/hotel` | `{hotelId, hotelName, hotelLocation, checkinDate, checkoutDate, guests, rooms, tripId?, totalPrice, currency}` |
| GET | `/api/bookings` | `?tripId=&status=&type=` |
| GET | `/api/bookings/:bookingId` | — |
| PUT | `/api/bookings/:bookingId` | `{status?, bookingReference?, notes?}` |
| DELETE | `/api/bookings/:bookingId` | — |

status: `pending`, `confirmed`, `cancelled`, `completed`

---

### Favorites — /api/favorites (Bearer required)

| Method | Endpoint | Body/Query |
|---|---|---|
| POST | `/api/favorites/hotel` | `{hotelId, hotelName, location, imageUrl, priceData, description?, notes?, tags?}` |
| GET | `/api/favorites` | `?type=hotel` |
| DELETE | `/api/favorites/:favoriteId` | — |

---

## Database (PostgreSQL on Heroku)

### Connection
```
Host: c67hs3bvvl3st5.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com
Port: 5432
Database: df6ljigg8c34hd
User: ubvl25ekkpha43
SSL: required
```
Use `DATABASE_URL` in `.env` — Sequelize handles the rest automatically.

### Tables
- `users` — user accounts
- `bookings` — hotel + flight booking records
- `favorites` — user wishlists
- `trips` — trip plans
- `password_reset_tokens` — password reset flow

Tables are auto-created by Sequelize `sync()` on server startup.

---

## Caching (node-cache, resets on restart)

| Data | TTL |
|---|---|
| Hotel search | 1 hour |
| Hotel details | 2 hours |
| Location data | 24 hours |
| OpenTripMap results | 1 hour |
| Wikipedia summaries | 24 hours |

---

## External APIs

| Service | Purpose | Key location |
|---|---|---|
| Amadeus | Flights + hotels (TEST env) | `.env` AMADEUS_* |
| OpenTripMap | Tourist places (1000 req/day free) | `.env` OPENTRIPMAP_API_KEY |
| Wikipedia REST | Descriptions + images (free, no key) | No key needed |
| Groq | AI trip planner (not integrated yet) | TBD |

---

## Flutter Screen → API Mapping

| Screen | API | Status |
|---|---|---|
| Splash / Onboarding | None | Static |
| Login | `POST /api/auth/login` | ✅ Done |
| Register | `POST /api/auth/register` | ✅ Done |
| Forgot Password | `POST /api/auth/forgot-password` | ✅ Done |
| Home | `GET /api/home` | ✅ Done |
| Home Detail | `GET /api/home/destinations/:id` | ✅ Done |
| Explore | `GET /api/explore` | ✅ Done |
| Explore Places (category) | `GET /api/explore/places?category=` | ✅ Done |
| Explore Map | `GET /api/explore/map` | ✅ Done |
| Explore Search | `GET /api/explore/search?q=` | ✅ Done |
| Hotel Search | `GET /api/hotels/search` | ✅ Done |
| Hotel Detail | `GET /api/hotels/:hotelId` | ✅ Done |
| Flight Search | `GET /api/flights/search` | ✅ Done |
| Bookings Screen | `GET /api/bookings` | ✅ Done |
| Create Booking | `POST /api/bookings/hotel` | ✅ Done |
| Favorites | `GET /api/favorites` | ✅ Done |
| Profile | `GET /api/users/profile` | ✅ Done |
| Trips (profile screen) | `GET/POST/PUT/DELETE /api/trips` | ❌ Controller built, routes not wired |
| Reviews (detail screen) | `GET/POST /api/reviews/:placeId` | ❌ Not built |
| Notifications | `GET /api/notifications` | ❌ Not built |
| AI Trip Planner | `POST /api/plans/generate` | ❌ Not built |
| AI Chat | `POST /api/chat` | ❌ Not built |
| Guide Trip | `POST /api/guides` | ❌ Not built |

---

## What's Left To Build (Priority Order)

### 1. Wire Trips API (quick — controller exists)
- Register `src/routes/trips.js` in `server.js`
- Endpoints: `GET/POST/PUT/DELETE /api/trips`

### 2. Reviews API
- New model: `Review` (placeId, userId, rating, comment, date)
- `GET /api/reviews/:placeId` — get reviews for a place
- `POST /api/reviews/:placeId` — add review (Bearer required)

### 3. Notifications API
- New model: `Notification` (userId, title, message, type, isRead)
- `GET /api/notifications` — get user notifications
- `PUT /api/notifications/:id/read` — mark as read
- `PUT /api/notifications/read-all` — mark all as read
- Types: `booking`, `update`, `promotion`, `alert`

### 4. AI Chat endpoint
- `POST /api/chat` — send message, get AI response
- Connect to Groq API
- Body: `{message, conversationHistory?}`

### 5. AI Trip Planner endpoint
- `POST /api/plans/generate` — generate full trip plan
- Connect to ML team's Groq RAG system
- Body: `{destination, startDate, endDate, budget, interests[]}`
- Response includes day-by-day plan with lat/lng for map

### 6. Flight bookings
- `POST /api/bookings/flight` — save flight booking record

### 7. Favorites for places/restaurants
- `POST /api/favorites/place` — currently only hotels supported

### 8. OpenTripMap data seeder
- One-time script to pull all Egyptian places into the database
- For AI model's knowledge base

---

## Deployment

### Heroku
```bash
git push heroku main    # deploy to production
```

### Heroku CLI (full path on Windows)
```
& "C:\Program Files\heroku\bin\heroku.cmd" <command> --app egy-travel
```

### View logs
```
& "C:\Program Files\heroku\bin\heroku.cmd" logs --tail --app egy-travel
```

---

## Git Workflow

```bash
# Start a feature
git checkout -b feature/notifications-api

# Commit and push
git add -A
git commit -m "Add notifications controller and routes"
git push origin feature/notifications-api

# Merge to main when done
git checkout main
git merge feature/notifications-api
git push origin main
git push heroku main
```

Never commit `.env`. Never push directly to `main` without testing.

---

## Known Issues

1. `bookingcomService.js` exists but is not used — Booking.com dropped
2. Amadeus is on TEST environment — data is fake, no real bookings
3. MongoDB connected but no models use it yet
4. `tripController.js` built but `trips.js` route not registered in `server.js`
5. Wikipedia enrichment fails silently — returns original data if no page found
6. Railway subscription cancelled — old DB_HOST/DB_PORT vars in `.env` are obsolete

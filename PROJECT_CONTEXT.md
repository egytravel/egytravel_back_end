# EgyTravel Backend — Project Context
> This file is the single source of truth for any developer or Kiro instance joining this project.
> Read this fully before making any changes.
> Last updated: after Explore screen APIs added

---

## Project Overview

EgyTravel is an Egyptian tourism platform with:
- Flutter mobile app (`https://github.com/egytravel/egytravel_flutter`)
- Web frontend (React — separate repo)
- This Node.js/Express backend (`https://github.com/egytravel/egytravel_back_end`)
- A separate ML team's RAG-based AI planner (Groq LLM + custom RAG + filtration)

The backend serves both Flutter and web via REST APIs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 16 |
| Framework | Express 4 |
| Primary DB | MySQL (via Sequelize ORM) |
| Secondary DB | MongoDB (via Mongoose) — optional, future use |
| Auth | JWT (access token, 365d expiry) |
| Password hashing | bcrypt (12 rounds) |
| Caching | node-cache (in-memory) |
| Logging | Winston (file + console) |
| Hosting | Railway ($5/month Hobby plan) |
| External APIs | Amadeus (flights + hotels), OpenTripMap (places), Wikipedia (descriptions) |
| AI Model | Groq LLM + custom RAG system (separate service, not in this repo) |

---

## Project Structure

```
EgyTravel/
├── server.js                    # Entry point — registers all routes
├── package.json
├── .env                         # Local secrets (NOT committed to git)
├── .env.example                 # Template for env vars
├── railway.json                 # Railway deployment config
├── PROJECT_CONTEXT.md           # This file
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize MySQL connection
│   │   ├── mongodb.js           # Mongoose connection
│   │   ├── amadeus.js           # Amadeus API config
│   │   ├── bookingcom.js        # Legacy (not used)
│   │   └── jwt.js               # JWT config
│   ├── controllers/
│   │   ├── homeController.js    # Homescreen + destinations + map + OpenTripMap + Wikipedia
│   │   ├── exploreController.js # Explore screen (places/restaurants/hotels/flights/map/search)
│   │   ├── hotelController.js   # Hotel search + details (Amadeus)
│   │   ├── flightController.js  # Flight search + pricing + locations (Amadeus)
│   │   ├── bookingController.js # Booking CRUD
│   │   ├── favoriteController.js# Favorites CRUD
│   │   ├── tripController.js    # Trip CRUD (partially built)
│   │   ├── authController.js    # Auth (mostly in routes/auth.js)
│   │   └── userController.js    # User profile management
│   ├── data/
│   │   ├── destinations.js      # Curated Egyptian destinations (static, with lat/lng)
│   │   └── exploreData.js       # Curated places, restaurants, hotels, flight routes
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── roleAuth.js          # Role-based access control
│   │   └── validation.js        # Input validation (express-validator)
│   ├── migrations/              # Database migration scripts
│   ├── models/
│   │   ├── sql/
│   │   │   ├── index.js         # Model associations + syncDatabase()
│   │   │   ├── User.js
│   │   │   ├── PasswordResetToken.js
│   │   │   ├── Booking.js
│   │   │   ├── Favorite.js
│   │   │   └── Trip.js
│   │   └── nosql/               # Empty, reserved for future MongoDB models
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── home.js              # All homescreen routes
│   │   ├── explore.js           # All explore screen routes
│   │   ├── hotels.js
│   │   ├── flights.js
│   │   ├── bookings.js
│   │   └── favorites.js
│   ├── services/
│   │   ├── authService.js       # Registration, login, password reset logic
│   │   ├── jwtService.js        # Token generation + verification
│   │   ├── amadeusService.js    # Amadeus API wrapper (hotels + flights)
│   │   ├── openTripMapService.js# OpenTripMap API wrapper
│   │   ├── wikipediaService.js  # Wikipedia REST API (free, no key)
│   │   ├── cacheService.js      # node-cache wrapper (generic + typed methods)
│   │   ├── emailService.js      # Email (password reset)
│   │   └── bookingcomService.js # Legacy (not used)
│   └── utils/
│       ├── logger.js            # Winston logger
│       ├── validators.js        # Date, email, integer validators
│       ├── affiliateLink.js     # Affiliate URL generator
│       ├── cityCodes.js         # Egyptian IATA city codes
│       └── helpers.js
└── logs/
    ├── combined.log
    └── error.log
```

---

## Environment Variables

Copy `.env.example` to `.env`. Never commit `.env`.

```env
# MySQL (Railway)
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

# JWT
JWT_SECRET=                        # Long random string
JWT_EXPIRES_IN=365d

# Server
PORT=3000
NODE_ENV=development

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Amadeus API (test environment)
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
AMADEUS_API_BASE_URL=https://test.api.amadeus.com

# OpenTripMap (free, 1000 req/day — opentripmap.com/product)
OPENTRIPMAP_API_KEY=

# Cache TTLs (seconds)
CACHE_TTL_SEARCH=3600
CACHE_TTL_HOTEL=7200
CACHE_TTL_LOCATION=86400

# API timeouts
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=2
API_RETRY_DELAY=1000
```

---

## Running Locally

```bash
npm install
cp .env.example .env   # fill in credentials
npm run dev            # nodemon

# If port 3000 is in use (Windows):
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## API Response Format

### Standard success
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

Base URL: `http://localhost:3000` (dev) | Railway URL (prod)

---

### Health
```
GET /health          — server + DB status
GET /               — API info
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
| `GET /api/explore` | — | Full explore screen (places + recommended + restaurants + hotels + flights) |
| `GET /api/explore/places` | `category?`, `limit?` | Places filtered by category |
| `GET /api/explore/places/:id` | — | Single place detail |
| `GET /api/explore/restaurants` | `city?`, `category?`, `limit?` | Restaurants |
| `GET /api/explore/restaurants/:id` | — | Single restaurant detail |
| `GET /api/explore/hotels` | `city?`, `category?` | Curated hotels |
| `GET /api/explore/flights` | — | Popular Egyptian routes |
| `GET /api/explore/map` | `type?` (places/restaurants/hotels/all) | All items as map pins |
| `GET /api/explore/search` | `q`, `type?` | Search across all types |

Place categories: `Recent`, `Historical`, `Beaches`, `Religious`, `Entertainment`, `Nature & Adventure`

Place IDs: `pyramids-of-giza`, `valley-of-the-kings`, `karnak-temple`, `naama-bay`, `blue-hole-dahab`, `saint-catherine`, `cairo-festival-city`, `white-desert-explore`, `abu-simbel-explore`, `hurghada-beach`

Restaurant IDs: `abou-el-sid`, `andrea-mariouteya`, `ovio-maadi`, `fish-market-alex`, `sofra-luxor`, `koshary-el-tahrir`

---

### Hotels — /api/hotels (public)

| Endpoint | Query Params | Description |
|---|---|---|
| `GET /api/hotels/search` | `location`*, `checkin`*, `checkout`, `guests`, `rooms` | Amadeus hotel search |
| `GET /api/hotels/:hotelId` | `checkin`, `checkout`, `guests`, `rooms` | Hotel details |

location = IATA code: `CAI`, `LXR`, `ASW`, `SSH`, `HRG`, `ALY`
Dates: `YYYY-MM-DD`

---

### Flights — /api/flights (public)

| Endpoint | Params | Description |
|---|---|---|
| `GET /api/flights/search` | `origin`*, `destination`*, `departureDate`*, `returnDate?`, `adults?`, `travelClass?` | Amadeus flight search |
| `POST /api/flights/price` | body: `{flightOffer}` | Exact pricing |
| `GET /api/flights/locations` | `keyword` | Egyptian airports/cities |

travelClass: `ECONOMY`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST`

---

### Bookings — /api/bookings (all require Bearer token)

| Method | Endpoint | Body/Query | Description |
|---|---|---|---|
| POST | `/api/bookings/hotel` | `{hotelId, hotelName, hotelLocation, checkinDate, checkoutDate, guests, rooms, tripId?, totalPrice, currency}` | Save hotel booking |
| GET | `/api/bookings` | `?tripId=&status=&type=` | Get user bookings |
| GET | `/api/bookings/:bookingId` | — | Single booking |
| PUT | `/api/bookings/:bookingId` | `{status?, bookingReference?, notes?}` | Update booking |
| DELETE | `/api/bookings/:bookingId` | — | Delete booking |

status values: `pending`, `confirmed`, `cancelled`, `completed`

---

### Favorites — /api/favorites (all require Bearer token)

| Method | Endpoint | Body/Query | Description |
|---|---|---|---|
| POST | `/api/favorites/hotel` | `{hotelId, hotelName, location, imageUrl, priceData, description?, notes?, tags?}` | Add to favorites |
| GET | `/api/favorites` | `?type=hotel` | Get favorites |
| DELETE | `/api/favorites/:favoriteId` | — | Remove favorite |

item_type values: `hotel`, `place`, `itinerary`, `activity`, `restaurant`, `attraction`, `trip`

---

## Database Schema (MySQL)

### users
| Column | Type |
|---|---|
| user_id | INT PK AUTO_INCREMENT |
| name | VARCHAR(100) |
| email | VARCHAR(100) UNIQUE |
| password | VARCHAR(255) bcrypt |
| role | ENUM('user','admin') |
| created_at | TIMESTAMP |

### bookings
| Column | Type |
|---|---|
| booking_id | INT PK |
| user_id | INT FK |
| trip_id | INT FK NULL |
| booking_type | ENUM(hotel/flight/activity/transport) |
| provider | VARCHAR(100) |
| booking_url | TEXT |
| booking_reference | VARCHAR(200) |
| status | ENUM(pending/confirmed/cancelled/completed) |
| total_price | DECIMAL(10,2) |
| currency | VARCHAR(3) |
| hotel_id, hotel_name, hotel_location, hotel_address | various |
| check_in_date, check_out_date | DATEONLY |
| guests, rooms | INT |
| flight_id, airline, flight_number | various |
| departure_airport, arrival_airport | VARCHAR |
| departure_date, arrival_date | DATETIME |
| passengers | INT |
| cabin_class | ENUM |
| booking_data | JSON |
| notes | TEXT |
| created_at, updated_at | TIMESTAMP |

### favorites
| Column | Type |
|---|---|
| favorite_id | INT PK |
| user_id | INT FK |
| item_type | ENUM |
| item_id | VARCHAR(200) |
| item_name | VARCHAR(300) |
| item_description | TEXT |
| item_image_url | VARCHAR(500) |
| item_location | VARCHAR(200) |
| item_data | JSON |
| notes | TEXT |
| tags | VARCHAR(500) |
| saved_at | DATETIME |
| UNIQUE(user_id, item_type, item_id) | |

### trips
| Column | Type |
|---|---|
| trip_id | INT PK |
| user_id | INT FK |
| title | VARCHAR(200) |
| description | TEXT |
| destination | VARCHAR(200) |
| start_date, end_date | DATEONLY |
| budget | DECIMAL(10,2) |
| status | ENUM(planning/confirmed/completed/cancelled) |
| created_at, updated_at | TIMESTAMP |

### password_reset_tokens
| Column | Type |
|---|---|
| id | INT PK |
| user_id | INT FK |
| token | VARCHAR(255) hashed |
| expires_at | DATETIME |
| used | BOOLEAN |
| created_at | TIMESTAMP |

---

## Caching Strategy (node-cache, resets on restart)

| Data | TTL |
|---|---|
| Hotel search | 1 hour |
| Hotel details | 2 hours |
| Location data | 24 hours |
| OpenTripMap results | 1 hour |
| OpenTripMap details | 2 hours |
| Wikipedia summaries | 24 hours |

---

## External APIs

### Amadeus
- Docs: https://developers.amadeus.com
- Current: TEST environment (fake data)
- Production requires travel agency registration

### OpenTripMap
- Docs: https://opentripmap.com/docs
- Free: 1000 req/day, no card needed
- License: ODbL (can store and use, must credit)

### Wikipedia REST API
- Free, no key needed
- `GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}`

---

## AI Integration (Planned — NOT built yet)

ML team built: fine-tuned model + RAG system + filtration running on Groq API.

Planned endpoint: `POST /api/plans/generate`

Request body:
```json
{
  "destination": "Luxor",
  "startDate": "2025-04-01",
  "endDate": "2025-04-04",
  "budget": "Medium",
  "interests": ["Historical", "Culture"]
}
```

Response shape (planned):
```json
{
  "planId": "plan_abc123",
  "title": "3 Days in Luxor",
  "days": [
    {
      "day": 1,
      "hotel": { "name": "...", "lat": 25.69, "lng": 32.64, "pricePerNight": 120 },
      "places": [
        { "name": "Karnak Temple", "type": "attraction", "lat": 25.71, "lng": 32.65, "order": 1 },
        { "name": "Sofra Restaurant", "type": "restaurant", "lat": 25.69, "lng": 32.63, "order": 2 }
      ],
      "route": {
        "waypoints": [{ "lat": 25.71, "lng": 32.65, "label": "Karnak" }],
        "totalDistanceKm": 4.2,
        "estimatedDrivingMinutes": 18
      }
    }
  ],
  "summary": {
    "totalDays": 3,
    "estimatedBudget": { "min": 800, "max": 1200, "currency": "USD" },
    "mapBounds": { "northeast": { "lat": 25.74, "lng": 32.66 }, "southwest": { "lat": 25.69, "lng": 32.63 } }
  }
}
```

---

## Flutter App Screens → API Mapping

| Screen | API Endpoint | Status |
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
| Trips (profile) | `GET /api/trips` | ⚠️ Partial |
| Notifications | `GET /api/notifications` | ❌ Not built |
| AI Trip Planner | `POST /api/plans/generate` | ❌ Not built |
| AI Chat | `POST /api/chat` | ❌ Not built |
| Guide Trip | `POST /api/guides` | ❌ Not built |
| Reviews | `GET/POST /api/reviews` | ❌ Not built |

---

## What's Done vs Pending

### Done ✅
- JWT auth (register, login, logout, password reset, profile)
- Role-based access (user/admin)
- Hotel search + details (Amadeus)
- Flight search + pricing + locations (Amadeus)
- Booking CRUD
- Favorites CRUD
- Homescreen API (featured, popular, cities, map, OpenTripMap, Wikipedia)
- Explore screen API (places by category, restaurants, curated hotels, popular flights, map, search)
- In-memory caching for all external API calls
- Rate limiting on all search endpoints
- Winston logging

### Pending ❌
- Trips API (controller started, routes not wired)
- Notifications API
- Reviews API (for destination detail screen)
- AI Trip Planner endpoint (`POST /api/plans/generate`)
- AI Chat endpoint (`POST /api/chat`)
- Guide Trip endpoint
- Affiliate link generator for flights
- OpenTripMap data seeder script

---

## Git Workflow

```bash
git clone https://github.com/egytravel/egytravel_back_end.git
cd egytravel_back_end
npm install
cp .env.example .env   # fill in credentials
npm run dev
```

Branch convention:
- `main` — production-ready
- `dev` — active development
- `feature/feature-name` — new features

Never commit: `.env`, `node_modules/`, `logs/`

---

## Known Issues

1. `bookingcomService.js` exists but is not used — Booking.com dropped in favor of Amadeus
2. Amadeus is on TEST environment — data is fake
3. MongoDB connected but no models use it yet
4. Wikipedia enrichment fails silently — returns original data if no Wikipedia page found
5. Trip controller (`src/controllers/tripController.js`) is partially built but routes not registered in server.js yet

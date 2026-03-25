# EgyTravel Backend — Project Context
> This file is the single source of truth for any developer or Kiro instance joining this project.
> Read this fully before making any changes.

---

## Project Overview

EgyTravel is an Egyptian tourism platform with:
- Flutter mobile app
- Web frontend
- This Node.js/Express backend (this repo)
- A separate ML team's RAG-based AI planner (Groq LLM + custom RAG + filtration)

The backend serves both the Flutter app and the web frontend via REST APIs.

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
├── server.js                    # Entry point
├── package.json
├── .env                         # Local secrets (NOT committed to git)
├── .env.example                 # Template for env vars
├── railway.json                 # Railway deployment config
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize MySQL connection
│   │   ├── mongodb.js           # Mongoose connection
│   │   ├── amadeus.js           # Amadeus API config
│   │   ├── bookingcom.js        # Legacy (Booking.com dropped, kept for reference)
│   │   └── jwt.js               # JWT config
│   ├── controllers/
│   │   ├── homeController.js    # Homescreen + destinations + map + OpenTripMap
│   │   ├── hotelController.js   # Hotel search + details (Amadeus)
│   │   ├── flightController.js  # Flight search + pricing + locations (Amadeus)
│   │   ├── bookingController.js # Booking CRUD
│   │   ├── favoriteController.js# Favorites CRUD
│   │   ├── authController.js    # Auth (mostly in routes/auth.js)
│   │   └── userController.js    # User profile management
│   ├── data/
│   │   └── destinations.js      # Curated Egyptian destinations (static, with lat/lng)
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
│   │   └── bookingcomService.js # Legacy (not used, kept for reference)
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

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

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
NODE_ENV=development               # or production

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Amadeus API (test environment)
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
AMADEUS_API_BASE_URL=https://test.api.amadeus.com

# OpenTripMap (free, 1000 req/day)
OPENTRIPMAP_API_KEY=               # Get from opentripmap.com/product

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
# fill in .env
npm run dev        # nodemon (auto-restart)
# or
node server.js     # plain node

# If port 3000 is in use (Windows):
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Server starts on `http://localhost:3000`

---

## API Response Format

### Standard success response
```json
{
  "success": true,
  "data": { ... }
}
```

### Auth endpoints use this format
```json
{
  "code": 200,
  "message": "LOGIN SUCCESSFUL",
  "data": {
    "token": "jwt_token_here",
    "user_id": 1,
    "name": "Ahmed",
    "email": "ahmed@example.com",
    "role": "user"
  }
}
```

### Error response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Authentication header (for protected routes)
```
Authorization: Bearer <jwt_token>
```

---

## Complete API Reference

Base URL: `http://localhost:3000` (dev) or Railway URL (prod)

---

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server + DB status |
| GET | `/` | None | API info + all endpoints |

---

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | None | `{name, email, password, role?}` | Register new user |
| POST | `/api/auth/login` | None | `{email, password}` | Login, returns JWT |
| POST | `/api/auth/logout` | Bearer | — | Logout (client removes token) |
| POST | `/api/auth/refresh` | None | `{refreshToken}` | Refresh access token |
| POST | `/api/auth/forgot-password` | None | `{email}` | Request password reset |
| POST | `/api/auth/reset-password` | None | `{token, password}` | Reset password |
| GET | `/api/auth/me` | Bearer | — | Get current user profile |

**Register response:**
```json
{
  "code": 201,
  "message": "REGISTRATION SUCCESSFUL",
  "data": {
    "token": "eyJ...",
    "user_id": 1,
    "name": "Ahmed",
    "email": "ahmed@example.com",
    "role": "user"
  }
}
```

---

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Bearer | Get user profile |
| PUT | `/api/users/profile` | Bearer | Update profile |
| PUT | `/api/users/password` | Bearer | Change password |
| DELETE | `/api/users/account` | Bearer | Delete account |

---

### Homescreen — `/api/home`

All public, no auth required.

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/home` | — | Full homescreen payload (featured + popular + cities) |
| GET | `/api/home/search` | `q` (min 2 chars) | Search curated destinations |
| GET | `/api/home/destinations` | `category`, `city`, `featured`, `popular` | All destinations with filters |
| GET | `/api/home/destinations/:id` | — | Single destination detail + Wikipedia enrichment |
| GET | `/api/home/cities` | — | City cards for Destination section |
| GET | `/api/home/map/markers` | `category?`, `city?` | Lightweight map pins (lat/lng + name) |
| GET | `/api/home/map/search` | `q`, `category?`, `city?` | Search + mapView camera position |
| GET | `/api/home/places/search` | `q` (min 2 chars) | Live search via OpenTripMap (Egypt only) |
| GET | `/api/home/places/city/:cityId` | `limit?` (default 15) | Real attractions for a city |
| GET | `/api/home/places/:xid` | — | Full place detail + Wikipedia enrichment |

**Available cityId values:** `cairo`, `luxor`, `aswan`, `sharm-el-sheikh`, `hurghada`, `alexandria`, `dahab`, `siwa`

**Available categories:** `landmark`, `historical`, `beach`, `nature`, `city`

**`GET /api/home` response shape:**
```json
{
  "success": true,
  "data": {
    "featured": [...],      // Hero slider cards (5 items)
    "popular": [...],       // Popular Places section (8 items)
    "destinations": [...]   // City cards (6 cities)
  }
}
```

**Destination object shape:**
```json
{
  "id": "valley-of-kings",
  "name": "Valley of the Kings",
  "location": "Luxor",
  "city": "Luxor",
  "cityCode": "LXR",
  "country": "Egypt",
  "lat": 25.7402,
  "lng": 32.6014,
  "description": "Full description...",
  "shortDescription": "Short version...",
  "images": ["url1", "url2", "url3"],
  "coverImage": "url",
  "rating": 4.8,
  "reviewCount": 12300,
  "pricePerPerson": 300,
  "currency": "USD",
  "category": "historical",
  "tags": ["pharaohs", "tombs", "UNESCO"],
  "facilities": ["Guided Tours", "Visitor Center"],
  "weather": { "temp": 30, "unit": "C", "condition": "Sunny" },
  "featured": true,
  "popular": true,
  "openingHours": "6:00 AM - 5:00 PM",
  "bestTimeToVisit": "October to March",
  "wikipedia": {                          // Added by Wikipedia enrichment
    "title": "Valley of the Kings",
    "url": "https://en.wikipedia.org/...",
    "thumbnail": "https://...",
    "originalImage": "https://...",
    "coordinates": { "lat": 25.74, "lng": 32.60 }
  }
}
```

**Map search response:**
```json
{
  "success": true,
  "count": 2,
  "mapView": { "lat": 25.74, "lng": 32.60, "zoom": 13 },
  "data": [{ "id": "...", "lat": 25.74, "lng": 32.60, ... }]
}
```

---

### Hotels — `/api/hotels`

Uses Amadeus API. Public endpoints.

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/hotels/search` | `location`*, `checkin`*, `checkout`, `guests`, `rooms` | Search hotels by city |
| GET | `/api/hotels/:hotelId` | `checkin`, `checkout`, `guests`, `rooms` | Hotel details + room offers |

- `location` = IATA city code: `CAI` (Cairo), `LXR` (Luxor), `ASW` (Aswan), `SSH` (Sharm), `HRG` (Hurghada), `ALY` (Alexandria)
- Dates format: `YYYY-MM-DD`
- Rate limit: 50 requests per 15 minutes per IP

**Hotel search response:**
```json
{
  "code": 200,
  "message": "HOTELS FOUND",
  "data": [
    {
      "hotelId": "MCLONGHM",
      "name": "Hotel Name",
      "location": "CAI, EG",
      "address": "Street address",
      "rating": 4,
      "price": { "amount": 120.00, "currency": "USD", "perNight": true },
      "amenities": ["WIFI", "POOL"],
      "available": true,
      "offerId": "offer_id",
      "latitude": 30.04,
      "longitude": 31.23
    }
  ]
}
```

---

### Flights — `/api/flights`

Uses Amadeus API. Public endpoints.

| Method | Endpoint | Params | Description |
|---|---|---|---|
| GET | `/api/flights/search` | `origin`*, `destination`*, `departureDate`*, `returnDate?`, `adults?`, `travelClass?` | Search flights |
| POST | `/api/flights/price` | body: `{flightOffer}` | Get exact pricing for a flight offer |
| GET | `/api/flights/locations` | `keyword` (min 2 chars) | Search Egyptian airports/cities |

- `travelClass` options: `ECONOMY`, `PREMIUM_ECONOMY`, `BUSINESS`, `FIRST`
- Rate limit: 50 requests per 15 minutes per IP

**Flight search response:**
```json
{
  "code": 200,
  "message": "FLIGHTS FOUND",
  "data": [
    {
      "flightId": "1",
      "airline": "MS",
      "flightNumber": "MS777",
      "departure": { "airport": "CAI", "terminal": "1", "time": "2025-04-01T08:00:00", "city": "CAI" },
      "arrival": { "airport": "LHR", "terminal": "2", "time": "2025-04-01T12:00:00", "city": "LHR" },
      "duration": "PT6H",
      "stops": 0,
      "cabinClass": "ECONOMY",
      "price": { "amount": 450.00, "currency": "USD" },
      "seats": 9,
      "offerId": "1"
    }
  ]
}
```

---

### Bookings — `/api/bookings`

All routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| POST | `/api/bookings/hotel` | `{hotelId, hotelName, hotelLocation, checkinDate, checkoutDate, guests, rooms, tripId?, totalPrice, currency}` | Save hotel booking |
| GET | `/api/bookings` | `?tripId=&status=` | Get user's bookings |
| GET | `/api/bookings/:bookingId` | — | Get single booking |
| PUT | `/api/bookings/:bookingId` | `{status?, bookingReference?, notes?}` | Update booking |
| DELETE | `/api/bookings/:bookingId` | — | Delete booking |

- `status` values: `pending`, `confirmed`, `cancelled`, `completed`
- `booking_type` values: `hotel`, `flight`, `activity`, `transport`

---

### Favorites — `/api/favorites`

All routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| POST | `/api/favorites/hotel` | `{hotelId, hotelName, location, imageUrl, priceData, description?, notes?, tags?}` | Add hotel to favorites |
| GET | `/api/favorites` | `?type=hotel` | Get user's favorites |
| DELETE | `/api/favorites/:favoriteId` | — | Remove from favorites |

- `item_type` values: `hotel`, `place`, `itinerary`, `activity`, `restaurant`, `attraction`, `trip`

---

## Database Schema (MySQL)

### users
| Column | Type | Notes |
|---|---|---|
| user_id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(100) | |
| email | VARCHAR(100) UNIQUE | lowercase |
| password | VARCHAR(255) | bcrypt hashed |
| role | ENUM('user','admin') | default: user |
| created_at | TIMESTAMP | |

### bookings
| Column | Type | Notes |
|---|---|---|
| booking_id | INT PK | |
| user_id | INT FK | |
| trip_id | INT FK NULL | |
| booking_type | ENUM | hotel/flight/activity/transport |
| provider | VARCHAR(100) | |
| booking_url | TEXT | affiliate/redirect link |
| booking_reference | VARCHAR(200) | confirmation number |
| status | ENUM | pending/confirmed/cancelled/completed |
| total_price | DECIMAL(10,2) | |
| currency | VARCHAR(3) | default USD |
| hotel_id, hotel_name, hotel_location, hotel_address | various | hotel fields |
| check_in_date, check_out_date | DATEONLY | |
| guests, rooms | INT | |
| flight_id, airline, flight_number | various | flight fields |
| departure_airport, arrival_airport | VARCHAR | |
| departure_date, arrival_date | DATETIME | |
| passengers | INT | |
| cabin_class | ENUM | economy/premium_economy/business/first |
| booking_data | JSON | extra provider data |
| notes | TEXT | |
| created_at, updated_at | TIMESTAMP | |

### favorites
| Column | Type | Notes |
|---|---|---|
| favorite_id | INT PK | |
| user_id | INT FK | |
| item_type | ENUM | hotel/place/itinerary/activity/restaurant/attraction/trip |
| item_id | VARCHAR(200) | external ID |
| item_name | VARCHAR(300) | |
| item_description | TEXT | |
| item_image_url | VARCHAR(500) | |
| item_location | VARCHAR(200) | |
| item_data | JSON | pricing, amenities, etc. |
| notes | TEXT | |
| tags | VARCHAR(500) | comma-separated |
| saved_at | DATETIME | |
| UNIQUE(user_id, item_type, item_id) | | prevents duplicates |

### trips
| Column | Type | Notes |
|---|---|---|
| trip_id | INT PK | |
| user_id | INT FK | |
| title | VARCHAR(200) | |
| description | TEXT | |
| destination | VARCHAR(200) | |
| start_date, end_date | DATEONLY | |
| budget | DECIMAL(10,2) | |
| status | ENUM | planning/confirmed/completed/cancelled |
| created_at, updated_at | TIMESTAMP | |

### password_reset_tokens
| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| user_id | INT FK | |
| token | VARCHAR(255) | hashed |
| expires_at | DATETIME | |
| used | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## Caching Strategy

All caching uses `node-cache` (in-memory, resets on server restart).

| Data | TTL | Method |
|---|---|---|
| Hotel search results | 1 hour | `cacheService.setSearchResults()` |
| Hotel details | 2 hours | `cacheService.setHotelDetails()` |
| Location data | 24 hours | `cacheService.setLocationData()` |
| OpenTripMap results | 1 hour | `cacheService.set(key, data, 3600)` |
| OpenTripMap details | 2 hours | `cacheService.set(key, data, 7200)` |
| Wikipedia summaries | 24 hours | `cacheService.set(key, data, 86400)` |

---

## External APIs

### Amadeus (flights + hotels)
- Docs: https://developers.amadeus.com
- Current env: TEST (fake data, no real bookings)
- To go live: apply for production access (requires travel agency registration)
- Key endpoints used:
  - `referenceData.locations.hotels.byCity.get` — hotel IDs by city
  - `shopping.hotelOffersSearch.get` — hotel offers with pricing
  - `shopping.flightOffersSearch.get` — flight search
  - `shopping.flightOffers.pricing.post` — exact flight pricing

### OpenTripMap (tourist places)
- Docs: https://opentripmap.com/docs
- Free tier: 1000 requests/day
- No card required
- Used for: real place search, city attractions, place details
- Data license: ODbL (can store and use, must credit)

### Wikipedia REST API (descriptions)
- Docs: https://en.wikipedia.org/api/rest_v1/
- Completely free, no key needed
- Used for: enriching destination and place descriptions + thumbnail images
- Endpoint: `GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}`

---

## AI Integration (Planned)

The ML team has built:
- Fine-tuned model on Egyptian tourism data
- RAG (Retrieval Augmented Generation) system
- Filtration layer
- Running on **Groq API** (not self-hosted)

Integration plan:
1. User submits trip preferences → `POST /api/plans/generate`
2. Backend queries local places DB (from OpenTripMap seeder — not built yet)
3. Backend calls Groq API with RAG context
4. Response includes day-by-day plan with `lat`/`lng` for each place
5. Frontend renders plan on map with route polylines

**AI plan response shape (planned):**
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
        "waypoints": [{ "lat": 25.71, "lng": 32.65, "label": "Karnak" }, ...],
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

## What's Done vs Pending

### Done ✅
- JWT authentication (register, login, logout, password reset, profile)
- Role-based access control (user/admin)
- Hotel search + details via Amadeus
- Flight search + pricing + location search via Amadeus
- Booking CRUD (create, read, update, delete)
- Favorites CRUD
- Homescreen API (featured, popular, cities)
- Destination detail with Wikipedia enrichment
- Map markers + map search with camera position
- OpenTripMap integration (real place search + city attractions + place details)
- Wikipedia enrichment service
- In-memory caching for all external API calls
- Rate limiting on all search endpoints
- Winston logging

### Pending ❌
- Trip model associations (Task 2.3 in tasks.md)
- Full booking endpoints (get list, update, delete — partially done)
- Favorites endpoints (add, list, remove — partially done)
- OpenTripMap data seeder script (for AI model database)
- AI planning endpoint (`POST /api/plans/generate`)
- Groq API integration
- Affiliate link generator for flights/hotels
- Payment integration (Stripe for direct payments, affiliate redirects for flights/hotels)
- Production Amadeus credentials

---

## Git Workflow

```bash
git clone <repo-url>
cd EgyTravel
npm install
cp .env.example .env
# fill in .env with credentials
npm run dev
```

**Branch convention:**
- `main` — production-ready code
- `dev` — active development
- `feature/feature-name` — new features

**Never commit:**
- `.env` (already in .gitignore)
- `node_modules/`
- `logs/`

---

## Known Issues / Notes

1. `bookingcomService.js` still exists but is not used — Booking.com was dropped in favor of Amadeus for everything
2. `src/config/bookingcom.js` still referenced in old code — cacheService.js was updated to remove this dependency
3. Amadeus is on TEST environment — hotel/flight data is fake. Real data requires production credentials + travel agency registration
4. MongoDB is connected but no models use it yet — reserved for future features
5. The `railway.json` deployment config exists but the team is evaluating other hosting options
6. Wikipedia enrichment fails silently — if Wikipedia has no page for a place, the original data is returned unchanged

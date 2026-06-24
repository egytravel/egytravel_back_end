# EgyTravel — Egyptian Tourism Platform Backend

> RESTful API backend for EgyTravel, a full-stack Egyptian tourism platform serving a Flutter mobile app and a React web application.

**Live API:** https://egy-travel-89eca3b6683d.herokuapp.com  
**Website:** https://egytravel.me  
**Health Check:** https://egy-travel-89eca3b6683d.herokuapp.com/health

---

## Overview

EgyTravel is a graduation project that helps users explore Egypt, plan trips, search hotels and flights, and connect with a travel community. This repository contains the backend API built with Node.js and Express.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| SQL Database | PostgreSQL (Heroku Postgres / Amazon RDS) |
| NoSQL Database | MongoDB Atlas |
| ORM / ODM | Sequelize + Mongoose |
| Authentication | JWT + bcrypt |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Heroku |
| Security | Helmet.js, CORS, express-rate-limit |

---

## Modules

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Authentication | `/api/auth` | Register, login, OTP verification, password reset |
| Users | `/api/users` | Profile management, admin controls |
| Home | `/api/home` | Dynamic homepage data, destinations, cities |
| Explore | `/api/explore` | Tourist attractions via OpenTripMap |
| Flights | `/api/flights` | Flight search via Booking.com (RapidAPI) |
| Hotels | `/api/hotels` | Hotel search via Booking.com (RapidAPI) |
| Bookings | `/api/bookings` | Hotel & flight reservation management |
| Favorites | `/api/favorites` | Saved destinations |
| Reviews | `/api/reviews` | Ratings & user feedback |
| Trips | `/api/trips` | Manual & AI-generated trip planning |
| Events | `/api/events` | What's On — admin-managed local events |
| Community | `/api/community` | Posts, likes, comments feed |
| AI | `/api/ai` | Save AI-generated trip itineraries |

---

## External APIs

| API | Purpose |
|-----|---------|
| Booking.com (RapidAPI) | Hotels & flights search |
| Google Places API | Destination photos, reviews, ratings |
| OpenTripMap | Tourist attractions & points of interest |
| Wikipedia | Destination descriptions & summaries |
| Cloudinary | Image upload & CDN storage |
| Resend | Transactional email (OTP, welcome, password reset) |

---

## Database Architecture

**PostgreSQL** — structured relational data:
- users, trips, trip_days, bookings, favorites, events, reviews, posts, notifications, places

**MongoDB** — flexible/social data:
- email_otps, posts, reviews, ai_conversations, ai_trip_plans, place_cache, search_history

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd egytravel_back_end

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start development server
npm run dev
```

Server runs at `http://localhost:3000`

### Environment Variables

See `.env.example` for all required variables including:
- `DATABASE_URL` — PostgreSQL connection string
- `MONGODB_URI` — MongoDB Atlas URI
- `JWT_SECRET` — JWT signing secret
- `GMAIL_USER` + `GMAIL_APP_PASSWORD` — email credentials
- `CLOUDINARY_*` — Cloudinary credentials
- `RAPIDAPI_KEY` — Booking.com API key
- `GOOGLE_PLACES_API_KEY` — Google Places key
- `OPENTRIPMAP_API_KEY` — OpenTripMap key

---

## API Response Format

All endpoints return a consistent JSON structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Security

- JWT authentication with 365-day expiry
- bcrypt password hashing (12 salt rounds)
- Helmet.js HTTP security headers
- Rate limiting (1000 req / 15 min per IP)
- Input validation via express-validator
- SSL enforced on all database connections
- Role-based access control (user / admin)

---

## Deployment

The API is deployed on **Heroku** (Heroku-24 stack). Push to deploy:

```bash
git push heroku main
```

---

## Project Structure

```
src/
├── config/         # Database & JWT config
├── controllers/    # Business logic
├── middleware/     # Auth, validation, rate limiting
├── migrations/     # PostgreSQL migrations
├── models/
│   ├── sql/        # Sequelize models
│   └── nosql/      # Mongoose models
├── routes/         # Express route definitions
├── services/       # External API integrations
├── utils/          # Logger, validators, helpers
└── data/           # Static destination data
```

---

## Team

Built as a graduation project.  
Backend developed by **Fares Iraqi** — Backend Developer & Team Leader.

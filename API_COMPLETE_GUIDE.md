# EgyTravel Complete API Guide

## 🌟 Overview

EgyTravel is a comprehensive travel booking platform for Egypt, providing APIs for:
- ✈️ **Flight Search & Booking** (Amadeus API)
- 🏨 **Hotel Search & Booking** (Amadeus API)
- 👤 **User Authentication** (JWT)
- 📅 **Trip Planning**
- ⭐ **Favorites/Wishlist**
- 📝 **Booking Management**

---

## 🚀 Quick Start

### Base URLs
- **Local Development**: `http://localhost:3000`
- **Production**: `https://egytravel-backend-production.up.railway.app`

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📚 API Documentation

### 1. Authentication APIs
See: [AUTH_API_TESTING.md](./AUTH_API_TESTING.md)

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user profile

---

### 2. Hotel APIs
See: [HOTEL_API_TESTING.md](./HOTEL_API_TESTING.md)

**Endpoints:**
- `GET /api/hotels/search` - Search hotels by location and dates
- `GET /api/hotels/:hotelId` - Get hotel details

**Example:**
```bash
curl "http://localhost:3000/api/hotels/search?location=CAI&checkin=2025-12-20&checkout=2025-12-25&guests=2&rooms=1"
```

---

### 3. Flight APIs
See: [FLIGHT_API_TESTING.md](./FLIGHT_API_TESTING.md)

**Endpoints:**
- `GET /api/flights/search` - Search flights
- `POST /api/flights/price` - Get flight price details
- `GET /api/flights/locations` - Search airports/cities

**Example:**
```bash
curl "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2&travelClass=ECONOMY"
```

---

### 4. Booking APIs

**Endpoints:**
- `POST /api/bookings/hotel` - Save hotel booking
- `POST /api/bookings/flight` - Save flight booking
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:bookingId` - Get specific booking
- `PUT /api/bookings/:bookingId` - Update booking
- `DELETE /api/bookings/:bookingId` - Delete booking

**Example:**
```bash
curl -X POST "http://localhost:3000/api/bookings/hotel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "HOTEL123",
    "hotelName": "Marriott Mena House",
    "location": "Giza, Cairo",
    "checkinDate": "2025-12-20",
    "checkoutDate": "2025-12-25",
    "guests": 2,
    "rooms": 1,
    "totalPrice": 750.00,
    "currency": "USD"
  }'
```

---

### 5. Favorites APIs

**Endpoints:**
- `POST /api/favorites/hotel` - Add hotel to favorites
- `POST /api/favorites/flight` - Add flight to favorites
- `GET /api/favorites` - Get user's favorites
- `DELETE /api/favorites/:favoriteId` - Remove from favorites

**Example:**
```bash
curl -X POST "http://localhost:3000/api/favorites/hotel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "HOTEL123",
    "hotelName": "Marriott Mena House",
    "location": "Giza, Cairo",
    "imageUrl": "https://...",
    "priceData": {
      "amount": 150.00,
      "currency": "USD"
    }
  }'
```

---

### 6. User Profile APIs

**Endpoints:**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

---

## 🗺️ Egyptian City & Airport Codes

See: [EGYPTIAN_CITY_CODES.md](./EGYPTIAN_CITY_CODES.md)

### Popular Destinations

| City | Code | Use For |
|------|------|---------|
| Cairo | CAI | Hotels & Flights |
| Luxor | LXR | Hotels & Flights |
| Aswan | ASW | Hotels & Flights |
| Hurghada | HRG | Hotels & Flights |
| Sharm El Sheikh | SSH | Hotels & Flights |
| Marsa Alam | RMF | Hotels & Flights |
| Alexandria | ALY | Hotels & Flights |

---

## 🔐 Authentication Flow

### 1. Register User
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe",
    "phone_number": "+201234567890"
  }'
```

**Response:**
```json
{
  "code": 201,
  "message": "USER REGISTERED SUCCESSFULLY",
  "data": {
    "user": {
      "userId": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Use Token
```bash
curl -X GET "http://localhost:3000/api/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Common Use Cases

### Use Case 1: Search and Book a Hotel

#### Step 1: Search Hotels
```bash
curl "http://localhost:3000/api/hotels/search?location=CAI&checkin=2025-12-20&checkout=2025-12-25&guests=2&rooms=1"
```

#### Step 2: Get Hotel Details
```bash
curl "http://localhost:3000/api/hotels/HOTEL123?checkin=2025-12-20&checkout=2025-12-25&guests=2&rooms=1"
```

#### Step 3: Save Booking (Requires Auth)
```bash
curl -X POST "http://localhost:3000/api/bookings/hotel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "HOTEL123",
    "hotelName": "Marriott Mena House",
    "location": "Giza, Cairo",
    "checkinDate": "2025-12-20",
    "checkoutDate": "2025-12-25",
    "guests": 2,
    "rooms": 1,
    "totalPrice": 750.00,
    "currency": "USD"
  }'
```

---

### Use Case 2: Search and Book a Flight

#### Step 1: Search Flights
```bash
curl "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2&travelClass=ECONOMY"
```

#### Step 2: Get Flight Price
```bash
curl -X POST "http://localhost:3000/api/flights/price" \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffer": { ... }
  }'
```

#### Step 3: Save Booking (Requires Auth)
```bash
curl -X POST "http://localhost:3000/api/bookings/flight" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FLIGHT123",
    "airline": "MS",
    "flightNumber": "MS123",
    "departureAirport": "CAI",
    "arrivalAirport": "LXR",
    "departureDate": "2025-12-20T10:00:00",
    "arrivalDate": "2025-12-20T11:30:00",
    "passengers": 2,
    "cabinClass": "economy",
    "totalPrice": 300.00,
    "currency": "USD"
  }'
```

---

### Use Case 3: Plan a Complete Trip

#### Step 1: Create Trip (Future Feature)
```bash
curl -X POST "http://localhost:3000/api/trips" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripName": "Egypt Adventure 2025",
    "startDate": "2025-12-20",
    "endDate": "2025-12-30",
    "destinations": ["Cairo", "Luxor", "Aswan"]
  }'
```

#### Step 2: Add Hotel Booking to Trip
```bash
curl -X POST "http://localhost:3000/api/bookings/hotel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": 1,
    "hotelId": "HOTEL123",
    ...
  }'
```

#### Step 3: Add Flight Booking to Trip
```bash
curl -X POST "http://localhost:3000/api/bookings/flight" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": 1,
    "flightId": "FLIGHT123",
    ...
  }'
```

---

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "code": 200,
  "message": "SUCCESS_MESSAGE",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional details (development only)"
  }
}
```

---

## 🚦 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 1000 requests | 15 minutes |
| `/api/hotels/search` | 50 requests | 15 minutes |
| `/api/flights/search` | 50 requests | 15 minutes |
| Other endpoints | 1000 requests | 15 minutes |

---

## 🔍 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_REQUIRED_PARAMS | 400 | Required parameter missing |
| VALIDATION_ERROR | 400 | Invalid input format |
| INVALID_DATE_RANGE | 400 | Invalid date range |
| AUTHENTICATION_REQUIRED | 401 | Missing or invalid token |
| AUTHORIZATION_FAILED | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| API_UNAVAILABLE | 503 | External API unavailable |
| API_TIMEOUT | 504 | Request timeout |

---

## 🧪 Testing

### Postman Collection
Import the Postman collection for easy testing:
- [Download Postman Collection](./postman_collection.json)

### cURL Examples
All documentation includes cURL examples for quick testing.

### Automated Tests
Run the test suite:
```bash
npm test
```

---

## 🌍 Supported Regions

### Egypt
- Cairo & Giza
- Luxor
- Aswan
- Hurghada
- Sharm El Sheikh
- Marsa Alam
- Alexandria
- And more...

### International
- All major international airports supported via Amadeus
- 500+ airlines
- 1M+ hotels worldwide

---

## 📱 Client SDKs

### JavaScript/TypeScript
```javascript
import { EgyTravelAPI } from 'egytravel-sdk';

const api = new EgyTravelAPI({
  baseUrl: 'http://localhost:3000',
  token: 'YOUR_JWT_TOKEN'
});

// Search hotels
const hotels = await api.hotels.search({
  location: 'CAI',
  checkin: '2025-12-20',
  checkout: '2025-12-25',
  guests: 2,
  rooms: 1
});

// Search flights
const flights = await api.flights.search({
  origin: 'CAI',
  destination: 'LXR',
  departureDate: '2025-12-20',
  adults: 2
});
```

### Flutter/Dart
```dart
import 'package:egytravel_sdk/egytravel_sdk.dart';

final api = EgyTravelAPI(
  baseUrl: 'http://localhost:3000',
  token: 'YOUR_JWT_TOKEN',
);

// Search hotels
final hotels = await api.hotels.search(
  location: 'CAI',
  checkin: '2025-12-20',
  checkout: '2025-12-25',
  guests: 2,
  rooms: 1,
);

// Search flights
final flights = await api.flights.search(
  origin: 'CAI',
  destination: 'LXR',
  departureDate: '2025-12-20',
  adults: 2,
);
```

---

## 🔧 Environment Setup

### Required Environment Variables
```bash
# Database
DB_HOST=your-db-host
DB_PORT=your-db-port
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=365d

# Amadeus API
AMADEUS_API_KEY=your-amadeus-key
AMADEUS_API_SECRET=your-amadeus-secret
AMADEUS_API_BASE_URL=https://test.api.amadeus.com

# Server
PORT=3000
NODE_ENV=development
```

See [.env.example](./.env.example) for complete configuration.

---

## 📖 Additional Documentation

- [Authentication API](./AUTH_API_TESTING.md)
- [Hotel API](./HOTEL_API_TESTING.md)
- [Flight API](./FLIGHT_API_TESTING.md)
- [Egyptian City Codes](./EGYPTIAN_CITY_CODES.md)
- [Database Structure](./DATABASE_SUMMARY.md)

---

## 🆘 Support

### Common Issues

**Issue: "Amadeus API credentials not configured"**
- Solution: Add `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` to `.env`

**Issue: "Database connection failed"**
- Solution: Verify database credentials in `.env`

**Issue: "Invalid JWT token"**
- Solution: Login again to get a fresh token

**Issue: "Rate limit exceeded"**
- Solution: Wait 15 minutes or implement request throttling

---

## 🚀 Deployment

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Docker
```bash
# Build image
docker build -t egytravel-api .

# Run container
docker run -p 3000:3000 --env-file .env egytravel-api
```

---

## 📝 Changelog

### Version 1.0.0 (December 2025)
- ✅ User authentication with JWT
- ✅ Hotel search and booking (Amadeus)
- ✅ Flight search and booking (Amadeus)
- ✅ Booking management
- ✅ Favorites/wishlist
- ✅ Egyptian city codes support
- ✅ Rate limiting
- ✅ Caching
- ✅ Error handling

---

## 📄 License

Copyright © 2025 EgyTravel. All rights reserved.

---

## 👥 Contributors

- Development Team
- API Integration Team
- Documentation Team

---

**Happy Coding! 🎉**

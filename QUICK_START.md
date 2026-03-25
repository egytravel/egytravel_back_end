# 🚀 Quick Start Guide - EgyTravel API

## Get Started in 5 Minutes!

### Step 1: Start the Server
```bash
npm start
```

**Expected Output:**
```
✅ EgyTravel Auth Server running on port 3000
✅ Database connected successfully
✅ Amadeus API configuration loaded
```

---

### Step 2: Test Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "EgyTravel Auth Service is running",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### Step 3: Test Flight Search (No Auth Required)

#### Search Domestic Flight (Cairo to Luxor)
```bash
curl "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2&travelClass=ECONOMY"
```

#### Search International Flight (Cairo to Dubai)
```bash
curl "http://localhost:3000/api/flights/search?origin=CAI&destination=DXB&departureDate=2025-12-20&returnDate=2025-12-27&adults=2&travelClass=BUSINESS"
```

---

### Step 4: Test Hotel Search (No Auth Required)

#### Search Hotels in Cairo
```bash
curl "http://localhost:3000/api/hotels/search?location=CAI&checkin=2025-12-20&checkout=2025-12-25&guests=2&rooms=1"
```

#### Search Hotels in Luxor
```bash
curl "http://localhost:3000/api/hotels/search?location=LXR&checkin=2025-12-20&checkout=2025-12-23&guests=2&rooms=1"
```

---

### Step 5: Test Location Search (No Auth Required)

#### Search Egyptian Cities
```bash
curl "http://localhost:3000/api/flights/locations?keyword=cairo"
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "LOCATIONS FOUND",
  "data": [
    {
      "code": "CAI",
      "name": "Cairo",
      "type": "city",
      "country": "Egypt",
      "airport": "Cairo International Airport"
    }
  ]
}
```

---

### Step 6: Register a User (For Booking Features)

```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User",
    "phone_number": "+201234567890"
  }'
```

**Save the token from the response!**

---

### Step 7: Create a Booking (Requires Auth)

```bash
curl -X POST "http://localhost:3000/api/bookings/hotel" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
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

## 🎯 Quick Reference

### Egyptian City Codes
| City | Code | Popular For |
|------|------|-------------|
| Cairo | CAI | Pyramids, Museums |
| Luxor | LXR | Valley of the Kings |
| Aswan | ASW | Abu Simbel, Nile |
| Hurghada | HRG | Red Sea, Diving |
| Sharm El Sheikh | SSH | Beaches, Resorts |

### Travel Classes
- `ECONOMY` - Standard economy
- `PREMIUM_ECONOMY` - Extra legroom
- `BUSINESS` - Business class
- `FIRST` - First class

### Date Format
Always use: `YYYY-MM-DD` (e.g., `2025-12-20`)

---

## 📚 Full Documentation

- **Complete API Guide**: [API_COMPLETE_GUIDE.md](./API_COMPLETE_GUIDE.md)
- **Flight API**: [FLIGHT_API_TESTING.md](./FLIGHT_API_TESTING.md)
- **Hotel API**: [HOTEL_API_TESTING.md](./HOTEL_API_TESTING.md)
- **City Codes**: [EGYPTIAN_CITY_CODES.md](./EGYPTIAN_CITY_CODES.md)
- **Authentication**: [AUTH_API_TESTING.md](./AUTH_API_TESTING.md)

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Database connection failed
- Check `.env` file has correct database credentials
- Verify Railway database is accessible

### Amadeus API errors
- Verify `AMADEUS_API_KEY` and `AMADEUS_API_SECRET` in `.env`
- Check if you're using test environment: `https://test.api.amadeus.com`

### "Rate limit exceeded"
- Wait 15 minutes
- Or restart the server to reset rate limits

---

## 🎉 You're Ready!

Your EgyTravel API is now running with:
- ✈️ Flight search
- 🏨 Hotel search
- 👤 User authentication
- 📅 Booking management
- ⭐ Favorites system

**Happy coding! 🚀**

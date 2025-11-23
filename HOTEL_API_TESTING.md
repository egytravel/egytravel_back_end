# Hotel Booking API - Testing Guide

## 🚀 Server Status

✅ **Server is running on:** `http://localhost:3000`  
✅ **Database:** Connected  
✅ **All endpoints:** Ready for testing

---

## 📋 Available Endpoints

### **1. Hotel Search & Details (Public)**

#### Search Hotels
```http
GET /api/hotels/search?location=Cairo&checkin=2025-12-01&checkout=2025-12-04&guests=2&rooms=1
```

**Query Parameters:**
- `location` (required) - City name or ID
- `checkin` (required) - Check-in date (YYYY-MM-DD)
- `checkout` (optional) - Check-out date (YYYY-MM-DD)
- `guests` (optional) - Number of guests (default: 2)
- `rooms` (optional) - Number of rooms (default: 1)

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "hotelId": "123456",
      "name": "Marriott Mena House",
      "location": "Giza, Cairo",
      "rating": 4.8,
      "price": {
        "amount": 150.00,
        "currency": "USD"
      },
      "mainImage": "https://..."
    }
  ],
  "cached": false
}
```

#### Get Hotel Details
```http
GET /api/hotels/:hotelId?checkin=2025-12-01&checkout=2025-12-04
```

---

### **2. Booking Management (Requires Authentication)**

#### Create Hotel Booking
```http
POST /api/bookings/hotel
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "hotelId": "123456",
  "hotelName": "Marriott Mena House",
  "hotelLocation": "Giza, Cairo",
  "hotelAddress": "6 Pyramids Road, Giza",
  "checkinDate": "2025-12-01",
  "checkoutDate": "2025-12-04",
  "guests": 2,
  "rooms": 1,
  "tripId": 1,
  "totalPrice": 450.00,
  "currency": "USD",
  "notes": "Request early check-in"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": 1,
    "userId": 1,
    "bookingUrl": "https://www.booking.com/hotel/eg/123456.html?aid=YOUR_AFFILIATE_ID&checkin=2025-12-01...",
    "status": "pending",
    ...
  }
}
```

#### Get All Bookings
```http
GET /api/bookings
Authorization: Bearer YOUR_JWT_TOKEN
```

**Optional Query Parameters:**
- `tripId` - Filter by trip
- `status` - Filter by status (pending, confirmed, cancelled, completed)
- `type` - Filter by type (hotel, flight, activity)

#### Get Single Booking
```http
GET /api/bookings/:bookingId
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Update Booking
```http
PUT /api/bookings/:bookingId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "confirmed",
  "bookingReference": "BK-123456789",
  "notes": "Confirmed via email"
}
```

#### Delete Booking
```http
DELETE /api/bookings/:bookingId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### **3. Favorites Management (Requires Authentication)**

#### Add Hotel to Favorites
```http
POST /api/favorites/hotel
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "hotelId": "123456",
  "hotelName": "Marriott Mena House",
  "location": "Giza, Cairo",
  "imageUrl": "https://...",
  "priceData": {
    "amount": 150,
    "currency": "USD"
  },
  "notes": "Perfect for honeymoon!",
  "tags": "luxury,cairo,pyramids"
}
```

#### Get All Favorites
```http
GET /api/favorites
Authorization: Bearer YOUR_JWT_TOKEN
```

**Optional Query Parameters:**
- `type` - Filter by type (hotel, place, restaurant, etc.)

#### Remove from Favorites
```http
DELETE /api/favorites/:favoriteId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 Testing with Postman

### Step 1: Get Authentication Token

1. **Register a user:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456",
  "firstName": "Test",
  "lastName": "User"
}
```

2. **Login:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123456"
}
```

3. **Copy the `accessToken` from the response**

### Step 2: Test Hotel Search (No Auth Required)

```http
GET http://localhost:3000/api/hotels/search?location=Cairo&checkin=2025-12-01&checkout=2025-12-04
```

### Step 3: Create a Booking (Auth Required)

```http
POST http://localhost:3000/api/bookings/hotel
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "hotelId": "test-hotel-123",
  "hotelName": "Test Hotel Cairo",
  "hotelLocation": "Cairo, Egypt",
  "checkinDate": "2025-12-01",
  "checkoutDate": "2025-12-04",
  "guests": 2,
  "rooms": 1,
  "totalPrice": 300.00
}
```

### Step 4: Get Your Bookings

```http
GET http://localhost:3000/api/bookings
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Step 5: Add to Favorites

```http
POST http://localhost:3000/api/favorites/hotel
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "hotelId": "test-hotel-123",
  "hotelName": "Test Hotel Cairo",
  "location": "Cairo, Egypt",
  "imageUrl": "https://example.com/image.jpg",
  "notes": "Looks amazing!"
}
```

---

## ⚠️ Important Notes

### Booking.com API Configuration

**The hotel search currently uses placeholder data** because you need to:

1. **Sign up for Booking.com Affiliate Program:**
   - Visit: https://www.booking.com/affiliate
   - Get approved (1-2 days)
   - Receive your API credentials

2. **Update `.env` file:**
```env
BOOKING_API_USERNAME=your-actual-username
BOOKING_API_PASSWORD=your-actual-password
BOOKING_AFFILIATE_ID=your-actual-affiliate-id
```

3. **Restart the server** after updating credentials

### Current Behavior

- ✅ **All endpoints work** and return proper responses
- ✅ **Database operations** (create, read, update, delete bookings)
- ✅ **Authentication** and authorization
- ✅ **Caching** system active
- ⚠️ **Hotel search** returns placeholder data until Booking.com API is configured

---

## 🔍 Testing Validation

### Test Invalid Dates
```http
GET /api/hotels/search?location=Cairo&checkin=2025-12-04&checkout=2025-12-01
```
**Expected:** Error - "Check-in date must be before check-out date"

### Test Missing Parameters
```http
GET /api/hotels/search?checkin=2025-12-01
```
**Expected:** Error - "Location is required"

### Test Unauthorized Access
```http
GET /api/bookings
```
(Without Authorization header)
**Expected:** 401 Unauthorized

---

## 📊 Response Codes

- `200` - Success
- `201` - Created (booking/favorite)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (booking/hotel not found)
- `409` - Conflict (duplicate favorite)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (API down)
- `504` - Gateway Timeout (API timeout)

---

## 🎯 Next Steps

1. ✅ Test all endpoints with Postman
2. ⏳ Sign up for Booking.com Affiliate Program
3. ⏳ Configure real API credentials
4. ⏳ Test with real hotel data
5. ⏳ Implement property-based tests
6. ⏳ Deploy to production

---

**Happy Testing! 🚀**

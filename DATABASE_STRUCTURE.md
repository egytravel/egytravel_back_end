# EgyTravel Database Structure

## 📊 Overview

The EgyTravel database is designed to support a comprehensive tourism platform for Egypt, including user authentication, trip planning, hotel/flight bookings, favorites management, and user feedback.

## 🗄️ Database Tables

### 1. **users** (Authentication & Profiles)
Primary table for user authentication and profile management.

**Columns:**
- `user_id` (PK) - Auto-increment user identifier
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - ENUM('user', 'admin') - User role
- `created_at` - Account creation timestamp

**Purpose:** Manages all user accounts (tourists and admins)

---

### 2. **trips** (Trip Planning)
Stores user-created trip plans.

**Columns:**
- `trip_id` (PK) - Auto-increment trip identifier
- `user_id` (FK → users.user_id) - Trip owner
- `title` - Trip name/title
- `description` - Trip description
- `destination` - Primary destination
- `start_date` - Trip start date
- `end_date` - Trip end date
- `budget` - Estimated budget (DECIMAL)
- `status` - ENUM('planning', 'confirmed', 'completed', 'cancelled')
- `created_at`, `updated_at` - Timestamps

**Purpose:** Main trip planning and organization

**Example:**
```json
{
  "title": "Egypt Adventure - 7 Days",
  "destination": "Cairo, Luxor, Aswan",
  "start_date": "2025-12-01",
  "end_date": "2025-12-07",
  "budget": 2000.00,
  "status": "planning"
}
```

---

### 3. **trip_days** (Daily Itinerary)
Day-by-day itinerary for each trip.

**Columns:**
- `day_id` (PK) - Auto-increment day identifier
- `trip_id` (FK → trips.trip_id) - Parent trip
- `day_number` - Day number in trip (1, 2, 3...)
- `date` - Specific date for this day
- `title` - Day title (e.g., "Pyramids Tour")
- `description` - Day description
- `activities` - JSON array of activities
- `locations` - JSON array of locations
- `budget` - Daily budget (DECIMAL)
- `notes` - User notes
- `created_at`, `updated_at` - Timestamps

**Unique Constraint:** (trip_id, day_number)

**Purpose:** Detailed daily planning within trips

**Example:**
```json
{
  "trip_id": 1,
  "day_number": 1,
  "date": "2025-12-01",
  "title": "Arrival in Cairo",
  "activities": ["Airport pickup", "Hotel check-in", "Dinner at Nile"],
  "locations": ["Cairo Airport", "Hotel Pyramids", "Nile Restaurant"],
  "budget": 100.00,
  "notes": "Request early check-in"
}
```

---

### 4. **bookings** (Hotels, Flights, Activities)
Universal booking table supporting multiple booking types.

**Columns:**

**Common Fields:**
- `booking_id` (PK) - Auto-increment booking identifier
- `user_id` (FK → users.user_id) - Booking owner
- `trip_id` (FK → trips.trip_id) - Associated trip (optional)
- `booking_type` - ENUM('hotel', 'flight', 'activity', 'transport')
- `provider` - Provider name (e.g., "Booking.com", "Skyscanner")
- `booking_url` - Affiliate/redirect link
- `booking_reference` - Confirmation number
- `status` - ENUM('pending', 'confirmed', 'cancelled', 'completed')
- `total_price` - Total price (DECIMAL)
- `currency` - Currency code (default: 'USD')
- `booking_data` - JSON for additional data
- `notes` - User notes
- `created_at`, `updated_at` - Timestamps

**Hotel-Specific Fields:**
- `hotel_id` - External hotel ID
- `hotel_name` - Hotel name
- `hotel_location` - Hotel location
- `hotel_address` - Full address
- `check_in_date` - Check-in date
- `check_out_date` - Check-out date
- `guests` - Number of guests
- `rooms` - Number of rooms

**Flight-Specific Fields:**
- `flight_id` - External flight ID
- `airline` - Airline name
- `flight_number` - Flight number
- `departure_airport` - Departure airport code
- `arrival_airport` - Arrival airport code
- `departure_date` - Departure datetime
- `arrival_date` - Arrival datetime
- `departure_city` - Departure city
- `arrival_city` - Arrival city
- `passengers` - Number of passengers
- `cabin_class` - ENUM('economy', 'premium_economy', 'business', 'first')
- `baggage_info` - Baggage allowance

**Purpose:** Unified booking management for all travel services

**Hotel Booking Example:**
```json
{
  "booking_type": "hotel",
  "provider": "Booking.com",
  "hotel_name": "Marriott Mena House",
  "hotel_location": "Giza, Cairo",
  "check_in_date": "2025-12-01",
  "check_out_date": "2025-12-04",
  "guests": 2,
  "rooms": 1,
  "total_price": 450.00,
  "status": "confirmed"
}
```

**Flight Booking Example:**
```json
{
  "booking_type": "flight",
  "provider": "Skyscanner",
  "airline": "EgyptAir",
  "flight_number": "MS 777",
  "departure_airport": "JFK",
  "arrival_airport": "CAI",
  "departure_date": "2025-12-01 18:30:00",
  "arrival_date": "2025-12-02 10:45:00",
  "passengers": 2,
  "cabin_class": "economy",
  "total_price": 850.00,
  "status": "confirmed"
}
```

---

### 5. **favorites** (Universal Wishlist)
Stores user favorites for hotels, places, itineraries, etc.

**Columns:**
- `favorite_id` (PK) - Auto-increment favorite identifier
- `user_id` (FK → users.user_id) - Favorite owner
- `item_type` - ENUM('hotel', 'place', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip')
- `item_id` - External or internal item ID
- `item_name` - Item name
- `item_description` - Item description
- `item_image_url` - Image URL
- `item_location` - Location
- `item_data` - JSON for additional data
- `notes` - User personal notes
- `tags` - Comma-separated tags
- `saved_at` - Save timestamp

**Unique Constraint:** (user_id, item_type, item_id)

**Purpose:** Universal favorites/wishlist system

**Example:**
```json
{
  "item_type": "hotel",
  "item_id": "booking_com_12345",
  "item_name": "Marriott Mena House",
  "item_location": "Giza, Cairo",
  "item_data": {
    "price_per_night": 150,
    "rating": 4.8,
    "amenities": ["Pool", "Spa", "Restaurant"]
  },
  "notes": "Perfect for honeymoon!",
  "tags": "luxury,cairo,pyramids"
}
```

---

### 6. **feedback** (Reviews & Ratings)
User feedback for trips and bookings.

**Columns:**
- `feedback_id` (PK) - Auto-increment feedback identifier
- `user_id` (FK → users.user_id) - Reviewer
- `trip_id` (FK → trips.trip_id) - Related trip (optional)
- `booking_id` (FK → bookings.booking_id) - Related booking (optional)
- `rating` - Rating (1-5)
- `comment` - Review text
- `created_at`, `updated_at` - Timestamps

**Purpose:** Collect user reviews and ratings

---

### 7. **password_reset_tokens** (Security)
Temporary tokens for password reset functionality.

**Columns:**
- `id` (PK) - Auto-increment token identifier
- `user_id` (FK → users.user_id) - User requesting reset
- `token` - Unique reset token
- `expires_at` - Token expiration datetime
- `used` - Boolean flag
- `created_at`, `updated_at` - Timestamps

**Purpose:** Secure password reset mechanism

---

## 🔗 Database Relationships

```
users (1) ──→ (N) trips
              ├──→ (N) trip_days
              └──→ (N) bookings
users (1) ──→ (N) favorites
users (1) ──→ (N) feedback
users (1) ──→ (N) password_reset_tokens

trips (1) ──→ (N) trip_days
trips (1) ──→ (N) bookings
trips (1) ──→ (N) feedback

bookings (1) ──→ (N) feedback
```

---

## 🚀 Implementation Phases

### **Phase 1: Authentication (✅ Complete)**
- User registration & login
- JWT authentication
- Password reset
- Role-based access control

### **Phase 2: Hotel Booking (🔄 Next)**
- Booking.com API integration
- Hotel search & display
- Save hotel bookings
- Redirect to Booking.com for payment

### **Phase 3: Trip Planning**
- Create/edit trips
- Day-by-day itinerary management
- Budget tracking

### **Phase 4: Favorites System**
- Add/remove favorites
- Filter by type
- Tag management

### **Phase 5: Flight Booking (Future)**
- Skyscanner API integration
- Flight search & display
- Save flight bookings
- Redirect to flight provider

### **Phase 6: Feedback & Reviews**
- Trip reviews
- Booking reviews
- Rating system

---

## 📝 API Integration Strategy

### **Hotels: Booking.com**
- **API:** Booking.com Affiliate API
- **Payment:** Redirect to Booking.com
- **Cost:** Free (commission-based)
- **Coverage:** Excellent Egypt coverage

### **Flights: Skyscanner (Future)**
- **API:** Skyscanner Flight Search API
- **Payment:** Redirect to airline/OTA
- **Cost:** Free tier available
- **Coverage:** Global coverage

---

## 🔒 Security Considerations

1. **Foreign Keys:** All relationships use CASCADE for data integrity
2. **Unique Constraints:** Prevent duplicate favorites and trip days
3. **Indexes:** Optimized for common queries (user_id, dates, status)
4. **JSON Fields:** Flexible storage for provider-specific data
5. **ENUM Types:** Enforce valid values for status, roles, types

---

## 📊 Database Statistics

- **Total Tables:** 7
- **Total Relationships:** 10+ foreign keys
- **Supported Booking Types:** Hotels, Flights, Activities, Transport
- **Supported Favorite Types:** 7 types (hotels, places, itineraries, etc.)

---

## ✅ Changes Completed

1. ✅ Dropped `admins` table (redundant with users.role)
2. ✅ Created `trips` table
3. ✅ Created `trip_days` table (day-by-day itinerary)
4. ✅ Created `bookings` table (universal: hotels + flights + activities)
5. ✅ Created `favorites` table (universal wishlist)
6. ✅ Created `feedback` table
7. ✅ All foreign keys updated to reference `users.user_id`

---

**Database is now ready for Phase 2: Hotel Booking Implementation! 🎉**

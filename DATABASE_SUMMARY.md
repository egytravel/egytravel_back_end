# EgyTravel Database Summary

## 📊 Database Overview

**Database Type:** MySQL (Railway hosted)  
**ORM:** Sequelize  
**Total Tables:** 7

---

## 🗄️ Database Tables

### 1. **users** - User Authentication
```sql
Primary Key: user_id
Fields:
  - user_id (INT, AUTO_INCREMENT)
  - name (VARCHAR 100)
  - email (VARCHAR 100, UNIQUE)
  - password (VARCHAR 255, HASHED)
  - role (ENUM: 'user', 'admin')
  - created_at (TIMESTAMP)
```
**Purpose:** Stores all user accounts (tourists and admins)

---

### 2. **trips** - Trip Planning
```sql
Primary Key: trip_id
Foreign Keys: user_id → users.user_id
Fields:
  - trip_id (INT, AUTO_INCREMENT)
  - user_id (INT)
  - title (VARCHAR 200)
  - description (TEXT)
  - destination (VARCHAR 200)
  - start_date (DATE)
  - end_date (DATE)
  - budget (DECIMAL 10,2)
  - status (ENUM: 'planning', 'confirmed', 'completed', 'cancelled')
  - created_at, updated_at (TIMESTAMP)
```
**Purpose:** User-created trip plans

---

### 3. **trip_days** - Daily Itinerary
```sql
Primary Key: day_id
Foreign Keys: trip_id → trips.trip_id
Unique Constraint: (trip_id, day_number)
Fields:
  - day_id (INT, AUTO_INCREMENT)
  - trip_id (INT)
  - day_number (INT)
  - date (DATE)
  - title (VARCHAR 200)
  - description (TEXT)
  - activities (JSON)
  - locations (JSON)
  - budget (DECIMAL 10,2)
  - notes (TEXT)
  - created_at, updated_at (TIMESTAMP)
```
**Purpose:** Day-by-day itinerary for each trip

---

### 4. **bookings** - Universal Bookings (Hotels, Flights, Activities)
```sql
Primary Key: booking_id
Foreign Keys: 
  - user_id → users.user_id
  - trip_id → trips.trip_id (nullable)
Fields:
  - booking_id (INT, AUTO_INCREMENT)
  - user_id (INT)
  - trip_id (INT, nullable)
  - booking_type (ENUM: 'hotel', 'flight', 'activity', 'transport')
  - provider (VARCHAR 100) - e.g., "Booking.com"
  - booking_url (TEXT) - Affiliate link
  - booking_reference (VARCHAR 200) - Confirmation number
  - status (ENUM: 'pending', 'confirmed', 'cancelled', 'completed')
  - total_price (DECIMAL 10,2)
  - currency (VARCHAR 3)
  
  # Hotel-specific fields:
  - hotel_id (VARCHAR 100)
  - hotel_name (VARCHAR 200)
  - hotel_location (VARCHAR 200)
  - hotel_address (TEXT)
  - check_in_date (DATE)
  - check_out_date (DATE)
  - guests (INT)
  - rooms (INT)
  
  # Flight-specific fields:
  - flight_id (VARCHAR 100)
  - airline (VARCHAR 100)
  - flight_number (VARCHAR 20)
  - departure_airport (VARCHAR 100)
  - arrival_airport (VARCHAR 100)
  - departure_date (DATETIME)
  - arrival_date (DATETIME)
  - departure_city (VARCHAR 100)
  - arrival_city (VARCHAR 100)
  - passengers (INT)
  - cabin_class (ENUM: 'economy', 'premium_economy', 'business', 'first')
  - baggage_info (VARCHAR 200)
  
  - booking_data (JSON) - Additional data
  - notes (TEXT)
  - created_at, updated_at (TIMESTAMP)
```
**Purpose:** Stores all booking records (hotels, flights, activities)

---

### 5. **favorites** - Universal Wishlist
```sql
Primary Key: favorite_id
Foreign Keys: user_id → users.user_id
Unique Constraint: (user_id, item_type, item_id)
Fields:
  - favorite_id (INT, AUTO_INCREMENT)
  - user_id (INT)
  - item_type (ENUM: 'hotel', 'place', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip')
  - item_id (VARCHAR 200) - External or internal ID
  - item_name (VARCHAR 300)
  - item_description (TEXT)
  - item_image_url (VARCHAR 500)
  - item_location (VARCHAR 200)
  - item_data (JSON) - Additional data
  - notes (TEXT) - User notes
  - tags (VARCHAR 500) - Comma-separated tags
  - saved_at (TIMESTAMP)
```
**Purpose:** User favorites/wishlist for hotels, places, restaurants, etc.

---

### 6. **feedback** - Reviews & Ratings
```sql
Primary Key: feedback_id
Foreign Keys:
  - user_id → users.user_id
  - trip_id → trips.trip_id (nullable)
  - booking_id → bookings.booking_id (nullable)
Fields:
  - feedback_id (INT, AUTO_INCREMENT)
  - user_id (INT)
  - trip_id (INT, nullable)
  - booking_id (INT, nullable)
  - rating (INT, 1-5)
  - comment (TEXT)
  - created_at, updated_at (TIMESTAMP)
```
**Purpose:** User reviews and ratings for trips and bookings

---

### 7. **password_reset_tokens** - Password Reset
```sql
Primary Key: id
Foreign Keys: user_id → users.user_id
Fields:
  - id (INT, AUTO_INCREMENT)
  - user_id (INT)
  - token (VARCHAR 255, UNIQUE)
  - expires_at (DATETIME)
  - used (BOOLEAN)
  - created_at, updated_at (TIMESTAMP)
```
**Purpose:** Secure password reset tokens

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

## 🚀 Current Implementation Status

### ✅ Completed:
1. **Authentication System** - User registration, login, JWT tokens
2. **Database Structure** - All 7 tables created and migrated
3. **Models** - Sequelize models for all tables with associations
4. **Password Reset** - Secure token-based password reset

### 🔄 In Progress:
1. **Hotel Booking** - Booking.com API integration
   - Search hotels
   - View hotel details
   - Save booking records
   - Generate affiliate links for commission

### 📋 Planned:
1. **Trip Planning** - Create and manage trips with daily itineraries
2. **Favorites System** - Save hotels, places, restaurants
3. **Flight Booking** - Skyscanner API integration (Phase 2)
4. **Feedback System** - Reviews and ratings

---

## 🔌 API Integrations

### Current:
- **Booking.com API** - Hotel search and booking (affiliate program)
  - Commission: 25-40% of Booking.com's commission
  - Payment: Handled by Booking.com (redirect flow)

### Future:
- **Skyscanner API** - Flight search and booking
- **GetYourGuide API** - Activities and tours

---

## 💾 Database Connection

**Host:** hopper.proxy.rlwy.net  
**Port:** 26891  
**Database:** railway  
**User:** root  
**Connection:** MySQL via Sequelize ORM

---

## 📝 Key Design Decisions

1. **Universal Bookings Table** - Single table for hotels, flights, activities (future-proof)
2. **Universal Favorites Table** - Single table for all favorite types
3. **No Payment Processing** - Redirect to providers (Booking.com, Skyscanner)
4. **Affiliate Model** - Earn commission without handling payments
5. **JSON Fields** - Flexible storage for provider-specific data
6. **Soft Relationships** - Bookings can exist without trips (trip_id nullable)

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Foreign key constraints for data integrity
- ✅ Unique constraints to prevent duplicates
- ✅ No payment data stored (PCI compliance not required)
- ✅ Rate limiting on API endpoints

---

## 📊 Sample Data Flow

### Hotel Booking Flow:
```
1. User searches hotels → Booking.com API
2. User selects hotel → Save to bookings table
3. Generate affiliate link → booking_url field
4. Redirect user to Booking.com → User pays there
5. User updates status → booking.status = 'confirmed'
```

### Trip Planning Flow:
```
1. User creates trip → trips table
2. Add daily itinerary → trip_days table
3. Add hotel booking → bookings table (with trip_id)
4. View trip → Shows all bookings and daily plans
```

---

## 📞 Contact

For database access or questions, contact the backend team.

**Last Updated:** December 2024

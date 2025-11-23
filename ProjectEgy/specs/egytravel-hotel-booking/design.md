# EgyTravel Hotel Booking Design

## Overview

The EgyTravel Hotel Booking system is a Node.js/Express-based service that integrates with Booking.com's API to provide hotel search and booking capabilities for tourists visiting Egypt. The system fetches real-time hotel data, allows users to save booking records, and redirects users to Booking.com for secure payment processing. This design eliminates PCI compliance requirements and payment processing complexity by leveraging Booking.com's established payment infrastructure.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │  Flutter Mobile │
│   Application   │    │   Application   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┘
                    │
          ┌─────────────────────┐
          │  Express.js API     │
          │  Hotel Service      │
          └─────────┬───────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    ┌─────────────┐    ┌─────────────┐
    │ Booking.com │    │   MySQL     │
    │     API     │    │  Database   │
    └─────────────┘    └─────────────┘
```

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Railway) with Sequelize ORM
- **External API**: Booking.com Affiliate API
- **HTTP Client**: axios
- **Authentication**: JWT (from existing auth system)
- **Caching**: node-cache (in-memory caching)
- **Rate Limiting**: express-rate-limit
- **Environment Management**: dotenv

## Components and Interfaces

### 1. Project Structure
```
egytravel-backend/
├── src/
│   ├── config/
│   │   ├── database.js (existing)
│   │   └── bookingcom.js (new)
│   ├── controllers/
│   │   ├── hotelController.js (new)
│   │   └── bookingController.js (new)
│   ├── middleware/
│   │   ├── auth.js (existing)
│   │   └── cacheMiddleware.js (new)
│   ├── models/
│   │   └── sql/
│   │       ├── Booking.js (new)
│   │       ├── Favorite.js (new)
│   │       └── Trip.js (new)
│   ├── routes/
│   │   ├── hotels.js (new)
│   │   └── bookings.js (new)
│   ├── services/
│   │   ├── bookingcomService.js (new)
│   │   ├── hotelService.js (new)
│   │   └── cacheService.js (new)
│   └── utils/
│       ├── affiliateLink.js (new)
│       └── validators.js (new)
```

### 2. API Endpoints

#### Hotel Search Routes (`/api/hotels`)
- `GET /search` - Search hotels by location and dates
  - Query params: `location`, `checkin`, `checkout`, `guests`, `rooms`
  - Returns: Array of hotel search results
  
- `GET /:hotelId` - Get detailed hotel information
  - Params: `hotelId`
  - Query params: `checkin`, `checkout`, `guests`, `rooms`
  - Returns: Detailed hotel object with rooms and pricing

#### Booking Management Routes (`/api/bookings`)
- `POST /hotel` - Save hotel booking record
  - Body: `{ hotelId, hotelName, location, checkinDate, checkoutDate, guests, rooms, tripId?, totalPrice, currency }`
  - Returns: Booking record with affiliate link
  
- `GET /` - Get user's bookings
  - Query params: `tripId?`, `status?`, `type?`
  - Returns: Array of booking records
  
- `GET /:bookingId` - Get specific booking
  - Params: `bookingId`
  - Returns: Booking record
  
- `PUT /:bookingId` - Update booking status/notes
  - Body: `{ status?, bookingReference?, notes? }`
  - Returns: Updated booking record
  
- `DELETE /:bookingId` - Delete booking record
  - Params: `bookingId`
  - Returns: Success confirmation

#### Favorites Routes (`/api/favorites`)
- `POST /hotel` - Add hotel to favorites
  - Body: `{ hotelId, hotelName, location, imageUrl, priceData }`
  - Returns: Favorite record
  
- `GET /` - Get user's favorites
  - Query params: `type?`
  - Returns: Array of favorite items
  
- `DELETE /:favoriteId` - Remove from favorites
  - Params: `favoriteId`
  - Returns: Success confirmation

### 3. Booking.com API Integration

#### API Configuration
```javascript
// Booking.com API endpoints
const BOOKING_API_BASE = 'https://distribution-xml.booking.com/2.7/json';

// Required credentials
const BOOKING_API_CONFIG = {
  username: process.env.BOOKING_API_USERNAME,
  password: process.env.BOOKING_API_PASSWORD,
  affiliateId: process.env.BOOKING_AFFILIATE_ID
};
```

#### Key API Methods

**Hotel Search:**
```javascript
GET /hotels
Parameters:
- city_ids: City ID for search location
- checkin: Check-in date (YYYY-MM-DD)
- checkout: Check-out date (YYYY-MM-DD)
- guest_qty: Number of guests
- room_qty: Number of rooms
- extras: Additional data (photos, reviews, etc.)
```

**Hotel Details:**
```javascript
GET /hotels/{hotel_id}
Parameters:
- hotel_ids: Specific hotel ID
- checkin: Check-in date
- checkout: Check-out date
- guest_qty: Number of guests
- extras: photos,description,facilities,reviews
```

#### Affiliate Link Generation

**What is an Affiliate Link?**
An affiliate link is a special URL that includes EgyTravel's unique affiliate ID. When users click this link and complete a booking on Booking.com, EgyTravel earns a commission (typically 25-40% of Booking.com's commission, which is 4-6% of the booking value). This allows EgyTravel to monetize hotel bookings without handling payments.

**Example:**
- Normal link: `https://www.booking.com/hotel/eg/marriott.html`
- Affiliate link: `https://www.booking.com/hotel/eg/marriott.html?aid=YOUR_ID&checkin=2025-12-01`

**Commission Flow:**
1. User books $500 hotel through EgyTravel's affiliate link
2. Booking.com earns 15% commission = $75
3. EgyTravel earns 30% of $75 = $22.50

```javascript
// Generate Booking.com affiliate link with EgyTravel's affiliate ID
function generateAffiliateLink(hotelId, checkin, checkout, guests, rooms) {
  const baseUrl = 'https://www.booking.com/hotel/eg';
  const params = new URLSearchParams({
    aid: BOOKING_AFFILIATE_ID, // EgyTravel's unique affiliate ID
    checkin: checkin,
    checkout: checkout,
    group_adults: guests,
    no_rooms: rooms,
    selected_currency: 'USD'
  });
  return `${baseUrl}/${hotelId}.html?${params.toString()}`;
}
```

**How to Get Affiliate ID:**
1. Sign up at https://www.booking.com/affiliate
2. Get approved (1-2 days)
3. Receive unique affiliate ID
4. Add to `.env`: `BOOKING_AFFILIATE_ID=your_id`

## Data Models

### Booking Model (Sequelize)
```javascript
const Booking = sequelize.define('Booking', {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'trips', key: 'trip_id' }
  },
  booking_type: {
    type: DataTypes.ENUM('hotel', 'flight', 'activity', 'transport'),
    allowNull: false,
    defaultValue: 'hotel'
  },
  provider: {
    type: DataTypes.STRING(100),
    defaultValue: 'Booking.com'
  },
  booking_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  booking_reference: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  // Hotel-specific fields
  hotel_id: DataTypes.STRING(100),
  hotel_name: DataTypes.STRING(200),
  hotel_location: DataTypes.STRING(200),
  hotel_address: DataTypes.TEXT,
  check_in_date: DataTypes.DATEONLY,
  check_out_date: DataTypes.DATEONLY,
  guests: DataTypes.INTEGER,
  rooms: DataTypes.INTEGER,
  booking_data: DataTypes.JSON,
  notes: DataTypes.TEXT
}, {
  tableName: 'bookings',
  underscored: true,
  timestamps: true
});
```

### Favorite Model (Sequelize)
```javascript
const Favorite = sequelize.define('Favorite', {
  favorite_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  item_type: {
    type: DataTypes.ENUM('hotel', 'place', 'itinerary', 'activity', 'restaurant', 'attraction', 'trip'),
    allowNull: false
  },
  item_id: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  item_name: DataTypes.STRING(300),
  item_description: DataTypes.TEXT,
  item_image_url: DataTypes.STRING(500),
  item_location: DataTypes.STRING(200),
  item_data: DataTypes.JSON,
  notes: DataTypes.TEXT,
  tags: DataTypes.STRING(500),
  saved_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'favorites',
  underscored: true,
  timestamps: false
});
```

### Hotel Search Response Format
```javascript
{
  "hotelId": "123456",
  "name": "Marriott Mena House",
  "location": "Giza, Cairo",
  "address": "6 Pyramids Road, Giza",
  "rating": 4.8,
  "reviewCount": 2543,
  "price": {
    "amount": 150.00,
    "currency": "USD",
    "perNight": true
  },
  "mainImage": "https://...",
  "amenities": ["Pool", "Spa", "WiFi", "Restaurant"],
  "coordinates": {
    "latitude": 29.9792,
    "longitude": 31.1342
  }
}
```

## Data Models


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid search returns results or empty array
*For any* valid search query with location and dates, the system should return either an array of hotel results or an empty array, never null or undefined.
**Validates: Requirements 1.1, 1.5**

### Property 2: Check-in date validation
*For any* search or booking request, if check-in date is greater than or equal to check-out date, the system should reject the request with a validation error.
**Validates: Requirements 1.2**

### Property 3: Required search parameters
*For any* search request missing location or check-in date, the system should reject the request with a validation error.
**Validates: Requirements 1.3**

### Property 4: Search result structure completeness
*For any* hotel in search results, the result object should contain hotel name, location, price, rating, and primary image fields.
**Validates: Requirements 1.4**

### Property 5: Hotel details structure completeness
*For any* hotel details response, the object should contain name, full address, description, amenities, images array, room options, pricing, rating, and review count.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 6: Booking creation persistence
*For any* valid booking data submitted by an authenticated user, a booking record should be created in the database with all provided fields stored.
**Validates: Requirements 3.1, 3.2**

### Property 7: Affiliate link generation
*For any* booking creation, the generated affiliate link should contain the EgyTravel affiliate ID and all booking parameters (hotel ID, check-in, check-out, guests, rooms).
**Validates: Requirements 3.3, 4.2**

### Property 8: Trip association persistence
*For any* booking created with a trip ID, the booking record should store the trip_id and maintain the foreign key relationship.
**Validates: Requirements 3.4**

### Property 9: Default booking status
*For any* newly created booking without explicit status, the status field should be set to 'pending'.
**Validates: Requirements 3.5**

### Property 10: No payment data storage
*For any* booking record in the database, there should be no fields containing credit card numbers, CVV, or other payment credentials.
**Validates: Requirements 4.4**

### Property 11: User booking retrieval completeness
*For any* authenticated user requesting their bookings, all booking records with matching user_id should be returned.
**Validates: Requirements 5.1**

### Property 12: Trip filter correctness
*For any* booking query filtered by trip_id, all returned bookings should have that trip_id, and no bookings with different trip_ids should be included.
**Validates: Requirements 5.2**

### Property 13: Status filter correctness
*For any* booking query filtered by status, all returned bookings should have that status, and no bookings with different statuses should be included.
**Validates: Requirements 5.3**

### Property 14: Booking sort order
*For any* set of bookings returned to a user, they should be ordered by check_in_date in ascending order.
**Validates: Requirements 5.4**

### Property 15: Booking authorization
*For any* booking update or deletion request, the system should verify that the booking's user_id matches the authenticated user's ID before allowing the operation.
**Validates: Requirements 6.2, 10.1**

### Property 16: Timestamp update on modification
*For any* booking update operation, the updated_at timestamp should be changed to the current time.
**Validates: Requirements 6.5**

### Property 17: Favorite uniqueness
*For any* user and hotel combination, attempting to add the same hotel to favorites twice should not create duplicate records.
**Validates: Requirements 7.3**

### Property 18: Favorite retrieval completeness
*For any* authenticated user requesting their favorites, all favorite records with matching user_id and item_type 'hotel' should be returned.
**Validates: Requirements 7.4**

### Property 19: API request timeout
*For any* external API request to Booking.com, the request should timeout and return an error if not completed within 30 seconds.
**Validates: Requirements 9.3**

### Property 20: API retry behavior
*For any* failed API request due to network error, the system should retry the request up to 2 additional times before returning an error.
**Validates: Requirements 9.4**

### Property 21: Cache effectiveness
*For any* hotel details request for the same hotel ID within the cache TTL period, the second request should return cached data without calling the external API.
**Validates: Requirements 9.5**

### Property 22: Booking deletion completeness
*For any* booking deletion by an authorized user, the booking record should be permanently removed from the database and subsequent queries should not return it.
**Validates: Requirements 10.2**

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid input parameters
- `AUTHENTICATION_REQUIRED` - Missing or invalid JWT token
- `AUTHORIZATION_FAILED` - User not authorized for this resource
- `HOTEL_NOT_FOUND` - Hotel ID not found in Booking.com
- `BOOKING_NOT_FOUND` - Booking record not found
- `FAVORITE_ALREADY_EXISTS` - Hotel already in favorites
- `API_UNAVAILABLE` - Booking.com API is unavailable
- `API_TIMEOUT` - API request exceeded timeout
- `API_RATE_LIMIT` - Too many API requests
- `INVALID_DATE_RANGE` - Check-in date must be before check-out
- `MISSING_REQUIRED_PARAMS` - Required parameters missing
- `DATABASE_ERROR` - Database operation failed

### Error Handling Strategy

1. **API Errors**: Wrap all Booking.com API calls in try-catch blocks
2. **Validation Errors**: Validate all inputs before processing
3. **Authorization Errors**: Check user ownership before updates/deletes
4. **Timeout Handling**: Implement 30-second timeout for all API calls
5. **Retry Logic**: Retry failed API calls up to 2 times with exponential backoff
6. **Graceful Degradation**: Return cached data if API is unavailable

## Testing Strategy

### Unit Tests
- Affiliate link generation with various parameters
- Date validation logic (check-in before check-out)
- Search parameter validation
- Booking record creation and updates
- Favorite duplicate prevention
- Authorization checks for user-owned resources

### Property-Based Tests
- Property 2: Check-in date validation across random date pairs
- Property 3: Required parameter validation across various input combinations
- Property 4: Search result structure validation across random results
- Property 7: Affiliate link parameter inclusion across random bookings
- Property 12: Trip filter correctness across random booking sets
- Property 15: Authorization checks across random user/booking combinations
- Property 17: Favorite uniqueness across repeated additions
- Property 21: Cache effectiveness across repeated requests

### Integration Tests
- End-to-end hotel search flow
- End-to-end booking creation and retrieval
- Booking.com API integration (with test credentials)
- Database operations for bookings and favorites
- Authentication middleware integration

### API Testing
- Mock Booking.com API responses for consistent testing
- Test API timeout handling
- Test API retry logic
- Test rate limiting behavior
- Test error response formats

### Test Framework
- **Unit Testing**: Jest
- **Property-Based Testing**: fast-check (JavaScript PBT library)
- **API Mocking**: nock or msw (Mock Service Worker)
- **Test Database**: Separate test MySQL database

## Caching Strategy

### Cache Implementation
```javascript
const NodeCache = require('node-cache');
const hotelCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 600 // Check for expired keys every 10 minutes
});
```

### Cached Data
1. **Hotel Search Results**: Cache for 1 hour
   - Key: `search:${location}:${checkin}:${checkout}:${guests}:${rooms}`
   
2. **Hotel Details**: Cache for 2 hours
   - Key: `hotel:${hotelId}:${checkin}:${checkout}`
   
3. **City/Location Data**: Cache for 24 hours
   - Key: `location:${cityName}`

### Cache Invalidation
- Time-based expiration (TTL)
- Manual invalidation on data updates
- Cache warming for popular destinations

## Rate Limiting

### API Rate Limits
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many API requests, please try again later'
});
```

### Booking.com API Limits
- Respect Booking.com's rate limits (typically 10 requests/second)
- Implement request queuing if needed
- Use caching to reduce API calls

## Environment Configuration

### Required Environment Variables
```
# Existing variables
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=26891
DB_NAME=railway
DB_USER=root
DB_PASSWORD=sDRyfpNNEsQKNiaXHyMTMBseNbsAiEaE
JWT_SECRET=your-jwt-secret

# New Booking.com API variables
BOOKING_API_USERNAME=your-booking-api-username
BOOKING_API_PASSWORD=your-booking-api-password
BOOKING_AFFILIATE_ID=your-affiliate-id
BOOKING_API_BASE_URL=https://distribution-xml.booking.com/2.7/json

# Cache configuration
CACHE_TTL_SEARCH=3600
CACHE_TTL_HOTEL=7200
CACHE_TTL_LOCATION=86400

# API configuration
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=2
API_RETRY_DELAY=1000
```

## Security Considerations

### Authentication
- All booking and favorite endpoints require valid JWT token
- User ID extracted from JWT token for authorization

### Authorization
- Users can only view/modify their own bookings and favorites
- Admin users can view all bookings (future enhancement)

### Data Privacy
- No payment information stored in database
- Hotel search history not tracked
- User data encrypted in transit (HTTPS)

### API Security
- Booking.com API credentials stored in environment variables
- API credentials never exposed to client
- Rate limiting to prevent abuse

## Deployment Considerations

### Production Readiness
- Environment-specific configuration
- Logging for API calls and errors
- Health check endpoint
- Monitoring for API availability
- Cache warming for popular destinations

### Scalability
- Stateless design for horizontal scaling
- In-memory caching (can be replaced with Redis for multi-instance)
- Database connection pooling
- Async API calls to prevent blocking

### Monitoring
- Track API response times
- Monitor cache hit rates
- Alert on API failures
- Track booking creation rates

## Future Enhancements

### Phase 2 Features
1. **Flight Booking**: Integrate Skyscanner API
2. **Activity Booking**: Integrate GetYourGuide API
3. **Price Alerts**: Notify users of price drops
4. **Booking Confirmation**: Webhook integration with Booking.com
5. **Multi-currency Support**: Display prices in user's preferred currency
6. **Advanced Filters**: Filter by amenities, price range, rating
7. **Map View**: Display hotels on interactive map
8. **Comparison Tool**: Compare multiple hotels side-by-side

### Technical Improvements
1. **Redis Caching**: Replace in-memory cache with Redis for distributed caching
2. **Queue System**: Implement job queue for API requests
3. **GraphQL API**: Provide GraphQL interface alongside REST
4. **Real-time Updates**: WebSocket for live price updates
5. **Analytics**: Track user search patterns and preferences

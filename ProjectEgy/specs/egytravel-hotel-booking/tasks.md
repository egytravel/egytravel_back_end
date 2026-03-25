ok# Implementation Plan

- [x] 1. Set up Booking.com API integration and configuration




  - Install required dependencies (axios, node-cache)
  - Create Booking.com API configuration file with credentials
  - Add environment variables for API credentials and affiliate ID


  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 2. Create Sequelize models for bookings and favorites
  - [x] 2.1 Create Booking model with all hotel-specific fields


    - Define Sequelize model matching the bookings table schema
    - Add associations to User and Trip models
    - Implement validation for required fields
    - _Requirements: 3.1, 3.2_


  
  - [x] 2.2 Create Favorite model for wishlist functionality



    - Define Sequelize model matching the favorites table schema
    - Add unique constraint for user_id + item_type + item_id



    - Add associations to User model
    - _Requirements: 7.1, 7.2_
  
  - [ ] 2.3 Create Trip model for trip associations
    - Define Sequelize model matching the trips table schema
    - Add associations to User and Booking models
    - _Requirements: 3.4_

- [ ] 3. Implement Booking.com API service layer
  - [ ] 3.1 Create bookingcomService for API communication
    - Implement hotel search method with location and date parameters
    - Implement hotel details method by hotel ID
    - Add request timeout handling (30 seconds)
    - Add retry logic for failed requests (up to 2 retries)
    - _Requirements: 1.1, 2.1, 9.3, 9.4_
  
  - [x] 3.2 Implement affiliate link generator utility


    - Create function to generate Booking.com URLs with affiliate ID
    - Include all booking parameters in the URL (hotel ID, dates, guests, rooms)
    - Validate that affiliate ID is present in generated links
    - _Requirements: 3.3, 4.1, 4.2_


  
  - [ ] 3.3 Add caching service for API responses
    - Implement in-memory cache using node-cache
    - Cache hotel search results (1 hour TTL)
    - Cache hotel details (2 hours TTL)
    - Add cache key generation based on search parameters


    - _Requirements: 9.5_

- [ ] 4. Create hotel search and details endpoints
  - [ ] 4.1 Implement hotel search endpoint (GET /api/hotels/search)
    - Validate required parameters (location, check-in date)
    - Validate check-in date is before check-out date

    - Call Booking.com API with search parameters
    - Return formatted search results with required fields
    - Handle empty results gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 4.2 Implement hotel details endpoint (GET /api/hotels/:hotelId)
    - Validate hotel ID parameter


    - Fetch hotel details from Booking.com API
    - Return comprehensive hotel information with all required fields
    - Handle invalid hotel IDs with appropriate errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Create booking management endpoints
  - [x] 5.1 Implement create booking endpoint (POST /api/bookings/hotel)

    - Validate authenticated user from JWT token
    - Validate all required booking fields
    - Generate affiliate link for the booking
    - Create booking record in database with pending status
    - Associate booking with trip if trip_id provided
    - Return booking record with affiliate link
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.4_
  

  - [ ] 5.2 Implement get bookings endpoint (GET /api/bookings)
    - Validate authenticated user from JWT token
    - Fetch all bookings for the user
    - Support filtering by trip_id query parameter
    - Support filtering by status query parameter

    - Sort bookings by check_in_date ascending
    - Include affiliate link in each booking
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 5.3 Implement get single booking endpoint (GET /api/bookings/:bookingId)
    - Validate authenticated user from JWT token
    - Verify booking belongs to requesting user

    - Return booking details with affiliate link
    - _Requirements: 5.1, 6.2_
  
  - [ ] 5.4 Implement update booking endpoint (PUT /api/bookings/:bookingId)
    - Validate authenticated user from JWT token
    - Verify booking belongs to requesting user
    - Allow updates to status, booking_reference, and notes fields
    - Update updated_at timestamp automatically


    - Return updated booking record
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 5.5 Implement delete booking endpoint (DELETE /api/bookings/:bookingId)
    - Validate authenticated user from JWT token
    - Verify booking belongs to requesting user

    - Remove booking record from database
    - Remove trip association if exists
    - Return success confirmation
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 6. Create favorites management endpoints

  - [ ] 6.1 Implement add to favorites endpoint (POST /api/favorites/hotel)
    - Validate authenticated user from JWT token
    - Validate required hotel fields
    - Check for existing favorite (prevent duplicates)
    - Create favorite record with item_type 'hotel'
    - Store hotel ID, name, location, image URL, and pricing data
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 6.2 Implement get favorites endpoint (GET /api/favorites)
    - Validate authenticated user from JWT token
    - Fetch all favorites for the user
    - Support filtering by item_type query parameter
    - Return all favorited hotels
    - _Requirements: 7.4_
  
  - [ ] 6.3 Implement remove from favorites endpoint (DELETE /api/favorites/:favoriteId)
    - Validate authenticated user from JWT token
    - Verify favorite belongs to requesting user
    - Remove favorite record from database
    - Return success confirmation
    - _Requirements: 7.5_

- [ ] 7. Implement error handling and validation
  - [ ] 7.1 Create input validation middleware
    - Validate date formats and ranges
    - Validate required parameters for each endpoint
    - Validate numeric fields (guests, rooms, prices)
    - Return standardized validation errors
    - _Requirements: 1.2, 1.3_
  
  - [ ] 7.2 Create API error handler middleware
    - Handle Booking.com API unavailability
    - Handle API timeout errors
    - Handle invalid API responses
    - Return standardized error responses
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 7.3 Add authorization middleware for bookings and favorites
    - Verify user owns the resource before updates/deletes
    - Return authorization errors for unauthorized access


    - _Requirements: 6.2, 10.1_

- [ ] 8. Add logging and monitoring
  - [ ] 8.1 Implement API request logging
    - Log all Booking.com API requests with timestamps


    - Log booking creation and updates with user and booking IDs
    - Log API errors and failures with details
    - _Requirements: 8.1, 8.2, 8.3_
  


  - [ ] 8.2 Implement rate limiting for API endpoints
    - Add rate limiting middleware for hotel search endpoint
    - Add rate limiting for Booking.com API requests



    - Return appropriate error when rate limit exceeded
    - _Requirements: 8.4, 8.5_

- [ ] 9. Create route files and wire up endpoints
  - [ ] 9.1 Create hotels route file
    - Mount hotel search endpoint
    - Mount hotel details endpoint
    - Add authentication middleware where needed
    - Add rate limiting middleware
    - _Requirements: 1.1, 2.1_
  
  - [ ] 9.2 Create bookings route file
    - Mount all booking CRUD endpoints
    - Add authentication middleware to all routes
    - Add validation middleware
    - _Requirements: 3.1, 5.1, 6.1, 10.1_
  
  - [ ] 9.3 Create favorites route file
    - Mount all favorites CRUD endpoints
    - Add authentication middleware to all routes
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ] 9.4 Register routes in main server file
    - Mount /api/hotels routes
    - Mount /api/bookings routes
    - Mount /api/favorites routes
    - _Requirements: All_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Write property-based tests for core functionality
  - [ ] 11.1 Write property test for check-in date validation
    - **Property 2: Check-in date validation**
    - **Validates: Requirements 1.2**
  
  - [ ] 11.2 Write property test for required parameters
    - **Property 3: Required search parameters**
    - **Validates: Requirements 1.3**
  
  - [ ] 11.3 Write property test for search result structure
    - **Property 4: Search result structure completeness**
    - **Validates: Requirements 1.4**
  
  - [ ] 11.4 Write property test for affiliate link generation
    - **Property 7: Affiliate link generation**
    - **Validates: Requirements 3.3, 4.2**
  
  - [ ] 11.5 Write property test for trip filter correctness
    - **Property 12: Trip filter correctness**
    - **Validates: Requirements 5.2**
  
  - [ ] 11.6 Write property test for booking authorization
    - **Property 15: Booking authorization**
    - **Validates: Requirements 6.2, 10.1**
  
  - [ ] 11.7 Write property test for favorite uniqueness
    - **Property 17: Favorite uniqueness**
    - **Validates: Requirements 7.3**
  
  - [ ] 11.8 Write property test for cache effectiveness
    - **Property 21: Cache effectiveness**
    - **Validates: Requirements 9.5**

- [ ] 12. Write unit tests for services and utilities
  - [ ] 12.1 Write unit tests for affiliate link generator
    - Test link generation with various parameters
    - Test affiliate ID inclusion
    - Test parameter encoding
    - _Requirements: 3.3, 4.2_
  
  - [ ] 12.2 Write unit tests for date validation
    - Test valid date ranges
    - Test invalid date ranges (check-in >= check-out)
    - Test date format validation
    - _Requirements: 1.2_
  
  - [ ] 12.3 Write unit tests for booking model operations
    - Test booking creation
    - Test booking updates
    - Test booking deletion
    - _Requirements: 3.1, 6.1, 10.2_

- [ ] 13. Write integration tests for API endpoints
  - [ ] 13.1 Write integration tests for hotel search
    - Test successful search with valid parameters
    - Test search with missing parameters
    - Test search with invalid date range
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 13.2 Write integration tests for booking CRUD
    - Test booking creation flow
    - Test booking retrieval with filters
    - Test booking updates
    - Test booking deletion
    - _Requirements: 3.1, 5.1, 6.1, 10.1_
  
  - [ ] 13.3 Write integration tests for favorites
    - Test adding to favorites
    - Test duplicate prevention
    - Test favorites retrieval
    - Test removing from favorites
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ] 14. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

# Implementation Plan

- [x] 1. Add extended profile fields to User model and database




  - [ ] 1.1 Create migration script to add new columns to users table
    - Add phone, nationality, date_of_birth, profile_photo_url, notification_preferences columns
    - Run migration against the Railway MySQL database using Sequelize queryInterface


    - _Requirements: 9.1, 9.2, 9.3, 9.4_





  - [ ] 1.2 Update User Sequelize model with new fields
    - Add phone, nationality, date_of_birth, profile_photo_url, notification_preferences field definitions
    - Update toJSON() to include new fields in responses
    - _Requirements: 9.1, 9.3_



- [ ] 2. Implement userController.js with all profile methods
  - [ ] 2.1 Implement getProfile controller
    - Fetch user by req.user.user_id


    - Query Trip.count and Favorite.count for stats aggregation
    - Return profile data + stats (trips_count, reviews_count=0, favorites_count)
    - _Requirements: 1.1, 1.2, 1.3_



  - [ ] 2.2 Implement updateProfile controller
    - Accept name, phone, nationality, date_of_birth, profile_photo_url from request body
    - Validate phone format and name length
    - Update only provided fields, return updated profile


    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Implement deleteAccount controller



    - Require password field in request body
    - Verify password using bcrypt against stored hash
    - Destroy user record on success
    - _Requirements: 7.1, 7.2, 7.3, 7.4_


  - [ ] 2.4 Implement getNotifications and updateNotifications controllers
    - getNotifications: return notification_preferences JSON from user record
    - updateNotifications: accept push_enabled and email_enabled booleans, update and return

    - Default to { push_enabled: true, email_enabled: true } if null
    - _Requirements: 4.1, 4.2, 4.3, 4.4_




  - [ ] 2.5 Implement getTravelHistory controller
    - Query Booking where user_id matches and status IN ('completed', 'confirmed')
    - Return sorted by check_in_date descending
    - Include hotel_name, hotel_location, check_in_date, check_out_date, status, booking_url

    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 3. Add validation middleware for new profile endpoints
  - [x] 3.1 Add validateProfileUpdate rules for new fields



    - Add phone validation (digits, spaces, +, - only)
    - Add date_of_birth validation (valid date format)
    - Add profile_photo_url validation (optional URL string)
    - _Requirements: 2.3, 2.4_

  - [ ] 3.2 Add validateDeleteAccount middleware
    - Require password field in request body
    - _Requirements: 7.2_

  - [ ] 3.3 Add validateNotificationUpdate middleware
    - Validate push_enabled and email_enabled are booleans when provided
    - _Requirements: 4.2, 4.3_

- [ ] 4. Wire all new routes in users.js route file
  - [ ] 4.1 Replace inline route handlers with userController methods
    - Replace GET /profile inline handler with userController.getProfile
    - Replace PUT /profile inline handler with userController.updateProfile
    - Add DELETE /profile route using userController.deleteAccount
    - _Requirements: 1.1, 2.1, 7.1_

  - [ ] 4.2 Add notification and travel history routes
    - Add GET /notifications route with userController.getNotifications
    - Add PUT /notifications route with userController.updateNotifications
    - Add GET /travel-history route with userController.getTravelHistory
    - _Requirements: 4.1, 4.2, 6.1_

- [ ] 5. Update AuthService.updateUserProfile to support new fields
  - Extend the allowedFields array to include phone, nationality, date_of_birth, profile_photo_url
  - _Requirements: 2.1, 2.2_

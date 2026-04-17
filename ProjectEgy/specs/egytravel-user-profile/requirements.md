# Requirements Document

## Introduction

The EgyTravel User Profile feature provides a complete profile management system for both the Flutter mobile app and React web app. It enables users to view their profile summary (photo, name, email, stats), manage personal information, handle security settings, manage notification preferences, view trips/bookings/favorites, and log out. All endpoints are shared between web and mobile clients.

## Glossary

- **Profile_System**: The user profile management backend service for EgyTravel
- **Authenticated_User**: A logged-in user with a valid JWT token in the Authorization header
- **Profile_Data**: User's personal information including name, email, phone, nationality, date_of_birth, and profile_photo_url
- **Profile_Stats**: Aggregated counts shown on the profile header — trips_count, reviews_count, favorites_count
- **Notification_Preferences**: User's push/email notification settings stored as a JSON object
- **Travel_History**: List of completed or past bookings for the user
- **Saved_Places**: User's favorited items (hotels, places, restaurants, attractions)
- **Admin_User**: A user with role 'admin' who has elevated permissions to manage other users
- **JWT_Token**: JSON Web Token used to authenticate requests, passed as `Authorization: Bearer <token>`

## Requirements

### Requirement 1

**User Story:** As an authenticated user, I want to view my profile summary, so that I can see my photo, name, email, and activity stats (trips, reviews, favorites) on the profile header.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends GET `/api/users/profile`, THE Profile_System SHALL return Profile_Data including user_id, name, email, role, phone, nationality, date_of_birth, profile_photo_url, and created_at
2. WHEN an Authenticated_User requests their profile, THE Profile_System SHALL include Profile_Stats with trips_count, reviews_count, and favorites_count
3. THE Profile_System SHALL exclude the password field from all profile responses
4. IF the JWT_Token is missing or invalid, THEN THE Profile_System SHALL return a 401 unauthorized error with code MISSING_TOKEN or INVALID_TOKEN

### Requirement 2

**User Story:** As an authenticated user, I want to update my personal information, so that I can keep my name, phone, nationality, date of birth, and profile photo current.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends PUT `/api/users/profile` with valid fields, THE Profile_System SHALL update the Profile_Data fields and return the updated profile
2. THE Profile_System SHALL allow updating name, phone, nationality, date_of_birth, and profile_photo_url
3. THE Profile_System SHALL validate that name is between 2 and 100 characters when provided
4. THE Profile_System SHALL validate that phone contains only digits, spaces, plus signs, and hyphens when provided
5. IF no valid updatable fields are provided, THEN THE Profile_System SHALL return a 400 validation error

### Requirement 3

**User Story:** As an authenticated user, I want to change my password from the Security settings, so that I can keep my account secure.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends POST `/api/users/change-password` with the correct current password and a valid new password, THE Profile_System SHALL update the password and return a success message
2. THE Profile_System SHALL validate that the new password is at least 8 characters long
3. IF the current password is incorrect, THEN THE Profile_System SHALL return a 400 error with code INCORRECT_PASSWORD
4. THE Profile_System SHALL hash the new password using bcrypt before storing it

### Requirement 4

**User Story:** As an authenticated user, I want to manage my notification preferences, so that I can control whether I receive push and email notifications.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends GET `/api/users/notifications`, THE Profile_System SHALL return the user's current Notification_Preferences
2. WHEN an Authenticated_User sends PUT `/api/users/notifications` with preference fields, THE Profile_System SHALL update and return the saved Notification_Preferences
3. THE Profile_System SHALL support the following preference fields: push_enabled (boolean), email_enabled (boolean)
4. THE Profile_System SHALL default push_enabled and email_enabled to true for new users

### Requirement 5

**User Story:** As an authenticated user, I want to view my saved places with a count badge, so that I can quickly access the places I want to visit.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends GET `/api/favorites`, THE Profile_System SHALL return all saved favorites for that user
2. WHEN an Authenticated_User requests their profile, THE Profile_System SHALL include favorites_count in Profile_Stats reflecting the total number of saved items
3. THE Profile_System SHALL support filtering favorites by type using the `?type=` query parameter

### Requirement 6

**User Story:** As an authenticated user, I want to view my travel history, so that I can see the places and bookings I have completed.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends GET `/api/users/travel-history`, THE Profile_System SHALL return all bookings with status 'completed' or 'confirmed' for that user
2. THE Profile_System SHALL return travel history sorted by check_in_date descending
3. THE Profile_System SHALL include hotel_name, hotel_location, check_in_date, check_out_date, and status in each travel history record
4. IF the user has no travel history, THEN THE Profile_System SHALL return an empty array

### Requirement 7

**User Story:** As an authenticated user, I want to delete my account, so that I can permanently remove my data from the platform.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends DELETE `/api/users/profile` with a valid password confirmation, THE Profile_System SHALL permanently delete the user account
2. THE Profile_System SHALL require a `password` field in the request body for confirmation before deletion
3. IF the confirmation password is incorrect, THEN THE Profile_System SHALL return a 400 error and not delete the account
4. WHEN the account is deleted, THE Profile_System SHALL return a 200 success confirmation message

### Requirement 8

**User Story:** As an admin, I want to view and manage all users, so that I can maintain the platform's user base.

#### Acceptance Criteria

1. WHEN an Admin_User sends GET `/api/users/admin/users`, THE Profile_System SHALL return a paginated list of all users excluding passwords
2. THE Profile_System SHALL support `page` and `limit` query parameters, defaulting to page 1 and limit 10
3. WHEN an Admin_User sends GET `/api/users/admin/users/:userId`, THE Profile_System SHALL return that user's full Profile_Data
4. IF a non-admin user attempts to access admin endpoints, THEN THE Profile_System SHALL return a 403 forbidden error with code INSUFFICIENT_PERMISSIONS
5. WHEN an Admin_User sends PUT `/api/users/admin/users/:userId/role`, THE Profile_System SHALL update the role and return the updated user

### Requirement 9

**User Story:** As an authenticated user, I want the profile to support extended fields like phone, nationality, and profile photo, so that the app can display a complete profile page.

#### Acceptance Criteria

1. THE Profile_System SHALL store and return phone, nationality, date_of_birth, and profile_photo_url fields for each user
2. WHEN the users table does not have these columns, THE Profile_System SHALL add them via a database migration
3. THE Profile_System SHALL allow all extended fields to be null
4. THE Profile_System SHALL store notification preferences as a JSON column on the users table

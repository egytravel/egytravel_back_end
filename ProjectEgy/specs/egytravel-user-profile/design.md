# EgyTravel User Profile — Design Document

## Overview

The User Profile system extends the existing `/api/users` routes to support the full profile page as seen in the Flutter app and React web app. It adds extended user fields (phone, nationality, date_of_birth, profile_photo_url, notification_preferences), a profile stats aggregation endpoint, travel history, and account deletion. All endpoints are shared between Flutter and React — no platform-specific logic.

---

## Architecture

```
Flutter App / React Web
        │
        │  Authorization: Bearer <jwt_token>
        ▼
  Express.js API (/api/users)
        │
   ┌────┴────────────────────┐
   │                         │
User Controller          Auth Middleware
(userController.js)      (auth.js)
   │
   ├── GET  /profile          → profile + stats
   ├── PUT  /profile          → update personal info
   ├── DELETE /profile        → delete account
   ├── POST /change-password  → security
   ├── GET  /notifications    → get prefs
   ├── PUT  /notifications    → update prefs
   ├── GET  /travel-history   → completed bookings
   └── /admin/users/*         → admin management
        │
   MySQL (Sequelize)
   users table + bookings + favorites + trips
```

---

## Components and Interfaces

### API Endpoints

All endpoints require `Authorization: Bearer <token>` unless marked public.

#### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Bearer | Get profile + stats |
| PUT | `/api/users/profile` | Bearer | Update personal info |
| DELETE | `/api/users/profile` | Bearer | Delete account |

#### Security

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/change-password` | Bearer | Change password |

#### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/notifications` | Bearer | Get notification preferences |
| PUT | `/api/users/notifications` | Bearer | Update notification preferences |

#### Travel History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/travel-history` | Bearer | Get completed/confirmed bookings |

#### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/admin/users` | Bearer + Admin | List all users (paginated) |
| GET | `/api/users/admin/users/:userId` | Bearer + Admin | Get user by ID |
| PUT | `/api/users/admin/users/:userId/role` | Bearer + Admin | Update user role |
| DELETE | `/api/users/admin/users/:userId` | Bearer + Admin | Delete user |

---

## Response Shapes

### GET /api/users/profile
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "name": "John Traveler",
      "email": "user@example.com",
      "role": "user",
      "phone": "+20 100 000 0000",
      "nationality": "Egyptian",
      "date_of_birth": "1995-06-15",
      "profile_photo_url": "https://...",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "stats": {
      "trips_count": 12,
      "reviews_count": 0,
      "favorites_count": 8
    }
  }
}
```

### PUT /api/users/profile — Request Body
```json
{
  "name": "John Traveler",
  "phone": "+20 100 000 0000",
  "nationality": "Egyptian",
  "date_of_birth": "1995-06-15",
  "profile_photo_url": "https://..."
}
```

### GET /api/users/notifications
```json
{
  "success": true,
  "data": {
    "push_enabled": true,
    "email_enabled": true
  }
}
```

### PUT /api/users/notifications — Request Body
```json
{
  "push_enabled": false,
  "email_enabled": true
}
```

### GET /api/users/travel-history
```json
{
  "success": true,
  "data": [
    {
      "booking_id": 5,
      "hotel_name": "Marriott Mena House",
      "hotel_location": "Giza, Cairo",
      "check_in_date": "2024-03-15",
      "check_out_date": "2024-03-20",
      "status": "completed",
      "booking_url": "https://booking.com/..."
    }
  ]
}
```

### DELETE /api/users/profile — Request Body
```json
{
  "password": "currentPassword123!"
}
```

---

## Data Models

### Users Table — Migration (add columns)

The existing `users` table has: `user_id`, `name`, `email`, `password`, `role`, `created_at`.

New columns to add via migration:

```javascript
// Migration: add-profile-fields-to-users
await queryInterface.addColumn('users', 'phone', {
  type: DataTypes.STRING(30),
  allowNull: true
});
await queryInterface.addColumn('users', 'nationality', {
  type: DataTypes.STRING(100),
  allowNull: true
});
await queryInterface.addColumn('users', 'date_of_birth', {
  type: DataTypes.DATEONLY,
  allowNull: true
});
await queryInterface.addColumn('users', 'profile_photo_url', {
  type: DataTypes.STRING(500),
  allowNull: true
});
await queryInterface.addColumn('users', 'notification_preferences', {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: { push_enabled: true, email_enabled: true }
});
```

### Updated User Sequelize Model fields

```javascript
phone: { type: DataTypes.STRING(30), allowNull: true },
nationality: { type: DataTypes.STRING(100), allowNull: true },
date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
profile_photo_url: { type: DataTypes.STRING(500), allowNull: true },
notification_preferences: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: { push_enabled: true, email_enabled: true }
}
```

### Profile Stats Query

Stats are computed by counting related records:

```javascript
const [tripsCount, favoritesCount] = await Promise.all([
  Trip.count({ where: { user_id: userId } }),
  Favorite.count({ where: { user_id: userId } })
]);
// reviews_count = 0 until Reviews API is built
```

---

## Controller Design

### userController.js — methods to implement

```
getProfile(req, res)         — fetch user + compute stats
updateProfile(req, res)      — update allowed fields
deleteAccount(req, res)      — verify password + destroy user
getNotifications(req, res)   — return notification_preferences JSON
updateNotifications(req, res)— update notification_preferences JSON
getTravelHistory(req, res)   — bookings where status IN (completed, confirmed)
```

The existing `authService.js` already handles `changePassword` and `getUserProfile` — the controller will delegate to it for those.

---

## Error Handling

| Scenario | HTTP Code | Error Code |
|----------|-----------|------------|
| Missing/invalid JWT | 401 | `MISSING_TOKEN` / `INVALID_TOKEN` |
| Non-admin on admin route | 403 | `INSUFFICIENT_PERMISSIONS` |
| Wrong current password | 400 | `INCORRECT_PASSWORD` |
| Wrong delete confirmation password | 400 | `INCORRECT_PASSWORD` |
| User not found | 404 | `USER_NOT_FOUND` |
| Validation failure | 400 | `VALIDATION_ERROR` |
| DB/server error | 500 | `INTERNAL_ERROR` |

---

## Testing Strategy

### Unit Tests
- Profile stats aggregation (trips + favorites count)
- Notification preferences default values
- Account deletion password verification

### Integration Tests
- GET /profile returns correct shape with stats
- PUT /profile updates only allowed fields
- DELETE /profile requires correct password
- GET/PUT /notifications round-trip
- GET /travel-history returns only completed/confirmed bookings
- Admin endpoints enforce role check

---

## Security Considerations

- Password never returned in any response (`toJSON()` strips it)
- Account deletion requires password re-confirmation
- Admin endpoints protected by `requireAdmin` middleware
- All profile endpoints require valid JWT via `authenticateToken`
- Notification preferences stored server-side (not in JWT)

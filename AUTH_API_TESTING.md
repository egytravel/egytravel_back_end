# EgyTravel Authentication API - Testing Guide

## 🚀 Server Status

✅ **Server is running on:** `http://localhost:3000`  
✅ **Database:** Connected  
✅ **All endpoints:** Ready for testing

---

## 📋 Authentication Endpoints

### **1. User Registration**

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "tourist@example.com",
  "password": "Test123456",
  "firstName": "Ahmed",
  "lastName": "Hassan"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "tourist@example.com",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "role": "tourist"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **2. User Login**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "tourist@example.com",
  "password": "Test123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "tourist@example.com",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "role": "tourist"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **3. Get User Profile**

```http
GET http://localhost:3000/api/users/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "tourist@example.com",
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "role": "tourist",
    "phone": null,
    "dateOfBirth": null,
    "nationality": null,
    "createdAt": "2025-11-23T20:00:00.000Z"
  }
}
```

---

### **4. Update User Profile**

```http
PUT http://localhost:3000/api/users/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "phone": "+201234567890",
  "dateOfBirth": "1990-01-15",
  "nationality": "Egyptian"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "tourist@example.com",
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "phone": "+201234567890",
    "dateOfBirth": "1990-01-15",
    "nationality": "Egyptian",
    "role": "tourist"
  }
}
```

---

### **5. Refresh Token**

```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **6. Logout**

```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### **7. Forgot Password (Request Reset)**

```http
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "tourist@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to email"
}
```

---

### **8. Reset Password**

```http
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "RESET_TOKEN_FROM_EMAIL",
  "newPassword": "NewPassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 👨‍💼 Admin Endpoints

### **9. Get All Users (Admin Only)**

```http
GET http://localhost:3000/api/users/admin/users
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "tourist@example.com",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "role": "tourist",
      "isActive": true,
      "createdAt": "2025-11-23T20:00:00.000Z"
    },
    {
      "id": 2,
      "email": "admin@egytravel.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-11-23T19:00:00.000Z"
    }
  ]
}
```

---

### **10. Update User Role (Admin Only)**

```http
PUT http://localhost:3000/api/users/admin/users/1/role
Authorization: Bearer ADMIN_ACCESS_TOKEN
Content-Type: application/json

{
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "id": 1,
    "email": "tourist@example.com",
    "role": "admin"
  }
}
```

---

## 🧪 Postman Testing Steps

### **Step 1: Register a New User**

1. Open Postman
2. Create a new request:
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "email": "test@egytravel.com",
     "password": "Test123456",
     "firstName": "Test",
     "lastName": "User"
   }
   ```
3. Click **Send**
4. **Copy the `accessToken`** from the response

---

### **Step 2: Test Login**

1. Create a new request:
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "email": "test@egytravel.com",
     "password": "Test123456"
   }
   ```
2. Click **Send**
3. **Copy the `accessToken`** from the response

---

### **Step 3: Get Your Profile (Protected Route)**

1. Create a new request:
   - Method: `GET`
   - URL: `http://localhost:3000/api/users/profile`
   - Headers:
     - Go to **Authorization** tab
     - Type: `Bearer Token`
     - Token: Paste your `accessToken`
2. Click **Send**
3. You should see your user profile

---

### **Step 4: Update Your Profile**

1. Create a new request:
   - Method: `PUT`
   - URL: `http://localhost:3000/api/users/profile`
   - Authorization: `Bearer Token` (paste your token)
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "firstName": "Ahmed",
     "lastName": "Mohamed",
     "phone": "+201234567890",
     "nationality": "Egyptian"
   }
   ```
2. Click **Send**

---

## 🔒 Testing Authorization

### **Test Unauthorized Access**

Try accessing a protected route without a token:

```http
GET http://localhost:3000/api/users/profile
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Access token is required"
  }
}
```

---

### **Test Invalid Token**

Try with an invalid token:

```http
GET http://localhost:3000/api/users/profile
Authorization: Bearer invalid_token_here
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Invalid access token"
  }
}
```

---

### **Test Admin-Only Endpoint as Tourist**

Try accessing admin endpoint with tourist token:

```http
GET http://localhost:3000/api/users/admin/users
Authorization: Bearer TOURIST_TOKEN
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Admin access required"
  }
}
```

---

## 📊 Response Codes

- `200` - Success
- `201` - Created (registration successful)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user not found)
- `409` - Conflict (email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## ⚡ Quick Test Collection

### **Create Admin User (For Testing)**

You can manually create an admin user in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'test@egytravel.com';
```

Or register normally and then update via database.

---

## 🎯 Common Test Scenarios

### **1. Complete Registration Flow**
```
Register → Login → Get Profile → Update Profile → Logout
```

### **2. Password Reset Flow**
```
Forgot Password → (Check email/logs for token) → Reset Password → Login with new password
```

### **3. Token Refresh Flow**
```
Login → Wait for token to expire → Use refresh token → Get new access token
```

### **4. Admin Flow**
```
Login as admin → Get all users → Update user role → Verify changes
```

---

## 🔍 Debugging Tips

### **Check Server Logs**

The server logs will show:
- All API requests
- Authentication attempts
- Errors and stack traces

### **Check Database**

Query the database to verify data:

```sql
-- Check users
SELECT * FROM users;

-- Check password reset tokens
SELECT * FROM password_reset_tokens;
```

---

## ✅ All Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/auth/logout` | Yes | Logout user |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password |
| GET | `/api/users/profile` | Yes | Get user profile |
| PUT | `/api/users/profile` | Yes | Update user profile |
| GET | `/api/users/admin/users` | Yes (Admin) | Get all users |
| PUT | `/api/users/admin/users/:id/role` | Yes (Admin) | Update user role |

---

**Happy Testing! 🚀**

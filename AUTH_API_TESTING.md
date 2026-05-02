# EgyTravel Authentication API - Testing Guide

## 🚀 Server Status

✅ **Server is running on:** `http://localhost:3000`  
✅ **Database:** Connected  
✅ **All endpoints:** Ready for testing

---

## 🔄 Auth Flow Overview

The registration flow now requires email verification before login is allowed:

```
Register → Receive OTP email → Verify OTP → Get JWT token → Login freely
```

If you try to login before verifying your email, you'll get a `403 EMAIL NOT VERIFIED` response.

---

## 📋 Authentication Endpoints

### **1. Register**

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "password": "Test@1234"
}
```

**Response (201 Created):**
```json
{
  "code": 201,
  "message": "REGISTRATION SUCCESSFUL",
  "data": {
    "user_id": 1,
    "name": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "role": "user",
    "emailVerified": false,
    "message": "A verification code has been sent to your email. Please verify before logging in."
  }
}
```

> ⚠️ No token is returned here. Check your email for the 6-digit OTP.

---

### **2. Verify Email (OTP)**

```http
POST http://localhost:3000/api/auth/verify-email
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "otp": "482910"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to EgyTravel.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": 1,
    "name": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "role": "user",
    "emailVerified": true
  }
}
```

> ✅ Save the `token` — this is your JWT for authenticated requests.

**Error — Wrong OTP (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Incorrect verification code"
  }
}
```

**Error — Expired OTP (400):**
```json
{
  "success": false,
  "error": {
    "code": "OTP_EXPIRED",
    "message": "OTP has expired. Please request a new one."
  }
}
```

---

### **3. Resend OTP**

Use this if the OTP expired or was never received.

```http
POST http://localhost:3000/api/auth/resend-otp
Content-Type: application/json

{
  "email": "ahmed@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification code resent to your email"
}
```

---

### **4. Login**

Only works after email is verified.

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "Test@1234"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "LOGIN SUCCESSFUL",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": 1,
    "name": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "role": "user"
  }
}
```

**Error — Email not verified (403):**
```json
{
  "code": 403,
  "message": "EMAIL NOT VERIFIED",
  "data": {
    "email": "ahmed@example.com",
    "message": "Email not verified. Please check your email for the verification code."
  }
}
```

**Error — Wrong credentials (401):**
```json
{
  "code": 401,
  "message": "INVALID CREDENTIALS",
  "data": null
}
```

---

### **5. Get Current User**

```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "role": "user",
      "is_verified": true,
      "phone": null,
      "nationality": null,
      "date_of_birth": null,
      "profile_photo_url": null
    }
  }
}
```

---

### **6. Forgot Password**

Sends a 6-digit reset code to the email.

```http
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "ahmed@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If this email exists, a reset code has been sent"
}
```

---

### **7. Reset Password**

```http
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "otp": "739201",
  "newPassword": "NewPass@5678"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in."
}
```

---

### **8. Refresh Token**

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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **9. Logout**

```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🧪 Postman Testing Steps

### **Step 1: Register**

- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@1234"
}
```
- Expected: `201` with `emailVerified: false` — **no token yet**

---

### **Step 2: Verify Email**

- Check your inbox for the 6-digit OTP
- Method: `POST`
- URL: `http://localhost:3000/api/auth/verify-email`
- Body:
```json
{
  "email": "test@example.com",
  "otp": "PASTE_OTP_HERE"
}
```
- Expected: `200` with a `token` in the response
- **Save the token** — set it as `{{token}}` in your Postman environment

---

### **Step 3: Login (after verification)**

- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body:
```json
{
  "email": "test@example.com",
  "password": "Test@1234"
}
```
- Expected: `200` with token

---

### **Step 4: Test Protected Route**

- Method: `GET`
- URL: `http://localhost:3000/api/auth/me`
- Authorization tab → Bearer Token → paste your token
- Expected: `200` with user profile

---

### **Step 5: Test Login Before Verification (negative test)**

Register a new user but skip the verify-email step, then try to login:
- Expected: `403 EMAIL NOT VERIFIED`

---

## 🔒 Error Scenarios to Test

| Scenario | Expected Code |
|----------|--------------|
| Login before verifying email | `403` |
| Wrong OTP | `400 INVALID_OTP` |
| Expired OTP (wait 10 min) | `400 OTP_EXPIRED` |
| Wrong password on login | `401 INVALID CREDENTIALS` |
| Access protected route without token | `401` |
| Register with existing email | `409 USER ALREADY EXISTS` |
| OTP wrong 5+ times | `400 TOO_MANY_ATTEMPTS` |

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (registration) |
| `400` | Bad request / invalid OTP |
| `401` | Wrong credentials / missing token |
| `403` | Email not verified |
| `404` | User not found |
| `409` | Email already registered |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## ✅ Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register — sends OTP email |
| POST | `/api/auth/verify-email` | No | Verify OTP → returns JWT |
| POST | `/api/auth/resend-otp` | No | Resend OTP code |
| POST | `/api/auth/login` | No | Login (verified users only) |
| GET | `/api/auth/me` | Yes | Get current user profile |
| POST | `/api/auth/forgot-password` | No | Send password reset code |
| POST | `/api/auth/reset-password` | No | Reset password with code |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout |

---

## 🔍 Debugging Tips

Check server logs for OTP values during development:
```
logger.info('OTP email sent', { to, messageId: data?.id })
```

Check MongoDB for OTP records:
```js
db.email_otps.find({ email: "test@example.com" })
```

Check SQL for verification status:
```sql
SELECT user_id, email, is_verified FROM users;
```

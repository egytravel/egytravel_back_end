# Updated Authentication API Testing

## ✅ Changes Made

1. **Single Token** - Token lasts 365 days (login once, stay logged in)
2. **New Response Format** - Matches your desired structure
3. **No Refresh Token** - Simplified authentication

---

## 🧪 Test Login (Local)

### **Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@egytravel.com",
  "password": "Test123456"
}
```

### **Response (200 OK):**
```json
{
  "code": 200,
  "message": "LOGIN SUCCESSFUL",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZWd5dHJhdmVsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAwNzU4MDAwLCJleHAiOjE3MzIyOTQwMDB9.abc123",
    "name": "Test User",
    "email": "test@egytravel.com",
    "image": "https://tse4.mm.bing.net/th/id/OIP.hGSCbXlcOjL_9mmzerqAbQHaHa?pid=Api&P=0&h=220"
  }
}
```

### **Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "INVALID CREDENTIALS",
  "data": null
}
```

---

## 🧪 Test Registration (Local)

### **Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Ahmed Hassan",
  "email": "ahmed@egytravel.com",
  "password": "Test123456"
}
```

### **Response (201 Created):**
```json
{
  "code": 201,
  "message": "REGISTRATION SUCCESSFUL",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "name": "Ahmed Hassan",
    "email": "ahmed@egytravel.com",
    "image": "https://tse4.mm.bing.net/th/id/OIP.hGSCbXlcOjL_9mmzerqAbQHaHa?pid=Api&P=0&h=220"
  }
}
```

### **Error Response (409 Conflict):**
```json
{
  "code": 409,
  "message": "USER ALREADY EXISTS",
  "data": null
}
```

---

## 🌐 Cloud Testing (Railway)

Replace `localhost:3000` with your Railway URL:

### **Login:**
```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "test@egytravel.com",
  "password": "Test123456"
}
```

### **Register:**
```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/register
Content-Type: application/json

{
  "name": "Ahmed Hassan",
  "email": "ahmed@egytravel.com",
  "password": "Test123456"
}
```

---

## 📱 Mobile App Integration

### **Flutter Example:**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final String baseUrl = 'https://YOUR-RAILWAY-URL.up.railway.app';
  
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );
    
    final data = jsonDecode(response.body);
    
    if (data['code'] == 200) {
      // Save token
      await storage.write(key: 'auth_token', value: data['data']['token']);
      return data['data'];
    } else {
      throw Exception(data['message']);
    }
  }
  
  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );
    
    final data = jsonDecode(response.body);
    
    if (data['code'] == 201) {
      // Save token
      await storage.write(key: 'auth_token', value: data['data']['token']);
      return data['data'];
    } else {
      throw Exception(data['message']);
    }
  }
  
  Future<void> makeAuthenticatedRequest(String endpoint) async {
    final token = await storage.read(key: 'auth_token');
    
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    
    return jsonDecode(response.body);
  }
}
```

---

## 🎯 Response Format Summary

### **Success Response:**
```json
{
  "code": 200 | 201,
  "message": "SUCCESS MESSAGE",
  "data": {
    "token": "jwt_token_here",
    "name": "User Name",
    "email": "user@email.com",
    "image": "image_url"
  }
}
```

### **Error Response:**
```json
{
  "code": 400 | 401 | 409 | 500,
  "message": "ERROR MESSAGE",
  "data": null
}
```

---

## ✅ What to Test

1. **Register a new user** - Should return code 201
2. **Login with correct credentials** - Should return code 200 with token
3. **Login with wrong password** - Should return code 401
4. **Register with existing email** - Should return code 409
5. **Use token for protected routes** - Token should work for 365 days

---

## 🔑 Token Usage

After login/register, use the token in all protected endpoints:

```http
GET http://localhost:3000/api/users/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

```http
POST http://localhost:3000/api/bookings/hotel
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "hotelId": "test-hotel-123",
  "hotelName": "Marriott Mena House",
  ...
}
```

---

## 🚀 Ready to Test!

Your authentication API is now updated with:
- ✅ Single token (365 days)
- ✅ Your desired response format
- ✅ Simplified authentication flow

**Test it now in Postman or your mobile app!** 🎉

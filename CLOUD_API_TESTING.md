# EgyTravel API - Cloud Testing Guide (Railway)

## 🌐 Cloud Server URL

**Your Railway Deployment:** `https://egytravel-production.up.railway.app`

> **Note:** Replace with your actual Railway URL from your Railway dashboard

---

## 🚀 Quick Start

### **Find Your Railway URL:**

1. Go to https://railway.app
2. Open your EgyTravel project
3. Click on your service
4. Look for **"Domains"** section
5. Copy your public URL (e.g., `https://egytravel-production.up.railway.app`)

---

## 📋 Authentication Endpoints (Cloud)

### **1. User Registration**

```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "tourist@example.com",
  "password": "Test123456",
  "firstName": "Ahmed",
  "lastName": "Hassan"
}
```

---

### **2. User Login**

```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "tourist@example.com",
  "password": "Test123456"
}
```

---

### **3. Get User Profile**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/api/users/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

### **4. Update User Profile**

```http
PUT https://YOUR-RAILWAY-URL.up.railway.app/api/users/profile
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

---

### **5. Health Check**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/health
```

**Response:**
```json
{
  "success": true,
  "message": "EgyTravel Auth Service is running",
  "timestamp": "2025-11-23T20:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 🏨 Hotel Booking Endpoints (Cloud)

### **1. Search Hotels**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/api/hotels/search?location=Cairo&checkin=2025-12-01&checkout=2025-12-04&guests=2&rooms=1
```

---

### **2. Get Hotel Details**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/api/hotels/HOTEL_ID?checkin=2025-12-01&checkout=2025-12-04
```

---

### **3. Create Hotel Booking**

```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/bookings/hotel
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "hotelId": "test-hotel-123",
  "hotelName": "Marriott Mena House",
  "hotelLocation": "Giza, Cairo",
  "checkinDate": "2025-12-01",
  "checkoutDate": "2025-12-04",
  "guests": 2,
  "rooms": 1,
  "totalPrice": 450.00,
  "currency": "USD"
}
```

---

### **4. Get User Bookings**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/api/bookings
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

### **5. Add Hotel to Favorites**

```http
POST https://YOUR-RAILWAY-URL.up.railway.app/api/favorites/hotel
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "hotelId": "test-hotel-123",
  "hotelName": "Marriott Mena House",
  "location": "Giza, Cairo",
  "imageUrl": "https://example.com/image.jpg",
  "notes": "Perfect for honeymoon!"
}
```

---

### **6. Get Favorites**

```http
GET https://YOUR-RAILWAY-URL.up.railway.app/api/favorites
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🧪 Postman Setup for Cloud Testing

### **Step 1: Create Environment Variable**

1. In Postman, click **Environments** (top right)
2. Click **+** to create new environment
3. Name it: `EgyTravel Production`
4. Add variable:
   - Variable: `base_url`
   - Initial Value: `https://YOUR-RAILWAY-URL.up.railway.app`
   - Current Value: `https://YOUR-RAILWAY-URL.up.railway.app`
5. Click **Save**

### **Step 2: Use Environment Variable in Requests**

Instead of full URL, use:
```
{{base_url}}/api/auth/register
{{base_url}}/api/auth/login
{{base_url}}/api/users/profile
```

### **Step 3: Save Access Token**

After login, add a test script to save the token:

1. In your login request, go to **Tests** tab
2. Add this script:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.data.accessToken);
}
```

3. Now use `{{access_token}}` in Authorization headers

---

## 🔄 Deploy Latest Changes to Railway

### **Option 1: Git Push (Recommended)**

```bash
git add .
git commit -m "Add hotel booking endpoints"
git push origin main
```

Railway will automatically deploy your changes.

---

### **Option 2: Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

## 🔍 Check Deployment Status

### **1. Check Railway Dashboard**

1. Go to https://railway.app
2. Open your project
3. Check **Deployments** tab
4. Wait for "Success" status

### **2. Check Health Endpoint**

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

### **3. Check Logs**

In Railway dashboard:
1. Click on your service
2. Go to **Logs** tab
3. Check for errors

---

## ⚙️ Environment Variables on Railway

Make sure these are set in Railway dashboard:

### **Required Variables:**

```env
# Database (Already set from Railway MySQL)
DB_HOST=your-railway-db-host
DB_PORT=your-railway-db-port
DB_NAME=railway
DB_USER=root
DB_PASSWORD=your-railway-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production

# Booking.com API (Optional for now)
BOOKING_API_USERNAME=your-booking-api-username
BOOKING_API_PASSWORD=your-booking-api-password
BOOKING_AFFILIATE_ID=your-affiliate-id

# API Configuration
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=2
API_RETRY_DELAY=1000

# Cache Configuration
CACHE_TTL_SEARCH=3600
CACHE_TTL_HOTEL=7200
CACHE_TTL_LOCATION=86400

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 🎯 Complete Test Flow (Cloud)

### **1. Test Health Check**

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

### **2. Register User**

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@egytravel.com",
    "password": "Test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### **3. Login**

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@egytravel.com",
    "password": "Test123456"
  }'
```

### **4. Get Profile (with token)**

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🐛 Troubleshooting

### **Issue: 503 Service Unavailable**

**Solution:** Service is starting up. Wait 30 seconds and try again.

---

### **Issue: Database Connection Error**

**Solution:** Check Railway database environment variables are set correctly.

---

### **Issue: CORS Error**

**Solution:** Update CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true
}));
```

---

### **Issue: 404 Not Found**

**Solution:** Make sure you deployed the latest code with all new routes.

---

## 📱 Test from Mobile/Flutter

Your Flutter app should use:

```dart
const String baseUrl = 'https://YOUR-RAILWAY-URL.up.railway.app';

// Example API call
final response = await http.post(
  Uri.parse('$baseUrl/api/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'email': 'test@egytravel.com',
    'password': 'Test123456',
  }),
);
```

---

## ✅ All Cloud Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/users/profile` | Yes | Get profile |
| PUT | `/api/users/profile` | Yes | Update profile |
| GET | `/api/hotels/search` | No | Search hotels |
| GET | `/api/hotels/:id` | No | Hotel details |
| POST | `/api/bookings/hotel` | Yes | Create booking |
| GET | `/api/bookings` | Yes | Get bookings |
| POST | `/api/favorites/hotel` | Yes | Add favorite |
| GET | `/api/favorites` | Yes | Get favorites |

---

## 🚀 Next Steps

1. ✅ Find your Railway URL
2. ✅ Test health endpoint
3. ✅ Test authentication endpoints
4. ✅ Test hotel booking endpoints
5. ⏳ Get Booking.com API credentials
6. ⏳ Update environment variables
7. ⏳ Test with real hotel data

---

**Your API is live and ready for testing! 🎉**

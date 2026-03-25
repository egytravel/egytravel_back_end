# Flight API Testing Guide

## Overview
This document provides comprehensive testing instructions for the EgyTravel Flight API powered by Amadeus.

## Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://egytravel-backend-production.up.railway.app`

## Authentication
Most flight endpoints are **public** and don't require authentication for searching. Booking flights will require JWT authentication.

---

## 1. Flight Search API

### Endpoint
```
GET /api/flights/search
```

### Description
Search for flights between two airports with optional return date for round trips.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| origin | string | Yes | Origin airport IATA code | CAI, JFK, LHR |
| destination | string | Yes | Destination airport IATA code | LXR, DXB, CDG |
| departureDate | string | Yes | Departure date (YYYY-MM-DD) | 2025-12-20 |
| returnDate | string | No | Return date for round trip (YYYY-MM-DD) | 2025-12-27 |
| adults | integer | No | Number of adult passengers (default: 1) | 2 |
| travelClass | string | No | Cabin class (default: ECONOMY) | ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST |

### Example Requests

#### One-Way Flight (Cairo to Luxor)
```bash
curl -X GET "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2&travelClass=ECONOMY"
```

#### Round Trip Flight (Cairo to Dubai)
```bash
curl -X GET "http://localhost:3000/api/flights/search?origin=CAI&destination=DXB&departureDate=2025-12-20&returnDate=2025-12-27&adults=2&travelClass=BUSINESS"
```

#### International Flight (New York to Cairo)
```bash
curl -X GET "http://localhost:3000/api/flights/search?origin=JFK&destination=CAI&departureDate=2025-12-20&adults=1&travelClass=ECONOMY"
```

### Success Response (200 OK)
```json
{
  "code": 200,
  "message": "FLIGHTS FOUND",
  "data": [
    {
      "flightId": "1",
      "airline": "MS",
      "flightNumber": "MS123",
      "departure": {
        "airport": "CAI",
        "terminal": "3",
        "time": "2025-12-20T10:00:00",
        "city": "CAI"
      },
      "arrival": {
        "airport": "LXR",
        "terminal": "1",
        "time": "2025-12-20T11:30:00",
        "city": "LXR"
      },
      "duration": "PT1H30M",
      "stops": 0,
      "cabinClass": "ECONOMY",
      "price": {
        "amount": 150.00,
        "currency": "USD"
      },
      "seats": 9,
      "offerId": "offer-123"
    }
  ],
  "cached": false
}
```

### Error Responses

#### Missing Required Parameters (400)
```json
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_PARAMS",
    "message": "Origin airport code is required"
  }
}
```

#### Invalid Date Format (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid departure date format. Use YYYY-MM-DD"
  }
}
```

#### Invalid Date Range (400)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Departure date must be before return date"
  }
}
```

#### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many search requests. Please try again later."
  }
}
```

---

## 2. Flight Price Details API

### Endpoint
```
POST /api/flights/price
```

### Description
Get detailed pricing information for a specific flight offer.

### Request Body
```json
{
  "flightOffer": {
    "id": "offer-123",
    "type": "flight-offer",
    "source": "GDS",
    "instantTicketingRequired": false,
    "nonHomogeneous": false,
    "oneWay": false,
    "lastTicketingDate": "2025-12-15",
    "numberOfBookableSeats": 9,
    "itineraries": [...],
    "price": {...},
    "pricingOptions": {...},
    "validatingAirlineCodes": ["MS"],
    "travelerPricings": [...]
  }
}
```

### Example Request
```bash
curl -X POST "http://localhost:3000/api/flights/price" \
  -H "Content-Type: application/json" \
  -d '{
    "flightOffer": {
      "id": "offer-123",
      "type": "flight-offer"
    }
  }'
```

### Success Response (200 OK)
```json
{
  "code": 200,
  "message": "FLIGHT PRICE RETRIEVED",
  "data": {
    "type": "flight-offers-pricing",
    "flightOffers": [
      {
        "id": "offer-123",
        "price": {
          "currency": "USD",
          "total": "150.00",
          "base": "120.00",
          "fees": [
            {
              "amount": "30.00",
              "type": "TICKETING"
            }
          ]
        }
      }
    ]
  }
}
```

---

## 3. Location Search API

### Endpoint
```
GET /api/flights/locations
```

### Description
Search for Egyptian airports and cities by keyword.

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| keyword | string | Yes | Search keyword (min 2 chars) | cairo, CAI, luxor |

### Example Requests

#### Search by City Name
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=cairo"
```

#### Search by Airport Code
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=CAI"
```

#### Search by Partial Name
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=sharm"
```

### Success Response (200 OK)
```json
{
  "code": 200,
  "message": "LOCATIONS FOUND",
  "data": [
    {
      "code": "CAI",
      "name": "Cairo",
      "type": "city",
      "country": "Egypt",
      "airport": "Cairo International Airport"
    },
    {
      "code": "SPX",
      "name": "Sphinx",
      "type": "city",
      "country": "Egypt",
      "airport": "Sphinx International Airport"
    }
  ]
}
```

---

## Egyptian Airport Codes Reference

### Popular Destinations

| City | IATA Code | Airport Name | Region |
|------|-----------|--------------|--------|
| Cairo | CAI | Cairo International Airport | Greater Cairo |
| Giza | CAI | Cairo International Airport | Greater Cairo |
| Luxor | LXR | Luxor International Airport | Upper Egypt |
| Aswan | ASW | Aswan International Airport | Upper Egypt |
| Hurghada | HRG | Hurghada International Airport | Red Sea |
| Sharm El Sheikh | SSH | Sharm El Sheikh International Airport | Sinai |
| Marsa Alam | RMF | Marsa Alam International Airport | Red Sea |
| Alexandria | ALY | Borg El Arab Airport | Mediterranean |

### Other Airports

| City | IATA Code | Airport Name |
|------|-----------|--------------|
| Sphinx | SPX | Sphinx International Airport |
| Taba | TCP | Taba International Airport |
| Port Said | PSD | Port Said Airport |
| Sohag | HMB | Sohag International Airport |
| Asyut | ATZ | Asyut International Airport |

---

## Common International Airport Codes

### Middle East
- **DXB** - Dubai, UAE
- **DOH** - Doha, Qatar
- **AUH** - Abu Dhabi, UAE
- **JED** - Jeddah, Saudi Arabia
- **RUH** - Riyadh, Saudi Arabia
- **AMM** - Amman, Jordan
- **BEY** - Beirut, Lebanon

### Europe
- **LHR** - London Heathrow, UK
- **CDG** - Paris Charles de Gaulle, France
- **FRA** - Frankfurt, Germany
- **FCO** - Rome Fiumicino, Italy
- **MAD** - Madrid, Spain
- **AMS** - Amsterdam, Netherlands
- **IST** - Istanbul, Turkey

### North America
- **JFK** - New York JFK, USA
- **LAX** - Los Angeles, USA
- **ORD** - Chicago O'Hare, USA
- **YYZ** - Toronto, Canada

---

## Travel Class Options

| Class | Code | Description |
|-------|------|-------------|
| Economy | ECONOMY | Standard economy class |
| Premium Economy | PREMIUM_ECONOMY | Enhanced economy with extra legroom |
| Business | BUSINESS | Business class with lie-flat seats |
| First | FIRST | First class with premium service |

---

## Testing Scenarios

### Scenario 1: Domestic Flight Search
```bash
# Search for flights from Cairo to Luxor
curl -X GET "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2"
```

**Expected**: List of domestic flights with EgyptAir and other carriers

### Scenario 2: International Round Trip
```bash
# Search for round trip from Cairo to Dubai
curl -X GET "http://localhost:3000/api/flights/search?origin=CAI&destination=DXB&departureDate=2025-12-20&returnDate=2025-12-27&adults=2&travelClass=BUSINESS"
```

**Expected**: List of round trip flights with business class pricing

### Scenario 3: One-Way International
```bash
# Search for one-way flight from New York to Cairo
curl -X GET "http://localhost:3000/api/flights/search?origin=JFK&destination=CAI&departureDate=2025-12-20&adults=1"
```

**Expected**: List of international flights with various airlines

### Scenario 4: Invalid Date Range
```bash
# Try to search with departure after return
curl -X GET "http://localhost:3000/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-27&returnDate=2025-12-20&adults=2"
```

**Expected**: 400 error with "Departure date must be before return date"

### Scenario 5: Missing Required Parameters
```bash
# Try to search without origin
curl -X GET "http://localhost:3000/api/flights/search?destination=LXR&departureDate=2025-12-20"
```

**Expected**: 400 error with "Origin airport code is required"

### Scenario 6: Location Search
```bash
# Search for airports in Egypt
curl -X GET "http://localhost:3000/api/flights/locations?keyword=egypt"
```

**Expected**: List of all Egyptian airports

---

## Rate Limiting

- **Limit**: 50 requests per 15 minutes per IP address
- **Applies to**: `/api/flights/search` endpoint
- **Response when exceeded**: 429 status code with rate limit error

---

## Caching

- **Flight search results**: Cached for 30 minutes
- **Cache key**: Based on search parameters (origin, destination, dates, adults, class)
- **Cache indicator**: `cached: true` in response when served from cache

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_REQUIRED_PARAMS | 400 | Required parameter is missing |
| VALIDATION_ERROR | 400 | Invalid parameter format or value |
| INVALID_DATE_RANGE | 400 | Departure date is not before return date |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| API_TIMEOUT | 504 | Amadeus API request timed out |
| API_UNAVAILABLE | 503 | Amadeus API is temporarily unavailable |
| INTERNAL_ERROR | 500 | Server error occurred |

---

## Postman Collection

### Import this collection for easy testing:

```json
{
  "info": {
    "name": "EgyTravel Flight API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Search Flights - One Way",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20&adults=2&travelClass=ECONOMY",
          "host": ["{{baseUrl}}"],
          "path": ["api", "flights", "search"],
          "query": [
            {"key": "origin", "value": "CAI"},
            {"key": "destination", "value": "LXR"},
            {"key": "departureDate", "value": "2025-12-20"},
            {"key": "adults", "value": "2"},
            {"key": "travelClass", "value": "ECONOMY"}
          ]
        }
      }
    },
    {
      "name": "Search Flights - Round Trip",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/flights/search?origin=CAI&destination=DXB&departureDate=2025-12-20&returnDate=2025-12-27&adults=2&travelClass=BUSINESS",
          "host": ["{{baseUrl}}"],
          "path": ["api", "flights", "search"],
          "query": [
            {"key": "origin", "value": "CAI"},
            {"key": "destination", "value": "DXB"},
            {"key": "departureDate", "value": "2025-12-20"},
            {"key": "returnDate", "value": "2025-12-27"},
            {"key": "adults", "value": "2"},
            {"key": "travelClass", "value": "BUSINESS"}
          ]
        }
      }
    },
    {
      "name": "Search Locations",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/flights/locations?keyword=cairo",
          "host": ["{{baseUrl}}"],
          "path": ["api", "flights", "locations"],
          "query": [
            {"key": "keyword", "value": "cairo"}
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## Notes

1. **Amadeus Test Environment**: Currently using Amadeus test API. Results may be limited or simulated.
2. **Production**: Switch to production Amadeus API by updating `AMADEUS_API_BASE_URL` in `.env`
3. **Real-time Data**: Flight availability and prices are fetched in real-time from Amadeus
4. **Booking**: Flight booking endpoints will be added in future updates

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify Amadeus API credentials in `.env`
- Ensure date formats are correct (YYYY-MM-DD)
- Check that airport codes are valid IATA codes

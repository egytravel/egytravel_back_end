# Egyptian City & Airport Codes Reference

## Overview
This document provides a complete reference of Egyptian city and airport IATA codes for use with the EgyTravel Hotel and Flight APIs powered by Amadeus.

---

## Popular Tourist Destinations

### Cairo & Giza
- **City Code**: `CAI`
- **Airport Code**: `CAI`
- **Airport Name**: Cairo International Airport
- **Arabic Name**: القاهرة / الجيزة
- **Region**: Greater Cairo
- **Description**: Egypt's capital and largest city, home to the Pyramids of Giza
- **Use for**: Hotels in Cairo, Giza, and surrounding areas

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=CAI&checkin=2025-12-20&checkout=2025-12-25

# Flight Search
GET /api/flights/search?origin=JFK&destination=CAI&departureDate=2025-12-20
```

---

### Luxor
- **City Code**: `LXR`
- **Airport Code**: `LXR`
- **Airport Name**: Luxor International Airport
- **Arabic Name**: الأقصر
- **Region**: Upper Egypt
- **Description**: Ancient Thebes, Valley of the Kings, Karnak Temple
- **Use for**: Hotels and flights to Luxor

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=LXR&checkin=2025-12-20&checkout=2025-12-23

# Flight Search (Cairo to Luxor)
GET /api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20
```

---

### Aswan
- **City Code**: `ASW`
- **Airport Code**: `ASW`
- **Airport Name**: Aswan International Airport
- **Arabic Name**: أسوان
- **Region**: Upper Egypt
- **Description**: Philae Temple, Abu Simbel, Nile cruises
- **Use for**: Hotels and flights to Aswan

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=ASW&checkin=2025-12-20&checkout=2025-12-23

# Flight Search (Cairo to Aswan)
GET /api/flights/search?origin=CAI&destination=ASW&departureDate=2025-12-20
```

---

### Hurghada
- **City Code**: `HRG`
- **Airport Code**: `HRG`
- **Airport Name**: Hurghada International Airport
- **Arabic Name**: الغردقة
- **Region**: Red Sea
- **Description**: Red Sea resort, diving, beaches
- **Use for**: Hotels and flights to Hurghada

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=HRG&checkin=2025-12-20&checkout=2025-12-27

# Flight Search (Cairo to Hurghada)
GET /api/flights/search?origin=CAI&destination=HRG&departureDate=2025-12-20
```

---

### Sharm El Sheikh
- **City Code**: `SSH`
- **Airport Code**: `SSH`
- **Airport Name**: Sharm El Sheikh International Airport
- **Arabic Name**: شرم الشيخ
- **Region**: Sinai Peninsula
- **Description**: Red Sea resort, Ras Mohammed National Park, diving
- **Use for**: Hotels and flights to Sharm El Sheikh

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=SSH&checkin=2025-12-20&checkout=2025-12-27

# Flight Search (Cairo to Sharm El Sheikh)
GET /api/flights/search?origin=CAI&destination=SSH&departureDate=2025-12-20
```

---

### Marsa Alam
- **City Code**: `RMF`
- **Airport Code**: `RMF`
- **Airport Name**: Marsa Alam International Airport
- **Arabic Name**: مرسى علم
- **Region**: Red Sea
- **Description**: Pristine beaches, diving, less crowded than Hurghada
- **Use for**: Hotels and flights to Marsa Alam

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=RMF&checkin=2025-12-20&checkout=2025-12-27

# Flight Search (Cairo to Marsa Alam)
GET /api/flights/search?origin=CAI&destination=RMF&departureDate=2025-12-20
```

---

### Alexandria
- **City Code**: `ALY`
- **Airport Code**: `ALY`
- **Airport Name**: Borg El Arab Airport
- **Arabic Name**: الإسكندرية
- **Region**: Mediterranean Coast
- **Description**: Mediterranean port city, Bibliotheca Alexandrina
- **Use for**: Hotels and flights to Alexandria

**API Usage:**
```bash
# Hotel Search
GET /api/hotels/search?location=ALY&checkin=2025-12-20&checkout=2025-12-23

# Flight Search (Cairo to Alexandria)
GET /api/flights/search?origin=CAI&destination=ALY&departureDate=2025-12-20
```

---

## Other Egyptian Cities

### Sphinx (New Capital Area)
- **City Code**: `SPX`
- **Airport Code**: `SPX`
- **Airport Name**: Sphinx International Airport
- **Arabic Name**: أبو الهول
- **Region**: Greater Cairo
- **Description**: New administrative capital area

---

### Taba
- **City Code**: `TCP`
- **Airport Code**: `TCP`
- **Airport Name**: Taba International Airport
- **Arabic Name**: طابا
- **Region**: Sinai Peninsula
- **Description**: Border town with Israel, Red Sea resort

---

### Port Said
- **City Code**: `PSD`
- **Airport Code**: `PSD`
- **Airport Name**: Port Said Airport
- **Arabic Name**: بورسعيد
- **Region**: Canal Zone
- **Description**: Suez Canal city

---

### Sohag
- **City Code**: `HMB`
- **Airport Code**: `HMB`
- **Airport Name**: Sohag International Airport
- **Arabic Name**: سوهاج
- **Region**: Upper Egypt
- **Description**: Ancient temples, Abydos

---

### Asyut
- **City Code**: `ATZ`
- **Airport Code**: `ATZ`
- **Airport Name**: Asyut International Airport
- **Arabic Name**: أسيوط
- **Region**: Upper Egypt
- **Description**: Central Egypt city

---

## Quick Reference Table

| City | IATA Code | Airport | Region | Popular |
|------|-----------|---------|--------|---------|
| Cairo | CAI | Cairo International | Greater Cairo | ⭐⭐⭐⭐⭐ |
| Giza | CAI | Cairo International | Greater Cairo | ⭐⭐⭐⭐⭐ |
| Luxor | LXR | Luxor International | Upper Egypt | ⭐⭐⭐⭐⭐ |
| Aswan | ASW | Aswan International | Upper Egypt | ⭐⭐⭐⭐⭐ |
| Hurghada | HRG | Hurghada International | Red Sea | ⭐⭐⭐⭐⭐ |
| Sharm El Sheikh | SSH | Sharm El Sheikh International | Sinai | ⭐⭐⭐⭐⭐ |
| Marsa Alam | RMF | Marsa Alam International | Red Sea | ⭐⭐⭐⭐ |
| Alexandria | ALY | Borg El Arab | Mediterranean | ⭐⭐⭐⭐ |
| Sphinx | SPX | Sphinx International | Greater Cairo | ⭐⭐ |
| Taba | TCP | Taba International | Sinai | ⭐⭐ |
| Port Said | PSD | Port Said | Canal Zone | ⭐⭐ |
| Sohag | HMB | Sohag International | Upper Egypt | ⭐⭐ |
| Asyut | ATZ | Asyut International | Upper Egypt | ⭐⭐ |

---

## Popular Tourist Routes

### Domestic Flights
1. **Cairo (CAI) ↔ Luxor (LXR)** - 1h 15m
2. **Cairo (CAI) ↔ Aswan (ASW)** - 1h 30m
3. **Cairo (CAI) ↔ Hurghada (HRG)** - 1h
4. **Cairo (CAI) ↔ Sharm El Sheikh (SSH)** - 1h
5. **Cairo (CAI) ↔ Alexandria (ALY)** - 45m

### International Connections
1. **Dubai (DXB) ↔ Cairo (CAI)** - 3h 30m
2. **London (LHR) ↔ Cairo (CAI)** - 5h
3. **Paris (CDG) ↔ Cairo (CAI)** - 4h 30m
4. **New York (JFK) ↔ Cairo (CAI)** - 11h
5. **Istanbul (IST) ↔ Cairo (CAI)** - 2h 30m

---

## Using the Location Search API

### Search by City Name
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=cairo"
```

**Response:**
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
    }
  ]
}
```

### Search by Airport Code
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=LXR"
```

### Search by Arabic Name
```bash
curl -X GET "http://localhost:3000/api/flights/locations?keyword=الأقصر"
```

---

## Code Validation

The API automatically validates city and airport codes. If you provide an invalid code, you'll receive an error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid city or airport code"
  }
}
```

---

## Tips for Developers

### 1. Use City Codes for Hotels
```javascript
// Good - Use IATA city code
GET /api/hotels/search?location=CAI&checkin=2025-12-20

// Also works - City name (will be converted to code)
GET /api/hotels/search?location=Cairo&checkin=2025-12-20
```

### 2. Use Airport Codes for Flights
```javascript
// Always use IATA airport codes for flights
GET /api/flights/search?origin=CAI&destination=LXR&departureDate=2025-12-20
```

### 3. Handle Multiple Cities with Same Airport
```javascript
// Cairo and Giza both use CAI airport
// Hotels in either city can be searched with CAI
GET /api/hotels/search?location=CAI  // Returns hotels in Cairo AND Giza
```

### 4. Autocomplete Implementation
```javascript
// Implement autocomplete with location search
const searchCities = async (keyword) => {
  const response = await fetch(
    `http://localhost:3000/api/flights/locations?keyword=${keyword}`
  );
  const data = await response.json();
  return data.data; // Array of matching cities
};
```

---

## Common Errors

### Invalid City Code
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid city code. Use IATA codes like CAI, LXR, ASW"
  }
}
```

### City Not Found
```json
{
  "success": false,
  "error": {
    "code": "CITY_NOT_FOUND",
    "message": "No hotels found in this location"
  }
}
```

---

## Integration Examples

### React/Next.js
```javascript
import { useState, useEffect } from 'react';

const CityAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (query.length >= 2) {
      fetch(`/api/flights/locations?keyword=${query}`)
        .then(res => res.json())
        .then(data => setCities(data.data));
    }
  }, [query]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search cities..."
    />
  );
};
```

### Flutter/Dart
```dart
Future<List<City>> searchCities(String keyword) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/flights/locations?keyword=$keyword'),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data'] as List)
        .map((city) => City.fromJson(city))
        .toList();
  }
  throw Exception('Failed to load cities');
}
```

---

## Support

For questions or issues with city codes:
1. Check this reference document
2. Use the location search API to find valid codes
3. Verify IATA codes on official aviation websites
4. Contact support for adding new cities

---

## Updates

This document is maintained alongside the EgyTravel API. New cities and airports will be added as they become available in the Amadeus system.

**Last Updated**: December 2025

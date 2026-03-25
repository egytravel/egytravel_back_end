const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

// ─── Static curated data (homescreen) ────────────────────────────────────────

// GET /api/home — full homescreen payload
router.get('/', homeController.getHomeData);

// GET /api/home/search?q=luxor — search curated destinations
router.get('/search', homeController.searchDestinations);

// GET /api/home/destinations — all destinations with filters
router.get('/destinations', homeController.getAllDestinations);

// GET /api/home/destinations/:id — single destination detail
router.get('/destinations/:id', homeController.getDestinationById);

// GET /api/home/cities — city cards
router.get('/cities', homeController.getCities);

// ─── Map endpoints ────────────────────────────────────────────────────────────

// GET /api/home/map/markers — all pins for map initial load
router.get('/map/markers', homeController.getMapMarkers);

// GET /api/home/map/search?q=luxor — search + camera position for map
router.get('/map/search', searchLimiter, homeController.mapSearch);

// ─── Real data via OpenTripMap ────────────────────────────────────────────────

// GET /api/home/places/search?q=sphinx — live place search within Egypt
router.get('/places/search', searchLimiter, homeController.searchRealPlaces);

// GET /api/home/places/city/luxor — real attractions for a city
router.get('/places/city/:cityId', homeController.getCityPlaces);

// GET /api/home/places/:xid — full detail for a real place
router.get('/places/:xid', homeController.getRealPlaceDetails);

module.exports = router;

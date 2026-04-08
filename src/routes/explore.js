const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/exploreController');
const rateLimit = require('express-rate-limit');

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

// GET /api/explore — full explore screen payload
router.get('/', exploreController.getExploreData);

// GET /api/explore/search?q=pyramids&type=places|restaurants|hotels|all
router.get('/search', searchLimiter, exploreController.searchExplore);

// GET /api/explore/map?type=places|restaurants|hotels|all
router.get('/map', exploreController.getExploreMapMarkers);

// GET /api/explore/places?category=Historical&limit=20
router.get('/places', exploreController.getPlaces);

// GET /api/explore/places/:id
router.get('/places/:id', exploreController.getPlaceById);

// GET /api/explore/restaurants?city=Cairo&category=Egyptian
router.get('/restaurants', exploreController.getRestaurants);

// GET /api/explore/restaurants/:id
router.get('/restaurants/:id', exploreController.getRestaurantById);

// GET /api/explore/hotels?city=Aswan&category=Luxury
router.get('/hotels', exploreController.getCuratedHotels);

// GET /api/explore/flights
router.get('/flights', exploreController.getPopularFlights);

module.exports = router;

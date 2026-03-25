const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const rateLimit = require('express-rate-limit');

// Rate limiter for flight search (prevent abuse)
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests. Please try again later.'
    }
  }
});

/**
 * @route   GET /api/flights/search
 * @desc    Search for flights
 * @access  Public
 * @query   origin, destination, departureDate, returnDate?, adults?, travelClass?
 */
router.get('/search', searchLimiter, flightController.searchFlights);

/**
 * @route   POST /api/flights/price
 * @desc    Get detailed flight pricing
 * @access  Public
 * @body    flightOffer (flight offer object from search)
 */
router.post('/price', flightController.getFlightPrice);

/**
 * @route   GET /api/flights/locations
 * @desc    Search for airports/cities
 * @access  Public
 * @query   keyword (search term)
 */
router.get('/locations', flightController.searchLocations);

module.exports = router;

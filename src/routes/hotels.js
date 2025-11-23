const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const rateLimit = require('express-rate-limit');

// Rate limiter for hotel search (prevent abuse)
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
 * @route   GET /api/hotels/search
 * @desc    Search for hotels
 * @access  Public
 * @query   location, checkin, checkout, guests, rooms
 */
router.get('/search', searchLimiter, hotelController.searchHotels);

/**
 * @route   GET /api/hotels/:hotelId
 * @desc    Get hotel details by ID
 * @access  Public
 * @params  hotelId
 * @query   checkin, checkout, guests, rooms
 */
router.get('/:hotelId', hotelController.getHotelDetails);

module.exports = router;

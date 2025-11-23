const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

// All booking routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/bookings/hotel
 * @desc    Create hotel booking
 * @access  Private (authenticated users)
 * @body    hotelId, hotelName, hotelLocation, checkinDate, checkoutDate, guests, rooms, tripId, totalPrice, currency
 */
router.post('/hotel', bookingController.createHotelBooking);

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings
 * @access  Private (authenticated users)
 * @query   tripId, status, type
 */
router.get('/', bookingController.getBookings);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get single booking
 * @access  Private (authenticated users)
 * @params  bookingId
 */
router.get('/:bookingId', bookingController.getBooking);

/**
 * @route   PUT /api/bookings/:bookingId
 * @desc    Update booking
 * @access  Private (authenticated users)
 * @params  bookingId
 * @body    status, bookingReference, notes
 */
router.put('/:bookingId', bookingController.updateBooking);

/**
 * @route   DELETE /api/bookings/:bookingId
 * @desc    Delete booking
 * @access  Private (authenticated users)
 * @params  bookingId
 */
router.delete('/:bookingId', bookingController.deleteBooking);

module.exports = router;

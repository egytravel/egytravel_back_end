const bookingcomService = require('../services/bookingcomService');
const cacheService = require('../services/cacheService');
const { isValidDate, isValidDateRange, isPositiveInteger } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Search for hotels
 * GET /api/hotels/search
 */
exports.searchHotels = async (req, res) => {
  try {
    const { location, checkin, checkout, guests, rooms } = req.query;
    
    // Validate required parameters
    if (!location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Location is required'
        }
      });
    }
    
    if (!checkin) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Check-in date is required'
        }
      });
    }
    
    // Validate date formats
    if (!isValidDate(checkin)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid check-in date format. Use YYYY-MM-DD'
        }
      });
    }
    
    if (checkout && !isValidDate(checkout)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid check-out date format. Use YYYY-MM-DD'
        }
      });
    }
    
    // Validate date range
    if (checkout && !isValidDateRange(checkin, checkout)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Check-in date must be before check-out date'
        }
      });
    }
    
    // Validate numeric parameters
    const guestsNum = guests ? parseInt(guests) : 2;
    const roomsNum = rooms ? parseInt(rooms) : 1;
    
    if (guests && !isPositiveInteger(guests)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Guests must be a positive integer'
        }
      });
    }
    
    if (rooms && !isPositiveInteger(rooms)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rooms must be a positive integer'
        }
      });
    }
    
    const searchParams = {
      location,
      checkin,
      checkout: checkout || checkin, // Default to same day if not provided
      guests: guestsNum,
      rooms: roomsNum
    };
    
    // Check cache first
    const cachedResults = cacheService.getSearchResults(searchParams);
    if (cachedResults) {
      logger.info('Hotel search - cache hit', { searchParams });
      return res.json({
        success: true,
        data: cachedResults,
        cached: true
      });
    }
    
    // Call Booking.com API
    logger.info('Hotel search - calling API', { searchParams });
    const results = await bookingcomService.searchHotels(searchParams);
    
    // Cache the results
    cacheService.setSearchResults(searchParams, results);
    
    // Return results
    res.json({
      success: true,
      data: results,
      cached: false
    });
    
  } catch (error) {
    logger.error('Hotel search error', { error: error.message });
    
    if (error.code === 'API_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'Hotel search request timed out. Please try again.'
        }
      });
    }
    
    if (error.code === 'API_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'Hotel search service is temporarily unavailable. Please try again later.'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching for hotels'
      }
    });
  }
};

/**
 * Get hotel details by ID
 * GET /api/hotels/:hotelId
 */
exports.getHotelDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkin, checkout, guests, rooms } = req.query;
    
    // Validate hotel ID
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Hotel ID is required'
        }
      });
    }
    
    // Validate dates if provided
    if (checkin && !isValidDate(checkin)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid check-in date format. Use YYYY-MM-DD'
        }
      });
    }
    
    if (checkout && !isValidDate(checkout)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid check-out date format. Use YYYY-MM-DD'
        }
      });
    }
    
    if (checkin && checkout && !isValidDateRange(checkin, checkout)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Check-in date must be before check-out date'
        }
      });
    }
    
    const params = {
      checkin: checkin || new Date().toISOString().split('T')[0],
      checkout: checkout || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      guests: guests ? parseInt(guests) : 2,
      rooms: rooms ? parseInt(rooms) : 1
    };
    
    // Check cache first
    const cachedDetails = cacheService.getHotelDetails(hotelId, params);
    if (cachedDetails) {
      logger.info('Hotel details - cache hit', { hotelId });
      return res.json({
        success: true,
        data: cachedDetails,
        cached: true
      });
    }
    
    // Call Booking.com API
    logger.info('Hotel details - calling API', { hotelId, params });
    const details = await bookingcomService.getHotelDetails(hotelId, params);
    
    // Cache the details
    cacheService.setHotelDetails(hotelId, details, params);
    
    // Return details
    res.json({
      success: true,
      data: details,
      cached: false
    });
    
  } catch (error) {
    logger.error('Get hotel details error', { error: error.message });
    
    if (error.message === 'Hotel not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HOTEL_NOT_FOUND',
          message: 'Hotel not found'
        }
      });
    }
    
    if (error.code === 'API_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'Request timed out. Please try again.'
        }
      });
    }
    
    if (error.code === 'API_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'Service is temporarily unavailable. Please try again later.'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching hotel details'
      }
    });
  }
};

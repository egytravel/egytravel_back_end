const flightService = require('../services/bookingComFlightService');
const { isValidDate, isValidDateRange, isPositiveInteger } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * GET /api/flights/search
 */
exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults, travelClass } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'origin, destination, and departureDate are required' }
      });
    }

    if (!isValidDate(departureDate)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid departure date. Use YYYY-MM-DD' } });
    }

    if (returnDate && !isValidDate(returnDate)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid return date. Use YYYY-MM-DD' } });
    }

    if (returnDate && !isValidDateRange(departureDate, returnDate)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: 'Departure must be before return date' } });
    }

    const adultsNum = adults ? parseInt(adults) : 1;
    const cabinClass = travelClass ? travelClass.toUpperCase() : 'ECONOMY';
    const validClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];

    if (!validClasses.includes(cabinClass)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid travel class' } });
    }

    logger.info('Flight search', { origin, destination, departureDate, returnDate });

    const results = await flightService.searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: returnDate || null,
      adults: adultsNum,
      cabinClass
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error('Flight search error', { error: error.message });

    if (error.response?.status === 422) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid airport code or search parameters' } });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } });
    }

    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search flights' } });
  }
};

/**
 * GET /api/flights/locations?keyword=Cairo
 */
exports.searchLocations = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.length < 2) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Keyword must be at least 2 characters' } });
    }

    const results = await flightService.searchLocations(keyword);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    logger.error('Location search error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search locations' } });
  }
};

/**
 * POST /api/flights/price — kept for compatibility but not used with Booking.com
 */
exports.getFlightPrice = async (req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Use the booking URL from flight search results to complete booking on Booking.com' }
  });
};

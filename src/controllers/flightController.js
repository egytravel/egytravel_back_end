const amadeusService = require('../services/amadeusService');
const cacheService = require('../services/cacheService');
const { isValidDate, isValidDateRange, isPositiveInteger } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Search for flights
 * GET /api/flights/search
 */
exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, adults, travelClass } = req.query;
    
    // Validate required parameters
    if (!origin) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Origin airport code is required'
        }
      });
    }
    
    if (!destination) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Destination airport code is required'
        }
      });
    }
    
    if (!departureDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Departure date is required'
        }
      });
    }
    
    // Validate date formats
    if (!isValidDate(departureDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid departure date format. Use YYYY-MM-DD'
        }
      });
    }
    
    if (returnDate && !isValidDate(returnDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid return date format. Use YYYY-MM-DD'
        }
      });
    }
    
    // Validate date range for round trip
    if (returnDate && !isValidDateRange(departureDate, returnDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Departure date must be before return date'
        }
      });
    }
    
    // Validate adults parameter
    const adultsNum = adults ? parseInt(adults) : 1;
    if (adults && !isPositiveInteger(adults)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Adults must be a positive integer'
        }
      });
    }
    
    // Validate travel class
    const validClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    const travelClassUpper = travelClass ? travelClass.toUpperCase() : 'ECONOMY';
    
    if (travelClass && !validClasses.includes(travelClassUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid travel class. Must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST'
        }
      });
    }
    
    const searchParams = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: returnDate || null,
      adults: adultsNum,
      travelClass: travelClassUpper
    };
    
    // Note: Flight caching can be added later with a dedicated flight cache
    // For now, we'll call the API directly for real-time flight data
    
    // Call Amadeus API
    logger.info('Flight search - calling Amadeus API', { searchParams });
    const results = await amadeusService.searchFlights(searchParams);
    
    // Return results
    res.json({
      code: 200,
      message: 'FLIGHTS FOUND',
      data: results,
      cached: false
    });
    
  } catch (error) {
    logger.error('Flight search error', { error: error.message });
    
    if (error.code === 'API_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'API_TIMEOUT',
          message: 'Flight search request timed out. Please try again.'
        }
      });
    }
    
    if (error.code === 'API_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'API_UNAVAILABLE',
          message: 'Flight search service is temporarily unavailable. Please try again later.'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching for flights',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      }
    });
  }
};

/**
 * Get flight price details
 * POST /api/flights/price
 */
exports.getFlightPrice = async (req, res) => {
  try {
    const { flightOffer } = req.body;
    
    if (!flightOffer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Flight offer data is required'
        }
      });
    }
    
    logger.info('Getting flight price', { offerId: flightOffer.id });
    const priceDetails = await amadeusService.getFlightPrice(flightOffer);
    
    res.json({
      code: 200,
      message: 'FLIGHT PRICE RETRIEVED',
      data: priceDetails
    });
    
  } catch (error) {
    logger.error('Get flight price error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching flight price',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      }
    });
  }
};

/**
 * Get airport/city suggestions
 * GET /api/flights/locations
 */
exports.searchLocations = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Keyword must be at least 2 characters'
        }
      });
    }
    
    // For now, return Egyptian airports/cities
    // In production, you'd call Amadeus location API
    const egyptianLocations = getEgyptianLocations(keyword);
    
    res.json({
      code: 200,
      message: 'LOCATIONS FOUND',
      data: egyptianLocations
    });
    
  } catch (error) {
    logger.error('Location search error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching locations'
      }
    });
  }
};

/**
 * Helper function to get Egyptian locations
 * @param {string} keyword - Search keyword
 * @returns {Array} Matching locations
 */
function getEgyptianLocations(keyword) {
  const locations = [
    { code: 'CAI', name: 'Cairo', type: 'city', country: 'Egypt', airport: 'Cairo International Airport' },
    { code: 'LXR', name: 'Luxor', type: 'city', country: 'Egypt', airport: 'Luxor International Airport' },
    { code: 'ASW', name: 'Aswan', type: 'city', country: 'Egypt', airport: 'Aswan International Airport' },
    { code: 'SSH', name: 'Sharm El Sheikh', type: 'city', country: 'Egypt', airport: 'Sharm El Sheikh International Airport' },
    { code: 'HRG', name: 'Hurghada', type: 'city', country: 'Egypt', airport: 'Hurghada International Airport' },
    { code: 'ALY', name: 'Alexandria', type: 'city', country: 'Egypt', airport: 'Borg El Arab Airport' },
    { code: 'MUH', name: 'Marsa Alam', type: 'city', country: 'Egypt', airport: 'Marsa Alam International Airport' },
    { code: 'SPX', name: 'Sphinx', type: 'city', country: 'Egypt', airport: 'Sphinx International Airport' }
  ];
  
  const keywordLower = keyword.toLowerCase();
  return locations.filter(loc => 
    loc.name.toLowerCase().includes(keywordLower) || 
    loc.code.toLowerCase().includes(keywordLower) ||
    loc.airport.toLowerCase().includes(keywordLower)
  );
}

module.exports = exports;

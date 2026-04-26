const bookingService = require('../services/bookingComRapidService');
const { isValidDate, isValidDateRange, isPositiveInteger } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * GET /api/hotels/search
 * Search hotels using Booking.com via RapidAPI
 */
exports.searchHotels = async (req, res) => {
  try {
    const { location, checkin, checkout, guests, rooms } = req.query;

    if (!location) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Location is required (e.g. CAI, LXR, ASW, SSH, HRG, ALY)' } });
    }
    if (!checkin) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Check-in date is required (YYYY-MM-DD)' } });
    }
    if (!checkout) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Check-out date is required (YYYY-MM-DD)' } });
    }
    if (!isValidDate(checkin) || !isValidDate(checkout)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Use YYYY-MM-DD' } });
    }
    if (!isValidDateRange(checkin, checkout)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE_RANGE', message: 'Check-in must be before check-out' } });
    }

    const guestsNum = guests ? parseInt(guests) : 2;
    const roomsNum = rooms ? parseInt(rooms) : 1;
    const page = parseInt(req.query.page) || 0;

    logger.info('Hotel search', { location, checkin, checkout, guests: guestsNum });

    const results = await bookingService.searchHotels({
      cityCode: location.toUpperCase(),
      checkin,
      checkout,
      adults: guestsNum,
      rooms: roomsNum,
      page
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    logger.error('Hotel search error', { error: error.message });

    if (error.message?.includes('not supported')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_LOCATION', message: error.message } });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' } });
    }

    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search hotels' } });
  }
};

/**
 * GET /api/hotels/:hotelId
 * Get hotel details + photos
 */
exports.getHotelDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkin, checkout, guests, rooms } = req.query;

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const params = {
      checkin: checkin || today,
      checkout: checkout || tomorrow,
      adults: guests ? parseInt(guests) : 2,
      rooms: rooms ? parseInt(rooms) : 1
    };

    const [detail, photos] = await Promise.all([
      bookingService.getHotelDetails(hotelId, params),
      bookingService.getHotelPhotos(hotelId)
    ]);

    res.json({
      success: true,
      data: { ...detail, images: photos }
    });
  } catch (error) {
    logger.error('Hotel details error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load hotel details' } });
  }
};

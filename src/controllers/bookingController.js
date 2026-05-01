const { Booking, Trip } = require('../models/sql');
const { generateAffiliateLink } = require('../utils/affiliateLink');
const { isValidDate, isValidDateRange, isPositiveInteger, isValidBookingStatus } = require('../utils/validators');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Create hotel booking
 * POST /api/bookings/hotel
 */
exports.createHotelBooking = async (req, res) => {
  try {
    const userId = req.user.user_id; // From auth middleware
    const {
      hotelId,
      hotelName,
      hotelLocation,
      hotelAddress,
      checkinDate,
      checkoutDate,
      guests,
      rooms,
      tripId,
      totalPrice,
      currency,
      bookingData,
      notes
    } = req.body;
    
    // Validate required fields
    if (!hotelId || !hotelName || !checkinDate || !checkoutDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Missing required fields: hotelId, hotelName, checkinDate, checkoutDate'
        }
      });
    }
    
    // Validate dates
    if (!isValidDate(checkinDate) || !isValidDate(checkoutDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format. Use YYYY-MM-DD'
        }
      });
    }
    
    if (!isValidDateRange(checkinDate, checkoutDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Check-in date must be before check-out date'
        }
      });
    }
    
    // Validate numeric fields
    const guestsNum = guests || 2;
    const roomsNum = rooms || 1;
    
    if (!isPositiveInteger(guestsNum) || !isPositiveInteger(roomsNum)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Guests and rooms must be positive integers'
        }
      });
    }
    
    // Validate trip exists if tripId provided
    if (tripId) {
      const trip = await Trip.findOne({
        where: { trip_id: tripId, user_id: userId }
      });
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TRIP_NOT_FOUND',
            message: 'Trip not found or does not belong to user'
          }
        });
      }
    }
    
    // Generate affiliate link
    const affiliateLink = generateAffiliateLink({
      hotelId,
      checkin: checkinDate,
      checkout: checkoutDate,
      guests: guestsNum,
      rooms: roomsNum
    });
    
    // Create booking record
    const booking = await Booking.create({
      user_id: userId,
      trip_id: tripId || null,
      booking_type: 'hotel',
      provider: 'Booking.com',
      booking_url: affiliateLink,
      status: 'pending',
      total_price: totalPrice || null,
      currency: currency || 'USD',
      hotel_id: hotelId,
      hotel_name: hotelName,
      hotel_location: hotelLocation || null,
      hotel_address: hotelAddress || null,
      check_in_date: checkinDate,
      check_out_date: checkoutDate,
      guests: guestsNum,
      rooms: roomsNum,
      booking_data: bookingData || null,
      notes: notes || null
    });
    
    logger.info('Hotel booking created', {
      bookingId: booking.booking_id,
      userId,
      hotelId
    });
    
    res.status(201).json({
      success: true,
      data: booking.toJSON()
    });
    
  } catch (error) {
    logger.error('Create hotel booking error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the booking'
      }
    });
  }
};

/**
 * Get user's bookings
 * GET /api/bookings
 */
exports.getBookings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId, status, type } = req.query;
    
    // Build query conditions
    const where = { user_id: userId };
    
    if (tripId) {
      where.trip_id = tripId;
    }
    
    if (status && isValidBookingStatus(status)) {
      where.status = status;
    }
    
    if (type) {
      where.booking_type = type;
    }
    
    // Fetch bookings sorted by check-in date
    const bookings = await Booking.findAll({
      where,
      order: [
        ['check_in_date', 'ASC'],
        ['created_at', 'DESC']
      ],
      include: [
        {
          model: Trip,
          as: 'trip',
          attributes: ['trip_id', 'title', 'destination']
        }
      ]
    });
    
    res.json({
      success: true,
      data: bookings.map(b => b.toJSON())
    });
    
  } catch (error) {
    logger.error('Get bookings error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching bookings'
      }
    });
  }
};

/**
 * Get single booking
 * GET /api/bookings/:bookingId
 */
exports.getBooking = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { bookingId } = req.params;
    
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        user_id: userId
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          attributes: ['trip_id', 'title', 'destination']
        }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: booking.toJSON()
    });
    
  } catch (error) {
    logger.error('Get booking error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the booking'
      }
    });
  }
};

/**
 * Update booking
 * PUT /api/bookings/:bookingId
 */
exports.updateBooking = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { bookingId } = req.params;
    const { status, bookingReference, notes } = req.body;
    
    // Find booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        user_id: userId
      }
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    // Validate status if provided
    if (status && !isValidBookingStatus(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
        }
      });
    }
    
    // Update fields
    if (status) booking.status = status;
    if (bookingReference) booking.booking_reference = bookingReference;
    if (notes !== undefined) booking.notes = notes;
    
    await booking.save();
    
    logger.info('Booking updated', {
      bookingId: booking.booking_id,
      userId,
      updates: { status, bookingReference, notes }
    });
    
    res.json({
      success: true,
      data: booking.toJSON()
    });
    
  } catch (error) {
    logger.error('Update booking error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating the booking'
      }
    });
  }
};

/**
 * Delete booking
 * DELETE /api/bookings/:bookingId
 */
exports.deleteBooking = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { bookingId } = req.params;
    
    // Find booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        user_id: userId
      }
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }
    
    // Delete booking
    await booking.destroy();
    
    logger.info('Booking deleted', {
      bookingId,
      userId
    });
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete booking error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting the booking'
      }
    });
  }
};

/**
 * Create flight booking record
 * POST /api/bookings/flight
 */
exports.createFlightBooking = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      flightId, airline, flightNumber,
      departureAirport, arrivalAirport,
      departureCity, arrivalCity,
      departureDate, arrivalDate,
      passengers, cabinClass,
      totalPrice, currency,
      bookingUrl, tripId, notes
    } = req.body;

    if (!departureAirport || !arrivalAirport || !departureDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'departureAirport, arrivalAirport, and departureDate are required' }
      });
    }

    const booking = await Booking.create({
      user_id: userId,
      trip_id: tripId || null,
      booking_type: 'flight',
      provider: 'Booking.com',
      booking_url: bookingUrl || null,
      status: 'pending',
      total_price: totalPrice || null,
      currency: currency || 'USD',
      flight_id: flightId || null,
      airline: airline || null,
      flight_number: flightNumber || null,
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
      departure_city: departureCity || null,
      arrival_city: arrivalCity || null,
      departure_date: departureDate,
      arrival_date: arrivalDate || null,
      passengers: passengers || 1,
      cabin_class: cabinClass?.toLowerCase() || 'economy',
      notes: notes || null
    });

    logger.info('Flight booking created', { bookingId: booking.booking_id, userId });

    res.status(201).json({ success: true, data: booking.toJSON() });
  } catch (error) {
    logger.error('Create flight booking error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create flight booking' } });
  }
};

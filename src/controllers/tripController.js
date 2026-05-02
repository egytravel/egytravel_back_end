const { Trip, TripDay, Booking } = require('../models/sql');
const logger = require('../utils/logger');

/**
 * POST /api/trips
 * Create a new trip
 */
exports.createTrip = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, description, destination, startDate, endDate, budget } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Trip title is required' }
      });
    }

    const trip = await Trip.create({
      user_id: userId,
      title,
      description: description || null,
      destination: destination || null,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budget || null,
      status: 'planning'
    });

    logger.info('Trip created', { tripId: trip.trip_id, userId });

    res.status(201).json({ success: true, data: trip.toJSON() });
  } catch (error) {
    logger.error('Create trip error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create trip' } });
  }
};

/**
 * GET /api/trips
 * Get all trips for the authenticated user
 */
exports.getTrips = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { status } = req.query;

    const where = { user_id: userId };
    if (status) where.status = status;

    const trips = await Trip.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: TripDay, as: 'days', attributes: ['day_id', 'day_number', 'date', 'title'], order: [['day_number', 'ASC']] },
        { model: Booking, as: 'bookings', attributes: ['booking_id', 'booking_type', 'status', 'hotel_name', 'airline'] }
      ]
    });

    res.json({ success: true, count: trips.length, data: trips.map(t => t.toJSON()) });
  } catch (error) {
    logger.error('Get trips error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trips' } });
  }
};

/**
 * GET /api/trips/:tripId
 * Get single trip with all bookings
 */
exports.getTrip = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      where: { trip_id: tripId, user_id: userId },
      include: [
        { model: TripDay, as: 'days', order: [['day_number', 'ASC']] },
        { model: Booking, as: 'bookings' }
      ]
    });

    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    res.json({ success: true, data: trip.toJSON() });
  } catch (error) {
    logger.error('Get trip error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trip' } });
  }
};

/**
 * PUT /api/trips/:tripId
 * Update a trip
 */
exports.updateTrip = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;
    const { title, description, destination, startDate, endDate, budget, status } = req.body;

    const trip = await Trip.findOne({ where: { trip_id: tripId, user_id: userId } });

    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const validStatuses = ['planning', 'confirmed', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } });
    }

    if (title) trip.title = title;
    if (description !== undefined) trip.description = description;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.start_date = startDate;
    if (endDate !== undefined) trip.end_date = endDate;
    if (budget !== undefined) trip.budget = budget;
    if (status) trip.status = status;

    await trip.save();

    res.json({ success: true, data: trip.toJSON() });
  } catch (error) {
    logger.error('Update trip error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update trip' } });
  }
};

/**
 * DELETE /api/trips/:tripId
 * Delete a trip
 */
exports.deleteTrip = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;

    const trip = await Trip.findOne({ where: { trip_id: tripId, user_id: userId } });

    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    await trip.destroy();

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    logger.error('Delete trip error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete trip' } });
  }
};

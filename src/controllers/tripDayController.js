const { Trip, TripDay, Booking } = require('../models/sql');
const logger = require('../utils/logger');

/**
 * Helper — verify trip belongs to user
 */
async function findUserTrip(tripId, userId) {
  return Trip.findOne({ where: { trip_id: tripId, user_id: userId } });
}

/**
 * POST /api/trips/:tripId/days
 * Add a day to a trip
 */
exports.addDay = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;
    const { dayNumber, date, title, description, activities, locations, budget, notes } = req.body;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    if (!dayNumber) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'dayNumber is required' } });
    }

    // Check for duplicate day number
    const existing = await TripDay.findOne({ where: { trip_id: tripId, day_number: dayNumber } });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DAY_ALREADY_EXISTS', message: `Day ${dayNumber} already exists for this trip` } });
    }

    const day = await TripDay.create({
      trip_id: tripId,
      day_number: dayNumber,
      date: date || null,
      title: title || `Day ${dayNumber}`,
      description: description || null,
      activities: activities || [],
      locations: locations || [],
      budget: budget || null,
      notes: notes || null
    });

    logger.info('Trip day added', { dayId: day.day_id, tripId, userId });
    res.status(201).json({ success: true, data: day.toJSON() });
  } catch (error) {
    logger.error('Add trip day error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add day' } });
  }
};

/**
 * GET /api/trips/:tripId/days
 * Get all days for a trip (ordered by day_number)
 */
exports.getDays = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const days = await TripDay.findAll({
      where: { trip_id: tripId },
      order: [['day_number', 'ASC']]
    });

    res.json({ success: true, count: days.length, data: days.map(d => d.toJSON()) });
  } catch (error) {
    logger.error('Get trip days error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch days' } });
  }
};

/**
 * GET /api/trips/:tripId/days/:dayId
 * Get a single day with its linked bookings
 */
exports.getDay = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId, dayId } = req.params;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const day = await TripDay.findOne({ where: { day_id: dayId, trip_id: tripId } });
    if (!day) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Day not found' } });
    }

    // Get bookings linked to this trip that match this day's date (if date is set)
    let linkedBookings = [];
    if (day.date) {
      linkedBookings = await Booking.findAll({
        where: { trip_id: tripId },
        attributes: ['booking_id', 'booking_type', 'status', 'hotel_name', 'check_in_date', 'airline', 'departure_date', 'booking_url']
      });
      // Filter to bookings relevant to this day
      linkedBookings = linkedBookings
        .map(b => b.get({ plain: true }))
        .filter(b => {
          if (b.booking_type === 'hotel') return b.check_in_date === day.date;
          if (b.booking_type === 'flight') return b.departure_date?.startsWith(day.date);
          return false;
        });
    }

    res.json({ success: true, data: { ...day.toJSON(), linkedBookings } });
  } catch (error) {
    logger.error('Get trip day error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch day' } });
  }
};

/**
 * PUT /api/trips/:tripId/days/:dayId
 * Update a day (activities, locations, notes, etc.)
 */
exports.updateDay = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId, dayId } = req.params;
    const { date, title, description, activities, locations, budget, notes } = req.body;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const day = await TripDay.findOne({ where: { day_id: dayId, trip_id: tripId } });
    if (!day) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Day not found' } });
    }

    if (date !== undefined)        day.date        = date;
    if (title !== undefined)       day.title       = title;
    if (description !== undefined) day.description = description;
    if (activities !== undefined)  day.activities  = activities;
    if (locations !== undefined)   day.locations   = locations;
    if (budget !== undefined)      day.budget      = budget;
    if (notes !== undefined)       day.notes       = notes;

    await day.save();

    logger.info('Trip day updated', { dayId, tripId, userId });
    res.json({ success: true, data: day.toJSON() });
  } catch (error) {
    logger.error('Update trip day error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update day' } });
  }
};

/**
 * GET /api/trips/:tripId/map
 * Returns all locations across all days as map markers
 * Used to show the full trip route on a map
 */
exports.getTripMapMarkers = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId } = req.params;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const days = await TripDay.findAll({
      where: { trip_id: tripId },
      order: [['day_number', 'ASC']]
    });

    // Flatten all locations from all days into a single markers array
    const markers = [];
    for (const day of days) {
      const locations = day.locations || [];
      for (const loc of locations) {
        if (loc.lat && loc.lng) {
          markers.push({
            dayNumber: day.day_number,
            dayTitle: day.title,
            date: day.date,
            name: loc.name,
            lat: loc.lat,
            lng: loc.lng
          });
        }
      }
    }

    // Compute a suggested map center based on all markers
    let mapCenter = null;
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
      mapCenter = { lat: avgLat, lng: avgLng };
    }

    res.json({
      success: true,
      tripId: parseInt(tripId),
      totalMarkers: markers.length,
      mapCenter,
      markers
    });
  } catch (error) {
    logger.error('Get trip map markers error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get trip map data' } });
  }
};
exports.deleteDay = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tripId, dayId } = req.params;

    const trip = await findUserTrip(tripId, userId);
    if (!trip) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    }

    const day = await TripDay.findOne({ where: { day_id: dayId, trip_id: tripId } });
    if (!day) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Day not found' } });
    }

    await day.destroy();

    logger.info('Trip day deleted', { dayId, tripId, userId });
    res.json({ success: true, message: 'Day deleted successfully' });
  } catch (error) {
    logger.error('Delete trip day error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete day' } });
  }
};

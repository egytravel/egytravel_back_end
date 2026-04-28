const { Event, User } = require('../models/sql');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * GET /api/events
 * Get all published events (public)
 * ?category=festival&city=Cairo&upcoming=true&featured=true&page=1&limit=10
 */
exports.getEvents = async (req, res) => {
  try {
    const { category, city, upcoming, featured, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { is_published: true };

    if (category) where.category = category;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (featured === 'true') where.is_featured = true;
    if (upcoming === 'true') where.start_date = { [Op.gte]: new Date() };

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['user_id', 'name'] }],
      order: [['start_date', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
      data: rows.map(formatEvent)
    });
  } catch (error) {
    logger.error('Get events error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load events' } });
  }
};

/**
 * GET /api/events/:eventId
 * Get single event (public)
 */
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { event_id: req.params.eventId, is_published: true },
      include: [{ model: User, as: 'creator', attributes: ['user_id', 'name'] }]
    });

    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    res.json({ success: true, data: formatEvent(event) });
  } catch (error) {
    logger.error('Get event error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load event' } });
  }
};

/**
 * POST /api/events
 * Create event — ADMIN ONLY
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, shortDescription, category, location, city,
      lat, lng, startDate, endDate, images, coverImage,
      ticketUrl, price, isFree, isFeatured, tags
    } = req.body;

    if (!title || !description || !location || !startDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'title, description, location, and startDate are required' }
      });
    }

    const event = await Event.create({
      created_by: req.user.user_id,
      title,
      description,
      short_description: shortDescription || null,
      category: category || 'other',
      location,
      city: city || null,
      lat: lat || null,
      lng: lng || null,
      start_date: startDate,
      end_date: endDate || null,
      images: images || [],
      cover_image: coverImage || null,
      ticket_url: ticketUrl || null,
      price: price || null,
      is_free: isFree || false,
      is_featured: isFeatured || false,
      is_published: true,
      tags: tags || null
    });

    logger.info('Event created', { eventId: event.event_id, adminId: req.user.user_id });
    res.status(201).json({ success: true, data: formatEvent(event) });
  } catch (error) {
    logger.error('Create event error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' } });
  }
};

/**
 * PUT /api/events/:eventId
 * Update event — ADMIN ONLY
 */
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    const fields = [
      'title', 'description', 'short_description', 'category', 'location', 'city',
      'lat', 'lng', 'start_date', 'end_date', 'images', 'cover_image',
      'ticket_url', 'price', 'is_free', 'is_featured', 'is_published', 'tags'
    ];

    const bodyMap = {
      title: 'title', description: 'description', shortDescription: 'short_description',
      category: 'category', location: 'location', city: 'city',
      lat: 'lat', lng: 'lng', startDate: 'start_date', endDate: 'end_date',
      images: 'images', coverImage: 'cover_image', ticketUrl: 'ticket_url',
      price: 'price', isFree: 'is_free', isFeatured: 'is_featured',
      isPublished: 'is_published', tags: 'tags'
    };

    Object.entries(bodyMap).forEach(([bodyKey, dbKey]) => {
      if (req.body[bodyKey] !== undefined) event[dbKey] = req.body[bodyKey];
    });

    await event.save();
    res.json({ success: true, data: formatEvent(event) });
  } catch (error) {
    logger.error('Update event error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update event' } });
  }
};

/**
 * DELETE /api/events/:eventId
 * Delete event — ADMIN ONLY
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    await event.destroy();
    logger.info('Event deleted', { eventId: req.params.eventId, adminId: req.user.user_id });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Delete event error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete event' } });
  }
};

// ─── Formatter ───────────────────────────────────────────────────────────────
function formatEvent(event) {
  const e = event.toJSON ? event.toJSON() : event;
  return {
    eventId: e.event_id,
    title: e.title,
    description: e.description,
    shortDescription: e.short_description,
    category: e.category,
    location: e.location,
    city: e.city,
    lat: e.lat ? parseFloat(e.lat) : null,
    lng: e.lng ? parseFloat(e.lng) : null,
    startDate: e.start_date,
    endDate: e.end_date,
    images: e.images || [],
    coverImage: e.cover_image,
    ticketUrl: e.ticket_url,
    price: e.price,
    isFree: e.is_free,
    isFeatured: e.is_featured,
    tags: e.tags,
    createdBy: e.creator ? { id: e.creator.user_id, name: e.creator.name } : null,
    createdAt: e.created_at
  };
}

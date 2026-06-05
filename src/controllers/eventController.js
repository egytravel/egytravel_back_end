const { Event, User } = require('../models/sql');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { uploadImage } = require('../services/uploadService');

// Helper — upload files to Cloudinary if present, otherwise use URL strings from body
async function resolveImages(req) {
  if (req.files && req.files.length > 0) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw Object.assign(new Error('Image upload service not configured'), { code: 'UPLOAD_NOT_CONFIGURED', status: 503 });
    }
    return Promise.all(
      req.files.map(file => uploadImage(file.buffer, { folder: 'egytravel/events' }))
    );
  }
  if (req.body.images) {
    return Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }
  return null; // no images provided — keep existing or leave empty
}

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
 * Supports multipart/form-data with images[] files OR JSON body with image URLs
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, shortDescription, category, location, city,
      lat, lng, startDate, endDate, coverImage,
      ticketUrl, price, isFree, isFeatured, tags
    } = req.body;

    if (!title || !description || !location || !startDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'title, description, location, and startDate are required' }
      });
    }

    // Resolve images — files uploaded via multipart OR URLs in JSON body
    let imageUrls = [];
    try {
      imageUrls = (await resolveImages(req)) || [];
    } catch (uploadErr) {
      return res.status(uploadErr.status || 503).json({
        success: false,
        error: { code: uploadErr.code || 'UPLOAD_FAILED', message: uploadErr.message }
      });
    }

    // First image becomes cover if not explicitly provided
    const resolvedCover = coverImage || (imageUrls.length > 0 ? imageUrls[0] : null);

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
      images: imageUrls,
      cover_image: resolvedCover,
      ticket_url: ticketUrl || null,
      price: price || null,
      is_free: isFree || false,
      is_featured: isFeatured || false,
      is_published: true,
      tags: tags || null
    });

    logger.info('Event created', { eventId: event.event_id, adminId: req.user.user_id, imageCount: imageUrls.length });
    res.status(201).json({ success: true, data: formatEvent(event) });
  } catch (error) {
    logger.error('Create event error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' } });
  }
};

/**
 * PUT /api/events/:eventId
 * Update event — ADMIN ONLY
 * Supports multipart/form-data with images[] files OR JSON body with image URLs
 */
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    // Resolve new images if provided
    let newImages = null;
    try {
      newImages = await resolveImages(req);
    } catch (uploadErr) {
      return res.status(uploadErr.status || 503).json({
        success: false,
        error: { code: uploadErr.code || 'UPLOAD_FAILED', message: uploadErr.message }
      });
    }

    const bodyMap = {
      title: 'title', description: 'description', shortDescription: 'short_description',
      category: 'category', location: 'location', city: 'city',
      lat: 'lat', lng: 'lng', startDate: 'start_date', endDate: 'end_date',
      coverImage: 'cover_image', ticketUrl: 'ticket_url',
      price: 'price', isFree: 'is_free', isFeatured: 'is_featured',
      isPublished: 'is_published', tags: 'tags'
    };

    Object.entries(bodyMap).forEach(([bodyKey, dbKey]) => {
      if (req.body[bodyKey] !== undefined) event[dbKey] = req.body[bodyKey];
    });

    // Apply new images if provided (replaces existing)
    if (newImages !== null) {
      event.images = newImages;
      // Auto-set cover to first image if not explicitly provided
      if (!req.body.coverImage && newImages.length > 0) {
        event.cover_image = newImages[0];
      }
    }

    await event.save();
    logger.info('Event updated', { eventId: event.event_id, adminId: req.user.user_id, newImageCount: newImages?.length });
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

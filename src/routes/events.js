const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/events — get all published events
// ?category=festival&city=Cairo&upcoming=true&featured=true&page=1&limit=10
router.get('/', eventController.getEvents);

// GET /api/events/:eventId — get single event
router.get('/:eventId', eventController.getEvent);

// ─── Admin only routes ────────────────────────────────────────────────────────

// POST /api/events — create event (admin only)
router.post('/', authenticateToken, requireAdmin, eventController.createEvent);

// PUT /api/events/:eventId — update event (admin only)
router.put('/:eventId', authenticateToken, requireAdmin, eventController.updateEvent);

// DELETE /api/events/:eventId — delete event (admin only)
router.delete('/:eventId', authenticateToken, requireAdmin, eventController.deleteEvent);

module.exports = router;

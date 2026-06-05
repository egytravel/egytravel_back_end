const express = require('express');
const router = express.Router();
const multer = require('multer');
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

// Multer for event image uploads (stored in memory, then pushed to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, up to 10 images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/events — get all published events
// ?category=festival&city=Cairo&upcoming=true&featured=true&page=1&limit=10
router.get('/', eventController.getEvents);

// GET /api/events/:eventId — get single event
router.get('/:eventId', eventController.getEvent);

// ─── Admin only routes ────────────────────────────────────────────────────────

// POST /api/events — create event (admin only)
// Supports multipart/form-data with images[] files OR JSON with image URLs
router.post('/', authenticateToken, requireAdmin, upload.array('images', 10), eventController.createEvent);

// PUT /api/events/:eventId — update event (admin only)
// Supports multipart/form-data with images[] files OR JSON with image URLs
router.put('/:eventId', authenticateToken, requireAdmin, upload.array('images', 10), eventController.updateEvent);

// DELETE /api/events/:eventId — delete event (admin only)
router.delete('/:eventId', authenticateToken, requireAdmin, eventController.deleteEvent);

module.exports = router;

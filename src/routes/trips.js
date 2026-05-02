const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripDayController = require('../controllers/tripDayController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// ─── Trip CRUD ────────────────────────────────────────────────────────────────
router.post('/', tripController.createTrip);
router.get('/', tripController.getTrips);
router.get('/:tripId', tripController.getTrip);
router.put('/:tripId', tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

// ─── Trip Days ────────────────────────────────────────────────────────────────
router.post('/:tripId/days', tripDayController.addDay);
router.get('/:tripId/days', tripDayController.getDays);
router.get('/:tripId/days/:dayId', tripDayController.getDay);
router.put('/:tripId/days/:dayId', tripDayController.updateDay);
router.delete('/:tripId/days/:dayId', tripDayController.deleteDay);

// ─── Trip Map ─────────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/map — all locations across all days as map markers
router.get('/:tripId/map', tripDayController.getTripMapMarkers);

module.exports = router;

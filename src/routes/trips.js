const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// POST   /api/trips          — create trip
router.post('/', tripController.createTrip);

// GET    /api/trips          — get all user trips (?status=planning)
router.get('/', tripController.ge
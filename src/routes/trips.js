const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', tripController.createTrip);
router.get('/', tripController.getTrips);
router.get('/:tripId', tripController.getTrip);
router.put('/:tripId', tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

module.exports = router;

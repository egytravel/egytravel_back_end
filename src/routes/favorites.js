const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/favorites — get all favorites (filter by ?type=hotel|place|restaurant|etc)
router.get('/', favoriteController.getFavorites);

// GET /api/favorites/check?itemId=123&itemType=hotel — check if item is favorited
router.get('/check', favoriteController.checkFavorite);

// POST /api/favorites — generic add any item type to favorites
router.post('/', favoriteController.addToFavorites);

// POST /api/favorites/hotel — legacy hotel-specific endpoint (kept for compatibility)
router.post('/hotel', favoriteController.addHotelToFavorites);

// DELETE /api/favorites/:favoriteId — remove from favorites
router.delete('/:favoriteId', favoriteController.removeFavorite);

module.exports = router;

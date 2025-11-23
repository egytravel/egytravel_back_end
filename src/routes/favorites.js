const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// All favorite routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/favorites/hotel
 * @desc    Add hotel to favorites
 * @access  Private (authenticated users)
 * @body    hotelId, hotelName, location, imageUrl, priceData, description, notes, tags
 */
router.post('/hotel', favoriteController.addHotelToFavorites);

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorites
 * @access  Private (authenticated users)
 * @query   type
 */
router.get('/', favoriteController.getFavorites);

/**
 * @route   DELETE /api/favorites/:favoriteId
 * @desc    Remove from favorites
 * @access  Private (authenticated users)
 * @params  favoriteId
 */
router.delete('/:favoriteId', favoriteController.removeFavorite);

module.exports = router;

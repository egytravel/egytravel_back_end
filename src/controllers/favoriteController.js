const { Favorite } = require('../models/sql');
const { isValidItemType } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Add hotel to favorites
 * POST /api/favorites/hotel
 */
exports.addHotelToFavorites = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      hotelId,
      hotelName,
      location,
      imageUrl,
      priceData,
      description,
      notes,
      tags
    } = req.body;
    
    // Validate required fields
    if (!hotelId || !hotelName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_PARAMS',
          message: 'Hotel ID and name are required'
        }
      });
    }
    
    // Check if already favorited
    const existing = await Favorite.findOne({
      where: {
        user_id: userId,
        item_type: 'hotel',
        item_id: hotelId
      }
    });
    
    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FAVORITE_ALREADY_EXISTS',
          message: 'Hotel is already in favorites'
        }
      });
    }
    
    // Create favorite
    const favorite = await Favorite.create({
      user_id: userId,
      item_type: 'hotel',
      item_id: hotelId,
      item_name: hotelName,
      item_description: description || null,
      item_image_url: imageUrl || null,
      item_location: location || null,
      item_data: priceData || null,
      notes: notes || null,
      tags: tags || null
    });
    
    logger.info('Hotel added to favorites', {
      favoriteId: favorite.favorite_id,
      userId,
      hotelId
    });
    
    res.status(201).json({
      success: true,
      data: favorite.toJSON()
    });
    
  } catch (error) {
    logger.error('Add to favorites error', { error: error.message });
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FAVORITE_ALREADY_EXISTS',
          message: 'Hotel is already in favorites'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while adding to favorites'
      }
    });
  }
};

/**
 * Get user's favorites
 * GET /api/favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { type } = req.query;
    
    // Build query conditions
    const where = { user_id: userId };
    
    if (type && isValidItemType(type)) {
      where.item_type = type;
    }
    
    // Fetch favorites
    const favorites = await Favorite.findAll({
      where,
      order: [['saved_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: favorites.map(f => f.toJSON())
    });
    
  } catch (error) {
    logger.error('Get favorites error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching favorites'
      }
    });
  }
};

/**
 * Remove from favorites
 * DELETE /api/favorites/:favoriteId
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { favoriteId } = req.params;
    
    // Find favorite
    const favorite = await Favorite.findOne({
      where: {
        favorite_id: favoriteId,
        user_id: userId
      }
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FAVORITE_NOT_FOUND',
          message: 'Favorite not found'
        }
      });
    }
    
    // Delete favorite
    await favorite.destroy();
    
    logger.info('Favorite removed', {
      favoriteId,
      userId
    });
    
    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });
    
  } catch (error) {
    logger.error('Remove favorite error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while removing favorite'
      }
    });
  }
};

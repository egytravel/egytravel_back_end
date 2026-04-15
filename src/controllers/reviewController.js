const { Review, User } = require('../models/sql');
const { getReviewsForDestination } = require('../services/googlePlacesService');
const { destinations } = require('../data/destinations');
const { places, restaurants, curatedHotels } = require('../data/exploreData');
const logger = require('../utils/logger');

/**
 * GET /api/reviews/:placeId
 * Returns combined Google reviews + app reviews for a place
 */
exports.getReviews = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { type = 'destination' } = req.query;

    // Find place info for Google lookup
    let placeInfo = null;
    if (type === 'destination') {
      placeInfo = destinations.find(d => d.id === placeId);
    } else if (type === 'place') {
      placeInfo = places.find(p => p.id === placeId);
    } else if (type === 'restaurant') {
      placeInfo = restaurants.find(r => r.id === placeId);
    } else if (type === 'hotel') {
      placeInfo = curatedHotels.find(h => h.id === placeId);
    }

    // Fetch app reviews from DB
    const appReviews = await Review.findAll({
      where: { place_id: placeId, place_type: type },
      include: [{ model: User, as: 'user', attributes: ['user_id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    const formattedAppReviews = appReviews.map(r => ({
      id: `app_${r.review_id}`,
      source: 'egytravel',
      authorName: r.user?.name || 'Anonymous',
      authorAvatar: null,
      rating: parseFloat(r.rating),
      title: r.title,
      text: r.comment,
      images: r.images || [],
      visitDate: r.visit_date,
      likesCount: r.likes_count,
      timestamp: r.created_at
    }));

    // Calculate app rating stats
    const appRating = appReviews.length > 0
      ? appReviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / appReviews.length
      : null;

    // Fetch Google reviews if place info available
    let googleData = null;
    if (placeInfo && process.env.GOOGLE_PLACES_API_KEY) {
      googleData = await getReviewsForDestination(
        placeId,
        placeInfo.name || placeInfo.title,
        placeInfo.lat,
        placeInfo.lng
      );
    }

    res.json({
      success: true,
      data: {
        placeId,
        google: googleData ? {
          rating: googleData.rating,
          totalRatings: googleData.totalRatings,
          reviews: googleData.reviews
        } : null,
        app: {
          rating: appRating ? Math.round(appRating * 10) / 10 : null,
          totalReviews: appReviews.length,
          reviews: formattedAppReviews
        }
      }
    });
  } catch (error) {
    logger.error('Get reviews error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load reviews' } });
  }
};

/**
 * POST /api/reviews/:placeId
 * Write a review (authenticated users only)
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { placeId } = req.params;
    const { rating, comment, title, visitDate, type = 'destination' } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Rating and comment are required' }
      });
    }

    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' }
      });
    }

    // Check if user already reviewed this place
    const existing = await Review.findOne({
      where: { user_id: userId, place_id: placeId, place_type: type }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'REVIEW_EXISTS', message: 'You have already reviewed this place' }
      });
    }

    const review = await Review.create({
      user_id: userId,
      place_id: placeId,
      place_type: type,
      rating: ratingNum,
      title: title || null,
      comment,
      visit_date: visitDate || null
    });

    logger.info('Review created', { reviewId: review.review_id, userId, placeId });

    res.status(201).json({
      success: true,
      data: {
        id: `app_${review.review_id}`,
        source: 'egytravel',
        rating: parseFloat(review.rating),
        title: review.title,
        text: review.comment,
        visitDate: review.visit_date,
        timestamp: review.created_at
      }
    });
  } catch (error) {
    logger.error('Create review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' } });
  }
};

/**
 * PUT /api/reviews/:reviewId
 * Update own review
 */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { reviewId } = req.params;
    const { rating, comment, title, visitDate } = req.body;

    const review = await Review.findOne({ where: { review_id: reviewId, user_id: userId } });

    if (!review) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } });
    }

    if (rating) review.rating = parseFloat(rating);
    if (comment) review.comment = comment;
    if (title !== undefined) review.title = title;
    if (visitDate !== undefined) review.visit_date = visitDate;

    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    logger.error('Update review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update review' } });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Delete own review
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { reviewId } = req.params;

    const review = await Review.findOne({ where: { review_id: reviewId, user_id: userId } });

    if (!review) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } });
    }

    await review.destroy();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review' } });
  }
};

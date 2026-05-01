const Review = require('../models/nosql/Review');
const { getReviewsForDestination } = require('../services/googlePlacesService');
const { destinations } = require('../data/destinations');
const { places, restaurants, curatedHotels } = require('../data/exploreData');
const logger = require('../utils/logger');

/**
 * GET /api/reviews/:placeId?type=destination|place|restaurant|hotel
 */
exports.getReviews = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { type = 'destination' } = req.query;

    // Find place info for Google lookup
    let placeInfo = null;
    if (type === 'destination') placeInfo = destinations.find(d => d.id === placeId);
    else if (type === 'place') placeInfo = places.find(p => p.id === placeId);
    else if (type === 'restaurant') placeInfo = restaurants.find(r => r.id === placeId);
    else if (type === 'hotel') placeInfo = curatedHotels.find(h => h.id === placeId);

    // Fetch app reviews from MongoDB
    const appReviews = await Review.find({ placeId, placeType: type }).sort({ createdAt: -1 }).limit(50).lean();

    const appRating = appReviews.length > 0
      ? appReviews.reduce((sum, r) => sum + r.rating, 0) / appReviews.length
      : null;

    const formattedAppReviews = appReviews.map(r => ({
      id: r._id,
      source: 'egytravel',
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      text: r.comment,
      images: r.images || [],
      visitDate: r.visitDate,
      likesCount: r.likesCount,
      timestamp: r.createdAt
    }));

    // Fetch Google reviews
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
 */
exports.createReview = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { rating, comment, title, visitDate, type = 'destination' } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Rating and comment are required' } });
    }

    const ratingNum = parseFloat(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Rating must be between 1 and 5' } });
    }

    const review = await Review.create({
      userId: req.user.user_id,
      authorName: req.user.name,
      placeId,
      placeType: type,
      rating: ratingNum,
      title: title || null,
      comment,
      visitDate: visitDate || null
    });

    logger.info('Review created', { reviewId: review._id, userId: req.user.user_id, placeId });

    res.status(201).json({
      success: true,
      data: {
        id: review._id,
        source: 'egytravel',
        rating: review.rating,
        title: review.title,
        text: review.comment,
        visitDate: review.visitDate,
        timestamp: review.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: { code: 'REVIEW_EXISTS', message: 'You have already reviewed this place' } });
    }
    logger.error('Create review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create review' } });
  }
};

/**
 * PUT /api/reviews/:reviewId
 */
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user.user_id });
    if (!review) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } });
    }

    if (req.body.rating) review.rating = parseFloat(req.body.rating);
    if (req.body.comment) review.comment = req.body.comment;
    if (req.body.title !== undefined) review.title = req.body.title;
    if (req.body.visitDate !== undefined) review.visitDate = req.body.visitDate;

    await review.save();
    res.json({ success: true, data: review });
  } catch (error) {
    logger.error('Update review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update review' } });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, userId: req.user.user_id });
    if (!review) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found' } });
    }
    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete review' } });
  }
};

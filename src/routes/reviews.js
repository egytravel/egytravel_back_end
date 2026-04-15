const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/reviews/:placeId?type=destination|place|restaurant|hotel
// Public — anyone can read reviews
router.get('/:placeId', reviewController.getReviews);

// POST /api/reviews/:placeId — write a review (auth required)
router.post('/:placeId', authenticateToken, reviewController.createReview);

// PUT /api/reviews/:reviewId — update own review (auth required)
router.put('/:reviewId', authenticateToken, reviewController.updateReview);

// DELETE /api/reviews/:reviewId — delete own review (auth required)
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);

module.exports = router;

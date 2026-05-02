const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

// GET /api/community/feed?page=1&limit=10&placeId=pyramids-of-giza
router.get('/feed', communityController.getFeed);

// GET /api/community/posts/:postId
router.get('/posts/:postId', communityController.getPost);

// GET /api/community/users/:userId/posts
router.get('/users/:userId/posts', communityController.getUserPosts);

// POST /api/community/posts — create post (auth required)
router.post('/posts', authenticateToken, postLimiter, communityController.createPost);

// DELETE /api/community/posts/:postId — delete own post OR admin can delete any post
router.delete('/posts/:postId', authenticateToken, communityController.deletePost);

// POST /api/community/posts/:postId/like — toggle like
router.post('/posts/:postId/like', authenticateToken, communityController.toggleLike);

// POST /api/community/posts/:postId/comments — add comment
router.post('/posts/:postId/comments', authenticateToken, communityController.addComment);

// DELETE /api/community/posts/:postId/comments/:commentId — delete comment
router.delete('/posts/:postId/comments/:commentId', authenticateToken, communityController.deleteComment);

module.exports = router;

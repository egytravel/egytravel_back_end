const express = require('express');
const router = express.Router();
const multer = require('multer');
const communityController = require('../controllers/communityController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});

// Multer for optional file uploads on post creation (images stored in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// GET /api/community/feed?page=1&limit=10&placeId=pyramids-of-giza
router.get('/feed', optionalAuth, communityController.getFeed);

// GET /api/community/posts/:postId
router.get('/posts/:postId', optionalAuth, communityController.getPost);

// GET /api/community/users/:userId/posts
router.get('/users/:userId/posts', optionalAuth, communityController.getUserPosts);

// POST /api/community/posts — create post (auth required)
// Supports both:
//   - multipart/form-data with images[] files (auto-uploads to Cloudinary)
//   - JSON with images[] URLs (already uploaded)
router.post('/posts', authenticateToken, postLimiter, upload.array('images', 5), communityController.createPost);

// DELETE /api/community/posts/:postId — delete own post OR admin can delete any post
router.delete('/posts/:postId', authenticateToken, communityController.deletePost);

// POST /api/community/posts/:postId/like — toggle like
router.post('/posts/:postId/like', authenticateToken, communityController.toggleLike);

// POST /api/community/posts/:postId/comments — add comment
router.post('/posts/:postId/comments', authenticateToken, communityController.addComment);

// GET /api/community/posts/:postId/comments — get all comments (paginated)
router.get('/posts/:postId/comments', communityController.getComments);

// DELETE /api/community/posts/:postId/comments/:commentId — delete comment
router.delete('/posts/:postId/comments/:commentId', authenticateToken, communityController.deleteComment);

module.exports = router;

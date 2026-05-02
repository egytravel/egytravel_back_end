const Post = require('../models/nosql/Post');
const logger = require('../utils/logger');

/**
 * GET /api/community/feed
 */
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { placeId } = req.query;

    const filter = placeId ? { placeId } : {};

    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: posts.map(formatPost),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Get feed error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load feed' } });
  }
};

/**
 * POST /api/community/posts
 */
exports.createPost = async (req, res) => {
  try {
    const { caption, images, placeId, placeName, placeType, rating, visitDate } = req.body;

    if (!caption?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Caption is required' } });
    }

    const post = await Post.create({
      userId: req.user.user_id,
      authorName: req.user.name,
      caption: caption.trim(),
      images: images || [],
      placeId: placeId || null,
      placeName: placeName || null,
      placeType: placeType || null,
      rating: rating ? parseFloat(rating) : null,
      visitDate: visitDate || null
    });

    logger.info('Post created', { postId: post._id, userId: req.user.user_id });
    res.status(201).json({ success: true, data: formatPost(post.toObject()) });
  } catch (error) {
    logger.error('Create post error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create post' } });
  }
};

// Helper to validate MongoDB ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * GET /api/community/posts/:postId
 */
exports.getPost = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.postId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_POST_ID', message: 'Invalid post ID. Use the postId from the feed response.' } });
    }
    const post = await Post.findById(req.params.postId).lean();
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }
    res.json({ success: true, data: formatPost(post) });
  } catch (error) {
    logger.error('Get post error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load post' } });
  }
};

/**
 * DELETE /api/community/posts/:postId
 * Users can delete their own posts. Admins can delete any post.
 */
exports.deletePost = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.postId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_POST_ID', message: 'Invalid post ID. Use the postId from the feed response.' } });
    }
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin
      ? { _id: req.params.postId }
      : { _id: req.params.postId, userId: req.user.user_id };

    const post = await Post.findOne(query);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }
    await post.deleteOne();
    logger.info('Post deleted', { postId: req.params.postId, deletedBy: req.user.user_id, isAdmin });
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Delete post error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } });
  }
};

/**
 * POST /api/community/posts/:postId/like — toggle like
 */
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.user_id;
    if (!isValidObjectId(req.params.postId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_POST_ID', message: 'Invalid post ID. Use the postId from the feed response.' } });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const alreadyLiked = post.likedBy.includes(userId);
    if (alreadyLiked) {
      post.likedBy.pull(userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(userId);
      post.likesCount += 1;
    }
    await post.save();

    res.json({ success: true, liked: !alreadyLiked, likesCount: post.likesCount });
  } catch (error) {
    logger.error('Toggle like error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle like' } });
  }
};

/**
 * POST /api/community/posts/:postId/comments
 */
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Comment is required' } });
    }

    // Validate MongoDB ObjectId format
    if (!req.params.postId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_POST_ID', message: 'Invalid post ID format. Use the postId from the feed response.' } });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const newComment = {
      userId: req.user.user_id,
      authorName: req.user.name,
      comment: comment.trim()
    };

    post.comments.push(newComment);
    post.commentsCount += 1;
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];
    res.status(201).json({
      success: true,
      data: {
        commentId: addedComment._id,
        author: { id: addedComment.userId, name: addedComment.authorName },
        comment: addedComment.comment,
        createdAt: addedComment.createdAt
      }
    });
  } catch (error) {
    logger.error('Add comment error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add comment' } });
  }
};

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 * Users can delete their own comments. Admins can delete any comment.
 */
exports.deleteComment = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } });
    }

    if (!isAdmin && comment.userId !== req.user.user_id) {
      return res.status(403).json({ success: false, error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You can only delete your own comments' } });
    }

    comment.deleteOne();
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await post.save();

    logger.info('Comment deleted', { commentId: req.params.commentId, deletedBy: req.user.user_id, isAdmin });
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Delete comment error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete comment' } });
  }
};

/**
 * GET /api/community/posts/:postId/comments?page=1&limit=20
 * Get all comments for a post with pagination
 */
exports.getComments = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.postId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_POST_ID', message: 'Invalid post ID. Use the postId from the feed response.' } });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const post = await Post.findById(req.params.postId).lean();
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const allComments = post.comments || [];
    const total = allComments.length;
    const offset = (page - 1) * limit;
    const pageComments = allComments.slice(offset, offset + limit);

    res.json({
      success: true,
      postId: req.params.postId,
      pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: offset + limit < total },
      data: pageComments.map(c => ({
        commentId: c._id,
        author: { id: c.userId, name: c.authorName },
        comment: c.comment,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    logger.error('Get comments error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get comments' } });
  }
};
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ userId: parseInt(req.params.userId) }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments({ userId: parseInt(req.params.userId) })
    ]);

    res.json({
      success: true,
      data: posts.map(formatPost),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Get user posts error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load posts' } });
  }
};

// ─── Formatter ───────────────────────────────────────────────────────────────
function formatPost(post) {
  return {
    postId: post._id,
    author: { id: post.userId, name: post.authorName },
    caption: post.caption,
    images: post.images || [],
    place: post.placeId ? { id: post.placeId, name: post.placeName, type: post.placeType } : null,
    rating: post.rating || null,
    visitDate: post.visitDate,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    recentComments: (post.comments || []).slice(-5).map(c => ({
      commentId: c._id,
      author: { id: c.userId, name: c.authorName },
      comment: c.comment,
      createdAt: c.createdAt
    })),
    createdAt: post.createdAt
  };
}

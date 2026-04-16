const { Post, PostLike, PostComment, User } = require('../models/sql');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const POST_INCLUDE = [
  { model: User, as: 'author', attributes: ['user_id', 'name'] },
  { model: PostComment, as: 'comments',
    limit: 3, order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'author', attributes: ['user_id', 'name'] }]
  }
];

function formatPost(post, currentUserId = null) {
  const p = post.toJSON ? post.toJSON() : post;
  return {
    postId: p.post_id,
    author: { id: p.author?.user_id, name: p.author?.name },
    caption: p.caption,
    images: p.images || [],
    place: p.place_id ? { id: p.place_id, name: p.place_name, type: p.place_type } : null,
    rating: p.rating ? parseFloat(p.rating) : null,
    visitDate: p.visit_date,
    likesCount: p.likes_count,
    commentsCount: p.comments_count,
    recentComments: (p.comments || []).map(c => ({
      commentId: c.comment_id,
      author: { id: c.author?.user_id, name: c.author?.name },
      comment: c.comment,
      createdAt: c.created_at
    })),
    createdAt: p.created_at
  };
}

/**
 * GET /api/community/feed
 * Get community feed (all posts, newest first)
 */
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { placeId } = req.query;

    const where = placeId ? { place_id: placeId } : {};

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: POST_INCLUDE,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows.map(p => formatPost(p)),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('Get feed error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load feed' } });
  }
};

/**
 * POST /api/community/posts
 * Create a new post
 */
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { caption, images, placeId, placeName, placeType, rating, visitDate } = req.body;

    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Caption is required' }
      });
    }

    const post = await Post.create({
      user_id: userId,
      caption: caption.trim(),
      images: images || [],
      place_id: placeId || null,
      place_name: placeName || null,
      place_type: placeType || null,
      rating: rating ? parseFloat(rating) : null,
      visit_date: visitDate || null
    });

    const fullPost = await Post.findByPk(post.post_id, { include: POST_INCLUDE });

    logger.info('Post created', { postId: post.post_id, userId });
    res.status(201).json({ success: true, data: formatPost(fullPost) });
  } catch (error) {
    logger.error('Create post error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create post' } });
  }
};

/**
 * GET /api/community/posts/:postId
 * Get single post with all comments
 */
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByPk(postId, {
      include: [
        { model: User, as: 'author', attributes: ['user_id', 'name'] },
        {
          model: PostComment, as: 'comments',
          order: [['created_at', 'ASC']],
          include: [{ model: User, as: 'author', attributes: ['user_id', 'name'] }]
        }
      ]
    });

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
 * Delete own post
 */
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const post = await Post.findOne({ where: { post_id: postId, user_id: userId } });
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    await post.destroy();
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Delete post error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete post' } });
  }
};

/**
 * POST /api/community/posts/:postId/like
 * Like or unlike a post (toggle)
 */
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const existing = await PostLike.findOne({ where: { post_id: postId, user_id: userId } });

    if (existing) {
      await existing.destroy();
      await post.decrement('likes_count');
      res.json({ success: true, liked: false, likesCount: post.likes_count - 1 });
    } else {
      await PostLike.create({ post_id: postId, user_id: userId });
      await post.increment('likes_count');
      res.json({ success: true, liked: true, likesCount: post.likes_count + 1 });
    }
  } catch (error) {
    logger.error('Toggle like error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle like' } });
  }
};

/**
 * POST /api/community/posts/:postId/comments
 * Add a comment to a post
 */
exports.addComment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REQUIRED_PARAMS', message: 'Comment text is required' }
      });
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    }

    const newComment = await PostComment.create({
      post_id: postId,
      user_id: userId,
      comment: comment.trim()
    });

    await post.increment('comments_count');

    const fullComment = await PostComment.findByPk(newComment.comment_id, {
      include: [{ model: User, as: 'author', attributes: ['user_id', 'name'] }]
    });

    res.status(201).json({
      success: true,
      data: {
        commentId: fullComment.comment_id,
        author: { id: fullComment.author?.user_id, name: fullComment.author?.name },
        comment: fullComment.comment,
        createdAt: fullComment.created_at
      }
    });
  } catch (error) {
    logger.error('Add comment error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add comment' } });
  }
};

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 * Delete own comment
 */
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { postId, commentId } = req.params;

    const comment = await PostComment.findOne({
      where: { comment_id: commentId, post_id: postId, user_id: userId }
    });

    if (!comment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } });
    }

    await comment.destroy();

    const post = await Post.findByPk(postId);
    if (post && post.comments_count > 0) await post.decrement('comments_count');

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    logger.error('Delete comment error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete comment' } });
  }
};

/**
 * GET /api/community/users/:userId/posts
 * Get all posts by a specific user
 */
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      where: { user_id: userId },
      include: POST_INCLUDE,
      order: [['created_at', 'DESC']],
      limit, offset, distinct: true
    });

    res.json({
      success: true,
      data: rows.map(p => formatPost(p)),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('Get user posts error', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load posts' } });
  }
};

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../services/uploadService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Store files in memory (buffer) — we stream directly to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5                     // max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/upload/image
 * Upload a single image — returns Cloudinary URL
 * Auth required
 */
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image file provided. Send as multipart/form-data with field name "image"' }
      });
    }

    const url = await uploadImage(req.file.buffer, {
      folder: 'egytravel/community'
    });

    logger.info('Image uploaded', { userId: req.user.user_id, url });

    res.json({
      success: true,
      data: { url }
    });
  } catch (error) {
    logger.error('Image upload error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload image' }
    });
  }
});

/**
 * POST /api/upload/images
 * Upload multiple images (max 5) — returns array of Cloudinary URLs
 * Auth required
 */
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No image files provided. Send as multipart/form-data with field name "images"' }
      });
    }

    const urls = await Promise.all(
      req.files.map(file => uploadImage(file.buffer, { folder: 'egytravel/community' }))
    );

    logger.info('Images uploaded', { userId: req.user.user_id, count: urls.length });

    res.json({
      success: true,
      data: { urls, count: urls.length }
    });
  } catch (error) {
    logger.error('Images upload error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload images' }
    });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'Image must be under 10MB' }
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: { code: 'TOO_MANY_FILES', message: 'Maximum 5 images allowed' }
    });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'Only image files (jpg, png, gif, webp) are allowed' }
    });
  }
  next(err);
});

module.exports = router;

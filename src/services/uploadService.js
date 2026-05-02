const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Upload options
 * @returns {Promise<string>} Secure URL of uploaded image
 */
async function uploadImage(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'egytravel/community',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // max 1200x1200
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', { error: error.message });
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload multiple images
 * @param {Buffer[]} buffers - Array of file buffers
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<string[]>} Array of secure URLs
 */
async function uploadImages(buffers, folder = 'egytravel/community') {
  return Promise.all(buffers.map(buf => uploadImage(buf, { folder })));
}

/**
 * Delete an image from Cloudinary by URL
 * @param {string} url - Cloudinary secure URL
 */
async function deleteImage(url) {
  try {
    // Extract public_id from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts.slice(-3, -1).join('/');
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.warn('Cloudinary delete failed', { url, error: error.message });
  }
}

module.exports = { uploadImage, uploadImages, deleteImage };

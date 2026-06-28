/**
 * Cloudinary service — uploads images and returns public URLs.
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { config, getCloudinaryMissingKeys } = require('../config/env');

function ensureConfigured() {
  const missing = getCloudinaryMissingKeys();
  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary environment variables: ${missing.join(', ')}`);
  }

  // Re-apply config each time so .env changes work after server restart
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Upload a local file path to Cloudinary.
 * @param {string} filePath - Path on disk (from multer)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadImageFromPath(filePath) {
  ensureConfigured();

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'linkedin-ai-automation',
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } finally {
    // Remove temporary local file after upload
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  uploadImageFromPath,
};

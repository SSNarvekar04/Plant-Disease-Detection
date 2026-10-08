/**
 * Cloudinary service -- image storage abstraction.
 *
 * Two modes, chosen automatically:
 *   1. Cloudinary configured  -> images uploaded to the cloud, only the URL is
 *                                 stored in MongoDB (never the file itself).
 *   2. Cloudinary not configured -> images written to `backend/uploads` and
 *                                 served by Express. Convenient for local
 *                                 development without a Cloudinary account.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');

const config = require('../config/env');
const { ApiError } = require('../utils/helpers');

const isCloudinaryEnabled = () => config.cloudinary.enabled;

if (isCloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

/** Makes sure the local fallback directory exists. */
function ensureLocalDir() {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
}

/** Cloudinary transformation: crop to a square, cap width, optimise format. */
const cloudinaryTransformations = [
  { width: 1024, height: 1024, crop: 'limit' },
  { quality: 'auto', fetch_format: 'auto' },
];

/**
 * Uploads a single in-memory image buffer.
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file Multer file
 * @returns {Promise<{ url: string, publicId: string, provider: 'cloudinary'|'local' }>}
 */
function uploadImage(file) {
  if (!file || !file.buffer) {
    throw ApiError.badRequest('No image was received');
  }

  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(file);
  }
  return saveToLocalDisk(file);
}

/** Uploads the buffer to Cloudinary and returns a secure URL. */
function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.cloudinary.folder,
        resource_type: 'image',
        transformation: cloudinaryTransformations,
        public_id: `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload failed:', error.message);
          return reject(new ApiError(502, 'Image upload to Cloudinary failed. Please try again'));
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: 'cloudinary',
        });
      }
    );

    stream.end(file.buffer);
  });
}

/** Writes the buffer into `backend/uploads` and returns the public URL path. */
async function saveToLocalDisk(file) {
  ensureLocalDir();

  const extension = (path.extname(file.originalname || '')).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const targetPath = path.join(config.uploadDir, filename);

  await fs.promises.writeFile(targetPath, file.buffer);

  return {
    // Relative path -- the caller prefixes the host when it builds the URL.
    url: `/uploads/${filename}`,
    publicId: filename,
    provider: 'local',
  };
}

/**
 * Removes a previously uploaded image. Safe to call for both providers.
 * @param {string} publicId Cloudinary public id, or local filename
 * @param {'cloudinary'|'local'} provider
 */
async function deleteImage(publicId, provider = 'cloudinary') {
  if (!publicId) return false;

  if (provider === 'local' || publicId.startsWith('/uploads/')) {
    const filename = path.basename(publicId);
    const targetPath = path.join(config.uploadDir, filename);
    try {
      await fs.promises.unlink(targetPath);
      return true;
    } catch {
      return false; // file already gone -- nothing to do
    }
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('⚠️  Could not delete Cloudinary asset:', error.message);
    return false;
  }
}

/** Removes a local file given a full `/uploads/xxx.jpg` URL. */
async function deleteImageByUrl(url) {
  if (!url || !url.startsWith('/uploads/')) return false;
  return deleteImage(url, 'local');
}

/** Health information used by the admin dashboard / status endpoint. */
function getStorageStatus() {
  return {
    provider: isCloudinaryEnabled() ? 'cloudinary' : 'local',
    configured: isCloudinaryEnabled(),
    localDir: config.uploadDir,
  };
}

module.exports = {
  uploadImage,
  deleteImage,
  deleteImageByUrl,
  getStorageStatus,
  isCloudinaryEnabled,
};

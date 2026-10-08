/**
 * Image upload middleware (Multer).
 *
 * Files are kept in memory (not on disk) because they are immediately streamed
 * to Cloudinary -- or written to `backend/uploads` when Cloudinary is not
 * configured. Only one file named `image` is accepted per request.
 */

const multer = require('multer');
const config = require('../config/env');
const { ApiError } = require('../utils/helpers');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/** Multer storage engine: buffer the file in RAM. */
const storage = multer.memoryStorage();

/** Rejects files whose magic bytes / mime type are not a real JPG or PNG. */
function fileFilter(_req, file, cb) {
  const extension = (require('path').extname(file.originalname || '')).toLowerCase();
  const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());
  const hasAllowedExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!hasAllowedMime || !hasAllowedExtension) {
    return cb(ApiError.badRequest('Only JPG, JPEG or PNG images are allowed'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes, // enforced per config.maxFileSizeBytes
    files: 1,
  },
});

/**
 * Verifies the image magic bytes after Multer has buffered it.
 * This catches renamed files (e.g. a script called `photo.png`).
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
function validateImageBuffer(req, _res, next) {
  if (!req.file) {
    return next(ApiError.badRequest('Please attach a plant leaf image under the "image" field'));
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length === 0) {
    return next(ApiError.badRequest('The uploaded image is empty'));
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

  if (!isJpeg && !isPng) {
    return next(ApiError.badRequest('File content is not a valid PNG or JPEG image'));
  }

  return next();
}

module.exports = { upload, validateImageBuffer, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS };

/**
 * Centralised error handling.
 *
 * Any error thrown in a controller ends up here. The middleware converts it
 * into a consistent JSON envelope:
 *   { success: false, message: "...", errors: [{ field, message }] }
 *
 * Stack traces are only included outside production.
 */

const multer = require('multer');
const config = require('../config/env');
const { ApiError } = require('../utils/helpers');

/** 404 handler for unmatched routes. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Translates common library errors into user friendly ApiErrors. */
function normaliseError(error) {
  // --- Mongoose validation -----------------------------------------------
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return ApiError.badRequest('Validation failed', errors);
  }

  // --- Duplicate key ------------------------------------------------------
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with that ${field} already exists`);
  }

  // --- Bad ObjectId -------------------------------------------------------
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return ApiError.badRequest(`Invalid ${error.path} identifier`);
  }

  // --- Multer -------------------------------------------------------------
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ApiError.payloadTooLarge(`Image is too large. Maximum allowed size is ${config.maxFileSizeBytes / (1024 * 1024)} MB`);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiError.badRequest('Unexpected file field. Upload the image using the "image" field');
    }
    return ApiError.badRequest(`Image upload failed: ${error.message}`);
  }

  // --- MongoDB connectivity ----------------------------------------------
  if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
    return new ApiError(503, 'Database is currently unavailable. Please try again shortly');
  }

  // --- Already an ApiError ------------------------------------------------
  if (error instanceof ApiError) return error;

  // --- Anything else ------------------------------------------------------
  const wrapped = new ApiError(error.statusCode || 500, error.message || 'Internal server error');
  wrapped.originalError = error;
  return wrapped;
}

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
function errorHandler(error, req, res, _next) {
  const apiError = normaliseError(error);

  // Log server-side faults with their stack trace.
  if (apiError.statusCode >= 500) {
    console.error(`❌ ${req.method} ${req.originalUrl} ->`, error);
  }

  const body = {
    success: false,
    message: apiError.message,
    statusCode: apiError.statusCode,
  };

  if (apiError.errors && apiError.errors.length) body.errors = apiError.errors;
  if (!config.isProduction && error.stack) body.stack = error.stack;

  res.status(apiError.statusCode).json(body);
}

module.exports = { notFound, errorHandler, normaliseError };

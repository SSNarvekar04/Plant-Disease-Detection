/**
 * Shared helpers: async route wrapping, API errors and pagination metadata.
 */

/**
 * Wraps an async controller so rejected promises reach the Express error
 * handler instead of hanging the request. Always use it for async handlers.
 * @param {(req, res, next) => Promise<unknown>} handler
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/**
 * Error with an HTTP status code. Throw it anywhere and the error middleware
 * turns it into a clean JSON response.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {Array<{field: string, message: string}>} [errors]
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }

  static badRequest(message = 'Invalid request', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'You are not authorised to perform this action') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Admin access is required') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static payloadTooLarge(message = 'Uploaded file is too large') {
    return new ApiError(413, message);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(503, message);
  }
}

/** Pagination defaults shared by list endpoints. */
const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 12, MAX_LIMIT: 100 };

/** Normalises `?page=&limit=` query values into safe numbers. */
function getPagination(query = {}) {
  const rawLimit = Number.parseInt(query.limit, 10);
  const rawPage = Number.parseInt(query.page, 10);

  const limit = Math.min(
    Number.isNaN(rawLimit) ? PAGINATION.DEFAULT_LIMIT : Math.max(1, rawLimit),
    PAGINATION.MAX_LIMIT
  );
  const page = Number.isNaN(rawPage) || rawPage < 1 ? PAGINATION.DEFAULT_PAGE : rawPage;

  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the pagination block that every list endpoint returns. */
function buildPaginationMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/** Absolute URL helper for locally stored uploads. */
function buildLocalUploadUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

/**
 * Exposes `id` on lean (`.lean()`) documents.
 *
 * Mongoose applies the `toJSON` transform to real documents, which is what
 * renames `_id` to `id`. Lean results bypass that transform, so list endpoints
 * run them through this helper. Every document then looks the same to the API
 * client whether it came from `.lean()` or from a document instance.
 *
 * @param {object|object[]|null} doc
 */
function withId(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(withId);
  if (typeof doc.toJSON === 'function') return doc;
  // Documents that already expose `id` (e.g. the output of `toPublicUser`)
  // must keep it, so `_id` is only mapped when it is actually present.
  if (doc._id === undefined) return doc;

  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}

module.exports = {
  asyncHandler,
  ApiError,
  PAGINATION,
  getPagination,
  buildPaginationMeta,
  buildLocalUploadUrl,
  withId,
};

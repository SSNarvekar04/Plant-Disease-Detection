/**
 * JWT authentication + role based authorisation middleware.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/helpers');

/**
 * Signs a JWT for the given user document.
 * @param {{ _id: import('mongoose').Types.ObjectId, role: string }} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Extracts the bearer token from the request.
 * Supports the `Authorization: Bearer <token>` header.
 */
function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Verifies the JWT and attaches the live user document to `req.user`.
 *
 * The user is re-read from MongoDB (instead of trusting the token payload) so a
 * deleted or deactivated account loses access immediately.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    throw ApiError.unauthorized('Not authorised, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError' ? 'Your session has expired, please log in again' : 'Invalid token';
    throw ApiError.unauthorized(message);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('The user for this token no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  return next();
});

/**
 * Allows the request through only when the logged in user has one of the
 * given roles. Must always run after `protect`.
 * @param {...('user'|'admin')} allowedRoles
 */
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Not authorised'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { generateToken, protect, authorize };

/**
 * Auth controller: register, login, logout and "who am I".
 *
 * Business rules live here; routes only forward requests to these functions.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { generateToken } = require('../middleware/authMiddleware');
const { ApiError, asyncHandler } = require('../utils/helpers');
const { validateRegister, validateLogin } = require('../utils/validators');

/** Shape returned to the frontend (never includes the password hash). */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 * Creates a normal `user` account. The role can never be self-assigned,
 * which is how privilege escalation through the public form is prevented.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  const errors = validateRegister({ name, email, password, confirmPassword });
  if (errors.length) throw ApiError.badRequest('Please correct the highlighted fields', errors);

  const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists. Please log in instead');
  }

  const user = await User.create({ name, email, password, role: 'user' });

  res.status(201).json({
    success: true,
    message: 'Registration successful. You can now log in.',
    data: { user: toPublicUser(user) },
  });
});

/**
 * POST /api/auth/login
 * Verifies credentials and returns a signed JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const errors = validateLogin({ email, password });
  if (errors.length) throw ApiError.badRequest('Please enter a valid email and password', errors);

  // `+password` because the field is `select: false`.
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  // Same message for "no such user" and "wrong password" so the endpoint does
  // not reveal which email addresses are registered.
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Please contact the administrator');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    data: { user: toPublicUser(user), token, expiresIn: config.jwtExpiresIn },
  });
});

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logging out is done on the client (token is dropped).
 * This endpoint exists so the frontend has a single place to call, and it
 * simply confirms success.
 */
const logout = asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully', data: null });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (used on page reload).
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
});

/**
 * POST /api/auth/verify-token
 * Small helper the frontend can use to validate a stored token.
 */
const verifyToken = asyncHandler(async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  let decoded = null;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    decoded = null;
  }
  res.json({ success: true, data: { valid: Boolean(decoded), payload: decoded } });
});

module.exports = { register, login, logout, getCurrentUser, verifyToken, toPublicUser };

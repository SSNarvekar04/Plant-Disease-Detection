/**
 * Authentication routes.
 * Public endpoints (register / login) are rate limited to slow down brute force.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const controller = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { ApiError } = require('../utils/helpers');

const router = express.Router();

/** 20 attempts per 15 minutes per IP. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
});

// Public
router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/logout', controller.logout);
router.post('/verify-token', controller.verifyToken);

// Protected
router.get('/me', protect, controller.getCurrentUser);

/** GET /api/auth/role-check?role=admin -- used by the AdminRoute guard. */
router.get('/role-check', protect, (req, res, next) => {
  const requiredRole = req.query.role;
  if (requiredRole && req.user.role !== requiredRole) {
    return next(ApiError.forbidden('You do not have access to this area'));
  }
  return res.json({ success: true, data: { role: req.user.role } });
});

module.exports = router;

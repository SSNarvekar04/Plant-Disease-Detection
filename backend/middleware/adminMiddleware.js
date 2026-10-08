/**
 * Admin-only authorisation middleware.
 *
 * Thin wrapper around `authMiddleware.authorize('admin')` so routes read
 * clearly: `router.get('/', protect, adminOnly, listUsers)`.
 */

const { protect, authorize } = require('./authMiddleware');

/** Spread into a route: `router.post('/', ...adminOnly, handler)`. */
const adminOnly = [protect, authorize('admin')];

module.exports = { adminOnly };

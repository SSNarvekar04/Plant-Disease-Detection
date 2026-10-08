/**
 * Admin routes.
 *
 * Every route is mounted behind `adminOnly` (= `protect` + `authorize('admin')`),
 * so a normal user calling any of these endpoints receives a 403.
 *
 *   GET    /api/admin/statistics        dashboard counters + charts
 *   GET    /api/admin/users             list users (?search=&role=&page=&limit=)
 *   POST   /api/admin/users             create a user
 *   GET    /api/admin/users/:id         single user
 *   PUT    /api/admin/users/:id         change role / activation
 *   DELETE /api/admin/users/:id         delete user + their predictions
 *   GET    /api/admin/predictions       all predictions (?user=&status=&plant=&search=)
 *   DELETE /api/admin/predictions/:id   delete one prediction record
 *   GET    /api/admin/ml-health         liveness check of the Python ML service
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const controller = require('../controllers/adminController');
const mlService = require('../services/mlService');
const { adminOnly } = require('../middleware/adminMiddleware');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

/** Wider bucket for admin endpoints so a big table can be paged through. */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(adminLimiter, ...adminOnly);

// --- Dashboard ------------------------------------------------------------
router.get('/statistics', controller.getStatistics);

/** Tells the admin panel whether the real ML model is reachable. */
router.get(
  '/ml-health',
  asyncHandler(async (_req, res) => {
    const health = await mlService.checkHealth();
    res.json({
      success: true,
      data: {
        ...health,
        note: health.reachable
          ? 'Connected to the TensorFlow prediction service'
          : 'The ML service is not reachable. Predictions currently use the mock classifier.',
      },
    });
  })
);

// --- Users ----------------------------------------------------------------
router.get('/users', controller.listUsers);
router.post('/users', controller.createUser);
router.get('/users/:id', controller.getUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// --- Predictions ----------------------------------------------------------
router.get('/predictions', controller.listPredictions);
router.delete('/predictions/:id', controller.deletePrediction);

module.exports = router;
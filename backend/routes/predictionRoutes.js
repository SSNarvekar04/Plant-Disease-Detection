/**
 * Prediction routes.
 *
 *   POST   /api/predictions          create a prediction (saves to history)
 *   GET    /api/predictions/my       the signed-in user's history
 *   GET    /api/predictions/stats/my dashboard aggregate
 *   POST   /api/predict              analyse only, nothing is saved
 *   GET    /api/predictions/:id      single record
 *   DELETE /api/predictions/:id      remove a record
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const controller = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');
const { upload, validateImageBuffer } = require('../middleware/uploadMiddleware');
const { createInFlightGuard } = require('../utils/inFlightGuard');

const router = express.Router();

/** 15 scans per minute per user -- protects the ML service from abuse. */
const predictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    message: 'Too many prediction requests. Please wait a moment and try again.',
  },
});

/**
 * Blocks a second concurrent prediction from the same user (spec 20:
 * "Do not allow multiple prediction requests simultaneously").
 * The guard releases automatically when the response finishes.
 */
const singleFlight = createInFlightGuard();

router.post(
  '/',
  protect,
  predictLimiter,
  singleFlight,
  upload.single('image'),
  validateImageBuffer,
  controller.createPrediction
);

router.get('/my', protect, controller.getMyPredictions);
router.get('/stats/my', protect, controller.getMyStats);

router.get('/:id', protect, controller.getPredictionById);
router.delete('/:id', protect, controller.deletePrediction);

/** Standalone analysis endpoint (no history write). */
const predictRouter = express.Router();
predictRouter.post(
  '/',
  protect,
  predictLimiter,
  singleFlight,
  upload.single('image'),
  validateImageBuffer,
  controller.predictOnly
);

module.exports = { predictionRoutes: router, predictRouter };

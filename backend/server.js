/**
 * Express application entry point.
 *
 * Everything below is wiring: configuration, middleware, routes, error handling
 * and graceful shutdown. All business logic lives in controllers/services.
 *
 * Start with:  npm run dev
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const config = require('./config/env');
const { connectDB, registerConnectionEvents, disconnectDB } = require('./config/db');
const buildLogger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const cloudinaryService = require('./services/cloudinaryService');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { predictionRoutes, predictRouter } = require('./routes/predictionRoutes');

const app = express();

// Trust the first proxy in front of the app (needed for correct req.ip behind
// nginx / Render / Railway, and therefore for rate limiting).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// --- Global middleware ----------------------------------------------------
app.use(
  helmet({
    // Images are served from Cloudinary/local disk and rendered by a separate
    // dev server on another port, so the default same-origin policy is relaxed.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / curl requests (no Origin header).
      if (!origin) return callback(null, true);
      // In development, allow any local/LAN origin
      if (!config.isProduction || config.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// Parses JSON and urlencoded bodies with a sane size limit.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(buildLogger({ isProduction: config.isProduction }));

// --- Static uploads (local fallback when Cloudinary is not configured) ----
fs.mkdirSync(config.uploadDir, { recursive: true });
app.use(
  '/uploads',
  express.static(config.uploadDir, {
    maxAge: config.isProduction ? '7d' : 0,
    // Never let the browser run anything that was uploaded as an "image".
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
    },
  })
);

/**
 * Simple service status endpoint. Also used by the frontend to detect whether
 * the backend is alive before showing an error page.
 */
app.get('/api/health', async (_req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'Plant Disease API is running',
    data: {
      service: 'plant-disease-backend',
      environment: config.env,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      storage: cloudinaryService.getStorageStatus(),
      predictionProvider: 'plant.id',
      predictionServiceUrl: config.plantId.baseUrl,
      predictionServiceConfigured: config.plantId.enabled,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

/** Lightweight liveness probe (does not touch the database). */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Plant Disease Detection API',
    docs: '/api/health',
  });
});

// --- API routes -----------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/predict', predictRouter);
app.use('/api/admin', adminRoutes);

// --- Error handling -------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// --- Boot -----------------------------------------------------------------
async function start() {
  try {
    registerConnectionEvents();
    await connectDB();

    const server = app.listen(config.port, () => {
      const storage = cloudinaryService.getStorageStatus();
      console.log('');
      console.log('  🌿  Plant Disease Detection API');
      console.log(`      Environment : ${config.env}`);
      console.log(`      API         : http://localhost:${config.port}`);
      console.log(`      Health      : http://localhost:${config.port}/api/health`);
      console.log(`      Image store : ${storage.provider}`);
      console.log(`      AI provider : Plant.id (${config.plantId.baseUrl})`);
      console.log(`      API key     : ${config.plantId.enabled ? 'configured' : 'MISSING -- set PLANT_ID_API_KEY'}`);
      console.log('');
    });

    /** Closes the HTTP server and the database before exiting. */
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
      // Do not hang forever if a connection refuses to close.
      setTimeout(() => process.exit(1), 10000).unref();
    };

    ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));

    return server;
  } catch (error) {
    console.error('❌ Failed to start the server:', error.message);
    process.exit(1);
  }
}

// Only auto-start when the file is executed directly (tests can require it).
if (require.main === module) {
  start();
}

module.exports = { app, start };
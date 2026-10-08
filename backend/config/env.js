/**
 * Centralised environment configuration.
 *
 * Every module imports `config` instead of touching `process.env` directly, so
 * defaults and validation live in exactly one place.
 */

const path = require('path');

// Load .env from the backend root folder (one level above this file).
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/** Fails fast with a helpful message instead of crashing deep inside the code. */
function required(name, fallback) {
  const value = process.env[name];
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(
    `Missing required environment variable "${name}". Copy backend/.env.example to backend/.env and fill it in.`
  );
}

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,

  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/plant_disease'),

  jwtSecret: process.env.JWT_SECRET || 'insecure-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Comma separated list of allowed browser origins.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'plant-disease',
    get enabled() {
      return Boolean(this.cloudName && this.apiKey && this.apiSecret);
    },
  },

  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),

  // Max upload size in bytes (default 5 MB).
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024,

  ml: {
    serviceUrl: (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
    timeoutMs: Number(process.env.ML_TIMEOUT_MS) || 45000,
    allowMock: (process.env.ALLOW_MOCK_PREDICTION || 'true').toLowerCase() === 'true',
  },
};

// Warn loudly (but do not crash) when secrets are missing in production.
if (config.isProduction) {
  if (config.jwtSecret === 'insecure-dev-secret-change-me') {
    throw new Error('JWT_SECRET must be set to a strong secret value in production.');
  }
  if (!config.mongoUri) {
    throw new Error('MONGO_URI must be set in production.');
  }
}

module.exports = config;

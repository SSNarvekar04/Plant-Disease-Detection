/**
 * MongoDB connection manager.
 *
 * `connectDB()` is called once from server.js. Mongoose keeps a single
 * connection pool, so controllers can just use models without extra setup.
 */

const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

/**
 * Opens the connection to MongoDB.
 * @param {string} [uri] Optional override (mostly used by tests/scripts).
 * @returns {Promise<import('mongoose').Mongoose>}
 */
async function connectDB(uri = config.mongoUri) {
  if (mongoose.connection.readyState === 1) return mongoose;

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/** Closes the connection (used on shutdown and by seed scripts). */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
  }
}

/** Handles connection level events so failures are visible in the logs. */
function registerConnectionEvents() {
  const { connection } = mongoose;

  connection.on('error', (error) => {
    console.error('❌ MongoDB runtime error:', error.message);
  });

  connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
}

module.exports = { connectDB, disconnectDB, registerConnectionEvents };

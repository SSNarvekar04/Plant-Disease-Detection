/**
 * Database seed script.
 *
 * Inserts the demo data the project needs to run end-to-end:
 *   1. one admin account
 *   2. a few sample users
 *   3. the full disease knowledge base (data/diseaseCatalogue.js)
 *   4. a handful of demo predictions so the dashboard and history pages are
 *      not empty on first run
 *
 * Usage
 *   npm run seed          # create/refresh everything, keep existing data
 *   npm run seed:fresh    # wipe users, diseases and predictions first
 *   node seed.js --fresh --no-predictions
 *
 * Admin credentials
 *   Read from SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in
 *   backend/.env. Sensible development defaults are used when they are absent
 *   so a student can log in immediately; always change them for a real
 *   deployment.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Disease = require('./models/Disease');
const Prediction = require('./models/Prediction');
const diseaseCatalogue = require('./data/diseaseCatalogue');

// --- Options ---------------------------------------------------------------
const argv = process.argv.slice(2);
const isFresh = argv.includes('--fresh');
const skipPredictions = argv.includes('--no-predictions');
const skipUsers = argv.includes('--no-users');

// --- Demo credentials (overridable through .env) --------------------------
const ADMIN = {
  name: process.env.SEED_ADMIN_NAME || 'System Administrator',
  email: (process.env.SEED_ADMIN_EMAIL || 'admin@plantdisease.com').toLowerCase(),
  password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
};

const SAMPLE_USERS = [
  { name: 'Ravi Kumar', email: 'ravi@example.com', password: 'User@123', location: 'Nashik, Maharashtra' },
  { name: 'Priya Sharma', email: 'priya@example.com', password: 'User@123', location: 'Pune, Maharashtra' },
  { name: 'Amit Verma', email: 'amit@example.com', password: 'User@123', location: 'Ludhiana, Punjab' },
];

/**
 * Builds a lightweight SVG placeholder leaf so demo predictions have a real,
 * locally served image. Using generated files keeps the seed free of any
 * external dependency (no internet access required).
 */
function createPlaceholderSvg(label, accent) {
  const safeLabel = String(label).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <g fill="none" stroke="#f0fdf4" stroke-width="10" stroke-linecap="round">
    <path d="M300 520 C300 380 300 300 300 220"/>
    <path d="M300 300 C220 290 160 230 140 150 C230 160 285 210 300 300 Z" fill="#22c55e" fill-opacity="0.55"/>
    <path d="M300 380 C385 365 450 300 470 215 C375 230 315 285 300 380 Z" fill="#16a34a" fill-opacity="0.6"/>
    <path d="M300 220 C280 170 270 120 285 75 C330 105 335 170 300 220 Z" fill="#4ade80" fill-opacity="0.5"/>
  </g>
  <text x="300" y="575" font-family="Segoe UI, Arial, sans-serif" font-size="26"
        text-anchor="middle" fill="#f0fdf4">${safeLabel}</text>
</svg>`;
  return svg;
}

/** Writes one placeholder into backend/uploads and returns its public path. */
function storePlaceholder(label, accent) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const filename = `seed-${crypto.randomBytes(6).toString('hex')}.svg`;
  fs.writeFileSync(path.join(config.uploadDir, filename), createPlaceholderSvg(label, accent), 'utf8');
  return { filename, url: `/uploads/${filename}` };
}

// --- Seed steps ------------------------------------------------------------

/** Creates or updates the admin account. */
async function seedAdmin() {
  const existing = await User.findOne({ email: ADMIN.email });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    console.log(`  ✔ admin already present: ${ADMIN.email}`);
    return { user: existing, created: false };
  }

  const admin = await User.create({ ...ADMIN, role: 'admin' });
  console.log(`  ✔ admin created: ${admin.email}`);
  return { user: admin, created: true };
}

/** Creates the demo user accounts (skipped when they already exist). */
async function seedUsers() {
  if (skipUsers) return [];

  const created = [];
  for (const person of SAMPLE_USERS) {
    const email = person.email.toLowerCase();
    // eslint-disable-next-line no-await-in-loop -- sequential keeps the log readable
    const existing = await User.findOne({ email });
    if (existing) {
      created.push(existing);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({ ...person, email, role: 'user' });
    created.push(user);
  }

  console.log(`  ✔ ${created.length} sample user(s) ready`);
  return created;
}

/**
 * Upserts the disease knowledge base.
 * Documents are matched on (plantName + diseaseName) so re-running the seed
 * refreshes the remedy content without creating duplicates.
 */
async function seedDiseases() {
  let created = 0;
  let updated = 0;

  for (const entry of diseaseCatalogue) {
    // eslint-disable-next-line no-await-in-loop -- one query per record is fine at this size
    const existing = await Disease.findOne({
      plantName: entry.plantName,
      diseaseName: entry.diseaseName,
    });

    if (existing) {
      existing.set({ ...entry, isActive: true });
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
      updated += 1;
    } else {
      // eslint-disable-next-line no-await-in-loop
      await Disease.create(entry);
      created += 1;
    }
  }

  console.log(`  ✔ diseases: ${created} created, ${updated} updated`);
  return Disease.find({});
}

/**
 * Creates demo predictions spread over the last few days so the dashboards and
 * charts have something to render.
 */
async function seedPredictions(users, diseases) {
  if (skipPredictions || users.length === 0) return 0;

  const existingCount = await Prediction.countDocuments();
  if (existingCount > 0) {
    console.log(`  ✔ predictions already present (${existingCount})`);
    return 0;
  }

  // Only demo diseases with real symptoms are used, "healthy" records are added
  // separately below so the dashboard shows a realistic status mix.
  const sickDiseases = diseases.filter((disease) => !/healthy/i.test(disease.diseaseName));
  const healthyDiseases = diseases.filter((disease) => /healthy/i.test(disease.diseaseName));

  const statuses = ['detected', 'detected', 'detected', 'low_confidence', 'healthy'];

  let created = 0;
  for (let index = 0; index < 14; index += 1) {
    const user = users[index % users.length];
    const useHealthy = statuses[index % statuses.length] === 'healthy';
    const pool = useHealthy ? healthyDiseases : sickDiseases;
    const disease = pool[Math.floor(Math.random() * pool.length)];

    const status = useHealthy
      ? 'healthy'
      : statuses[index % statuses.length] === 'low_confidence'
        ? 'low_confidence'
        : 'detected';

    const confidence = status === 'low_confidence'
      ? Number((52 + Math.random() * 15).toFixed(1))
      : Number((78 + Math.random() * 19).toFixed(1));

    const stored = storePlaceholder(disease.plantName, status === 'healthy' ? '#16a34a' : '#b45309');

    // Spread the records over the last 6 days for a readable trend chart.
    const daysAgo = 6 - Math.floor(index / 3);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // eslint-disable-next-line no-await-in-loop
    await Prediction.create({
      user: user._id,
      imageUrl: stored.url,
      publicId: stored.filename,
      plantName: disease.plantName,
      diseaseName: disease.diseaseName,
      confidence,
      // Seed rows are sample history, not AI output -- label them honestly so
      // no fabricated record is ever presented as a Plant.id result.
      predictionSource: 'manual',
      predictionStatus: status,
      disease: disease._id,
      rawResult: { storageProvider: 'local', modelName: 'seed-demo-data' },
      notes: status === 'low_confidence'
        ? 'Prediction confidence is low. Please upload a clearer image in good lighting.'
        : '',
    });

    // Overwrite createdAt so the chart has a spread of dates (timestamps are
    // managed by mongoose and cannot be passed to create()).
    // eslint-disable-next-line no-await-in-loop
    await Prediction.updateOne({ user: user._id, publicId: stored.filename }, { $set: { createdAt } });

    created += 1;
  }

  console.log(`  ✔ ${created} demo prediction(s) created`);
  return created;
}

/** Removes placeholder files that this script generated earlier. */
function cleanSeedPlaceholders() {
  if (!fs.existsSync(config.uploadDir)) return;
  fs.readdirSync(config.uploadDir)
    .filter((file) => file.startsWith('seed-'))
    .forEach((file) => fs.rmSync(path.join(config.uploadDir, file), { force: true }));
}

/** Drops every document so the seed starts from a clean slate. */
async function wipeCollections() {
  await Promise.all([
    User.deleteMany({}),
    Disease.deleteMany({}),
    Prediction.deleteMany({}),
  ]);
  cleanSeedPlaceholders();
  console.log('  ✔ collections cleared (--fresh)');
}

// --- Runner ---------------------------------------------------------------
async function run() {
  console.log('\n🌱 Seeding the Plant Disease database\n');

  await connectDB();

  if (isFresh) await wipeCollections();

  console.log('Users');
  const { user: admin, created: adminCreated } = await seedAdmin();
  const users = await seedUsers();

  console.log('\nDiseases');
  const diseases = await seedDiseases();

  console.log('\nPredictions');
  await seedPredictions(users, diseases);

  const [userCount, diseaseCount, predictionCount] = await Promise.all([
    User.countDocuments(),
    Disease.countDocuments(),
    Prediction.countDocuments(),
  ]);

  console.log('\n──────────────────────────────────────────');
  console.log(`  Users       : ${userCount}`);
  console.log(`  Diseases    : ${diseaseCount}`);
  console.log(`  Predictions : ${predictionCount}`);
  console.log('');
  console.log('  Admin login');
  console.log(`    email    : ${ADMIN.email}`);
  console.log('    password : ' + (adminCreated ? ADMIN.password : '(unchanged, use the one you set earlier)'));
  console.log('──────────────────────────────────────────\n');

  await disconnectDB();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('\n❌ Seeding failed:', error.message);
    if (config.env !== 'production') console.error(error.stack);
    await disconnectDB();
    process.exit(1);
  });
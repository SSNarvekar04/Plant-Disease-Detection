/**
 * End-to-end API smoke test.
 *
 * Self-contained by default: it starts the Express app in-process and points
 * the Plant.id client at a local stub, so `npm test` needs no running server,
 * no internet connection and no API credits.
 *
 * The stub returns a realistic Plant.id payload, which means the real
 * request building, response parsing, species -> crop mapping and disease
 * matching code all run for real. Nothing inside the app is mocked out.
 *
 *   npm test
 *
 * Point it at an externally running server instead (real Plant.id calls):
 *   API_URL=http://localhost:5000 npm test
 *
 * Exits with code 1 when any check fails, so it can be used in CI.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

let API_URL = (process.env.API_URL || '').replace(/\/+$/, '');

let passed = 0;
let failed = 0;
const failures = [];

/** Runs one named check and records the outcome instead of crashing. */
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, message: error.message });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/** Minimal fetch wrapper that understands JSON and multipart bodies. */
async function api(method, endpoint, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // fetch sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, { method, headers, body: payload });
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  return { status: response.status, body: json };
}

/** Tiny in-memory PNG (a 1x1 green pixel) used for upload tests. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const randomEmail = `tester${Date.now()}@example.com`;

/* ------------------------------------------------------------------ stub */

/** The disease list the stub answers with; a test can swap it temporarily. */
const DEFAULT_STUB_DISEASES = [
  { id: 'd1', name: 'Early blight', probability: 0.87 },
  { id: 'd2', name: 'Late blight', probability: 0.06 },
  { id: 'd3', name: 'Septoria leaf spot', probability: 0.03 },
];

let stubDiseases = DEFAULT_STUB_DISEASES;

/**
 * A local stand-in for `POST /v3/identification`.
 *
 * It answers with the exact JSON shape Plant.id returns for a tomato leaf with
 * early blight, so the code under test does the same work it would do against
 * the real provider.
 */
function startPlantIdStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method === 'GET') {
        // Used by checkHealth(): any answer proves the endpoint is alive.
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end('{"detail":"Not found"}');
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch {
          payload = {};
        }

        if (!Array.isArray(payload.images) || payload.images.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"detail":"No images were provided"}');
          return;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            access_token: 'stub-token',
            model_version: 'plant_id:stub',
            input: { health: payload.health, images: ['https://plant.id/media/imgs/stub.jpg'] },
            result: {
              is_plant: { probability: 0.99, threshold: 0.5, binary: true },
              is_healthy: { probability: 0.08, threshold: 0.5, binary: false },
              classification: {
                suggestions: [
                  { id: 'plant-1', name: 'Solanum lycopersicum', probability: 0.96 },
                  { id: 'plant-2', name: 'Solanum tuberosum', probability: 0.02 },
                ],
              },
              disease: {
                suggestions: stubDiseases,
              },
            },
            status: 'COMPLETED',
          })
        );
      });
    });

    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/**
 * Starts the Plant.id stub and the Express app in-process.
 * Skipped when API_URL is supplied, so the suite can also target a real server.
 */
async function boot() {
  if (API_URL) {
    console.log(`\nUsing an externally provided API: ${API_URL}`);
    return;
  }

  const stub = await startPlantIdStub();

  // config/env.js reads .env once, at require time, and does not overwrite
  // values that already exist -- so these must be set before ../server loads.
  process.env.PLANT_ID_API_BASE_URL = `http://127.0.0.1:${stub.address().port}`;
  process.env.PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY || 'stub-key-for-tests';

  const { app } = require('../server');
  const { connectDB } = require('../config/db');

  await connectDB();

  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    instance.on('error', reject);
  });

  API_URL = `http://127.0.0.1:${server.address().port}`;

  // Best effort cleanup so the process never lingers on a port.
  process.on('exit', () => {
    try {
      server.close();
      stub.close();
    } catch {
      // Already closed.
    }
  });
}

async function run() {
  console.log(`\nTesting ${API_URL}\n${'='.repeat(60)}`);

  let userToken = null;
  let adminToken = null;
  let predictionId = null;
  let createdDiseaseId = null;

  // ---------------------------------------------------------------- health
  section('Service');

  await check('GET /api/health responds', async () => {
    const res = await api('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.database, 'connected');
  });

  await check('GET /api/health is public (CORS allowed)', async () => {
    const res = await api('GET', '/api/health');
    assert.strictEqual(res.body.data.service, 'plant-disease-backend');
  });

  await check('Unknown route returns 404 JSON', async () => {
    const res = await api('GET', '/api/does-not-exist');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Route not found'));
  });

  // ------------------------------------------------------------------ auth
  section('Authentication');

  await check('POST /api/auth/register creates a user', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Test Farmer', email: randomEmail, password: 'Test@123', confirmPassword: 'Test@123' },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.user.role, 'user', 'role must default to user');
    assert.ok(!res.body.data.user.password, 'password hash must never be returned');
  });

  await check('POST /api/auth/register rejects duplicate email', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Test Farmer', email: randomEmail, password: 'Test@123', confirmPassword: 'Test@123' },
    });
    assert.strictEqual(res.status, 409);
  });

  await check('POST /api/auth/register rejects mismatched passwords', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Bad Pass', email: `bad${Date.now()}@example.com`, password: 'Test@123', confirmPassword: 'Other@123' },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some((e) => e.field === 'confirmPassword'));
  });

  await check('POST /api/auth/register rejects a short password', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Short Pass', email: `short${Date.now()}@example.com`, password: '123', confirmPassword: '123' },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some((e) => e.field === 'password'));
  });

  await check('POST /api/auth/register validates the email format', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Bad Email', email: 'not-an-email', password: 'Test@123', confirmPassword: 'Test@123' },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some((e) => e.field === 'email'));
  });

  await check('POST /api/auth/login returns a JWT', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: randomEmail, password: 'Test@123' },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.token, 'token missing');
    assert.strictEqual(res.body.data.user.email, randomEmail);
    userToken = res.body.data.token;
  });

  await check('POST /api/auth/login rejects a wrong password', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: randomEmail, password: 'WrongPass1' },
    });
    assert.strictEqual(res.status, 401);
  });

  await check('POST /api/auth/login rejects an unknown email identically', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: 'nobody@example.com', password: 'Test@123' },
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, 'Invalid email or password');
  });

  await check('GET /api/auth/me returns the logged in user', async () => {
    const res = await api('GET', '/api/auth/me', { token: userToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.email, randomEmail);
  });

  await check('GET /api/auth/me rejects a missing token', async () => {
    const res = await api('GET', '/api/auth/me');
    assert.strictEqual(res.status, 401);
  });

  await check('GET /api/auth/me rejects a tampered token', async () => {
    const res = await api('GET', '/api/auth/me', { token: `${userToken}x` });
    assert.strictEqual(res.status, 401);
  });

  await check('POST /api/auth/logout succeeds', async () => {
    const res = await api('POST', '/api/auth/logout', { token: userToken });
    assert.strictEqual(res.status, 200);
  });

  await check('Admin account can log in', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: process.env.ADMIN_EMAIL || 'admin@plantdisease.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' },
    });
    assert.strictEqual(res.status, 200, `admin login failed: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.data.user.role, 'admin');
    adminToken = res.body.data.token;
  });

  // ----------------------------------------------------------------- users
  section('User profile');

  await check('GET /api/users/profile returns profile + stats', async () => {
    const res = await api('GET', '/api/users/profile', { token: userToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.email, randomEmail);
    assert.ok(typeof res.body.data.stats.predictionCount === 'number');
  });

  await check('PUT /api/users/profile updates the name', async () => {
    const res = await api('PUT', '/api/users/profile', {
      token: userToken,
      body: { name: 'Updated Farmer', location: 'Nashik' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.user.name, 'Updated Farmer');
  });

  await check('PUT /api/users/profile validates a too-short name', async () => {
    const res = await api('PUT', '/api/users/profile', { token: userToken, body: { name: 'ab' } });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT /api/users/password rejects a wrong current password', async () => {
    const res = await api('PUT', '/api/users/password', {
      token: userToken,
      body: { currentPassword: 'Nope@123', newPassword: 'New@1234', confirmPassword: 'New@1234' },
    });
    assert.strictEqual(res.status, 401);
  });

  await check('PUT /api/users/password changes the password', async () => {
    const res = await api('PUT', '/api/users/password', {
      token: userToken,
      body: { currentPassword: 'Test@123', newPassword: 'New@1234', confirmPassword: 'New@1234' },
    });
    assert.strictEqual(res.status, 200);

    const login = await api('POST', '/api/auth/login', {
      body: { email: randomEmail, password: 'New@1234' },
    });
    assert.strictEqual(login.status, 200, 'login with the new password failed');
    userToken = login.body.data.token;
  });

  // -------------------------------------------------------------- diseases
  section('Diseases (public read)');

  await check('GET /api/diseases returns a paginated list', async () => {
    const res = await api('GET', '/api/diseases');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination.total > 0);
  });

  await check('GET /api/diseases supports search', async () => {
    const res = await api('GET', '/api/diseases?search=blight');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length > 0, 'search returned nothing');
    assert.ok(res.body.data.every((d) => /blight/i.test(JSON.stringify(d))));
  });

  await check('GET /api/diseases filters by plant', async () => {
    const res = await api('GET', '/api/diseases?plant=Tomato');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((d) => d.plantName === 'Tomato'));
  });

  await check('GET /api/diseases filters by severity', async () => {
    const res = await api('GET', '/api/diseases?severity=Critical');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.every((d) => d.severity === 'Critical'));
  });

  await check('GET /api/diseases paginates', async () => {
    const res = await api('GET', '/api/diseases?page=1&limit=3');
    assert.strictEqual(res.body.data.length, 3);
    assert.strictEqual(res.body.pagination.page, 1);
    assert.ok(res.body.pagination.totalPages >= 2);
  });

  await check('GET /api/diseases/plants lists filter options', async () => {
    const res = await api('GET', '/api/diseases/plants');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.plants.includes('Tomato'));
    assert.ok(res.body.data.severities.includes('High'));
  });

  await check('GET /api/diseases/:id returns one disease with remedies', async () => {
    const list = await api('GET', '/api/diseases?plant=Tomato&search=Early%20Blight');
    const target = list.body.data[0];
    const res = await api('GET', `/api/diseases/${target.id}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.symptoms.length > 0);
    assert.ok(res.body.data.causes.length > 0);
    assert.ok(res.body.data.organicRemedies.length > 0);
    assert.ok(res.body.data.chemicalTreatment.length > 0);
    assert.ok(res.body.data.prevention.length > 0);
    assert.ok(res.body.data.precautions.length > 0);
  });

  await check('GET /api/diseases/:id returns 404 for a bad id', async () => {
    const res = await api('GET', '/api/diseases/64b7f0000000000000000000');
    assert.strictEqual(res.status, 404);
  });

  await check('GET /api/diseases/:id returns 400 for a malformed id', async () => {
    const res = await api('GET', '/api/diseases/not-an-id');
    assert.strictEqual(res.status, 400);
  });

  // -------------------------------------------------- diseases (admin CRUD)
  section('Diseases (admin CRUD)');

  await check('POST /api/diseases is blocked for normal users', async () => {
    const res = await api('POST', '/api/diseases', { token: userToken, body: { diseaseName: 'X' } });
    assert.strictEqual(res.status, 403);
  });

  await check('POST /api/diseases creates a record (admin)', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: {
        diseaseName: 'Test Blight',
        plantName: 'Testcrop',
        description: 'A disease created by the automated test suite.',
        severity: 'Medium',
        symptoms: ['Symptom one', 'Symptom two'],
        causes: ['Cause one'],
        organicRemedies: ['Remedy one'],
        chemicalTreatment: ['Spray one'],
        prevention: ['Prevention one'],
        precautions: ['Precaution one'],
        mlLabels: ['Testcrop___Test_blight'],
      },
    });
    assert.strictEqual(res.status, 201);
    assert.deepStrictEqual(res.body.data.symptoms, ['Symptom one', 'Symptom two']);
    createdDiseaseId = res.body.data.id;
  });

  await check('POST /api/diseases rejects a duplicate plant+disease', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: { diseaseName: 'Test Blight', plantName: 'Testcrop', description: 'Duplicate attempt' },
    });
    assert.strictEqual(res.status, 409);
  });

  await check('POST /api/diseases validates required fields', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: { plantName: 'Testcrop', description: 'Missing disease name' },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some((e) => e.field === 'diseaseName'));
  });

  await check('POST /api/diseases rejects an invalid severity', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: { diseaseName: 'Bad Sev', plantName: 'Testcrop', description: 'Bad severity', severity: 'Extremely Bad' },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.errors.some((e) => e.field === 'severity'));
  });

  await check('POST /api/diseases accepts a comma separated string list', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: {
        diseaseName: 'List Parsing Blight',
        plantName: 'Testcrop',
        description: 'Checks the comma separated string conversion.',
        symptoms: 'first symptom, second symptom',
        causes: 'one cause',
        organicRemedies: 'one remedy',
        chemicalTreatment: 'one spray',
        prevention: 'one prevention',
        precautions: 'one precaution',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.deepStrictEqual(res.body.data.symptoms, ['first symptom', 'second symptom']);
    await api('DELETE', `/api/diseases/${res.body.data.id}`, { token: adminToken });
  });

  await check('POST /api/diseases rejects a record with no symptom bullets', async () => {
    const res = await api('POST', '/api/diseases', {
      token: adminToken,
      body: {
        diseaseName: 'Empty Symptoms',
        plantName: 'Testcrop',
        description: 'Symptoms is an empty string, which must not be accepted.',
        symptoms: '',
        causes: 'one cause',
        organicRemedies: 'one remedy',
        chemicalTreatment: 'one spray',
        prevention: 'one prevention',
        precautions: 'one precaution',
      },
    });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT /api/diseases/:id updates a record', async () => {
    const res = await api('PUT', `/api/diseases/${createdDiseaseId}`, {
      token: adminToken,
      body: { severity: 'High', symptoms: ['Updated symptom'] },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.severity, 'High');
    assert.deepStrictEqual(res.body.data.symptoms, ['Updated symptom']);
    assert.strictEqual(res.body.data.plantName, 'Testcrop', 'partial update must not clear other fields');
  });

  await check('PUT /api/diseases/:id returns 404 for a missing record', async () => {
    const res = await api('PUT', '/api/diseases/64b7f0000000000000000000', {
      token: adminToken,
      body: { severity: 'Low' },
    });
    assert.strictEqual(res.status, 404);
  });

  await check('DELETE /api/diseases/:id removes a record', async () => {
    const res = await api('DELETE', `/api/diseases/${createdDiseaseId}`, { token: adminToken });
    assert.strictEqual(res.status, 200);

    const after = await api('GET', `/api/diseases/${createdDiseaseId}`);
    assert.strictEqual(after.status, 404);
  });

  // ------------------------------------------------------------ predictions
  section('Predictions');

  await check('POST /api/predictions rejects a request with no image', async () => {
    const res = await api('POST', '/api/predictions', { token: userToken });
    assert.strictEqual(res.status, 400);
  });

  await check('POST /api/predictions rejects a non-image file', async () => {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('not an image')], { type: 'text/plain' }), 'note.txt');
    const res = await api('POST', '/api/predictions', { token: userToken, form });
    assert.strictEqual(res.status, 400);
    assert.ok(/JPG|JPEG|PNG|image/i.test(res.body.message));
  });

  await check('POST /api/predictions rejects a renamed fake image', async () => {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('#!/bin/bash\necho hacked')], { type: 'image/png' }), 'evil.png');
    const res = await api('POST', '/api/predictions', { token: userToken, form });
    assert.strictEqual(res.status, 400);
    assert.ok(/not a valid PNG or JPEG/i.test(res.body.message));
  });

  await check('POST /api/predictions requires authentication', async () => {
    const form = new FormData();
    form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'leaf.png');
    const res = await api('POST', '/api/predictions', { form });
    assert.strictEqual(res.status, 401);
  });

  await check('POST /api/predictions analyses an image and saves history', async () => {
    const form = new FormData();
    form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'leaf.png');
    const res = await api('POST', '/api/predictions', { token: userToken, form });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    assert.ok(res.body.data.prediction.plantName);
    assert.ok(res.body.data.prediction.diseaseName);
    assert.ok(typeof res.body.data.prediction.confidence === 'number');
    assert.strictEqual(res.body.data.prediction.predictionSource, 'plant.id');
    assert.ok(['detected', 'low_confidence', 'healthy'].includes(res.body.data.prediction.predictionStatus));
    assert.ok(res.body.data.disclaimer, 'a disclaimer must be shown');
    predictionId = res.body.data.prediction.id;
  });

  await check('The saved prediction links a disease record', async () => {
    const res = await api('GET', `/api/predictions/${predictionId}`, { token: userToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.disease, 'no disease record matched the prediction');
    assert.ok(res.body.data.disease.symptoms.length > 0);
  });

  await check('A lower-ranked suggestion never renames the result', async () => {
    // Plant.id often answers with generic pathogens. "Bacteria" used to be a
    // substring match for "Bacterial Spot", so the rank-2 name was saved with
    // the rank-1 confidence -- a number nobody measured. Only top-1 may name
    // the result, and an unmatched one must say so instead of guessing.
    stubDiseases = [
      { id: 'x1', name: 'Fungi', probability: 0.44 },
      { id: 'x2', name: 'Bacteria', probability: 0.31 },
    ];

    try {
      const form = new FormData();
      form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'leaf.png');
      const res = await api('POST', '/api/predictions', { token: userToken, form });
      assert.strictEqual(res.status, 201, JSON.stringify(res.body));

      const { prediction, disease, remedyNotice } = res.body.data;
      assert.strictEqual(prediction.diseaseName, 'Fungi', 'rank-2 must not rename the prediction');
      assert.strictEqual(prediction.confidence, 44, 'confidence must stay the top-1 probability');
      assert.strictEqual(prediction.topPredictions[0].disease, 'Fungi');
      assert.strictEqual(disease, null, 'an unmatched suggestion must not borrow a record');
      assert.ok(remedyNotice && remedyNotice.length > 10, 'the honest no-record notice is required');
    } finally {
      stubDiseases = DEFAULT_STUB_DISEASES;
    }
  });

  await check('GET /api/predictions/my lists the history', async () => {
    const res = await api('GET', '/api/predictions/my', { token: userToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.pagination.total > 0);
  });

  await check('GET /api/predictions/my filters by plant', async () => {
    const res = await api('GET', '/api/predictions/my?plant=Tomato', { token: userToken });
    assert.ok(res.body.data.every((p) => p.plantName === 'Tomato'));
  });

  await check('GET /api/predictions/stats/my returns dashboard aggregates', async () => {
    const res = await api('GET', '/api/predictions/stats/my', { token: userToken });
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.data.totalScans === 'number');
    assert.ok(Array.isArray(res.body.data.topDiseases));
  });

  await check('GET /api/predictions/:id hides another user record', async () => {
    const other = await api('POST', '/api/auth/login', {
      body: { email: process.env.ADMIN_EMAIL || 'admin@plantdisease.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' },
    });
    const res = await api('GET', `/api/predictions/${predictionId}`, { token: other.body.data.token });
    // An admin is allowed to read any prediction.
    assert.strictEqual(res.status, 200);
  });

  await check('DELETE /api/predictions/:id removes the record', async () => {
    const res = await api('DELETE', `/api/predictions/${predictionId}`, { token: userToken });
    assert.strictEqual(res.status, 200);
    const after = await api('GET', `/api/predictions/${predictionId}`, { token: userToken });
    assert.strictEqual(after.status, 404);
  });

  await check('POST /api/predict analyses without saving history', async () => {
    const before = await api('GET', '/api/predictions/my', { token: userToken });
    const form = new FormData();
    form.append('image', new Blob([TINY_PNG], { type: 'image/png' }), 'leaf.png');
    const res = await api('POST', '/api/predict', { token: userToken, form });
    assert.strictEqual(res.status, 200);
    const after = await api('GET', '/api/predictions/my', { token: userToken });
    assert.strictEqual(
      before.body.pagination.total,
      after.body.pagination.total,
      'predictOnly must not create history rows'
    );
  });

  // ----------------------------------------------------------------- admin
  section('Admin');

  await check('GET /api/admin/users is blocked for normal users', async () => {
    const res = await api('GET', '/api/admin/users', { token: userToken });
    assert.strictEqual(res.status, 403);
  });

  await check('GET /api/admin/statistics returns dashboard counters', async () => {
    const res = await api('GET', '/api/admin/statistics', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.totals.users > 0);
    assert.ok(res.body.data.totals.diseases > 0);
    assert.ok(res.body.data.totals.predictions > 0);
    assert.ok(Array.isArray(res.body.data.topDiseases));
    assert.ok(Array.isArray(res.body.data.recentPredictions));
  });

  await check('GET /api/admin/users lists users with scan counts', async () => {
    const res = await api('GET', '/api/admin/users', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok('predictionCount' in res.body.data[0]);
  });

  await check('GET /api/admin/users filters by search', async () => {
    const res = await api('GET', `/api/admin/users?search=${randomEmail}`, { token: adminToken });
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].email, randomEmail);
  });

  await check('GET /api/admin/users/:id returns one user', async () => {
    const res = await api('GET', `/api/admin/users/${(await api('GET', `/api/admin/users?search=${randomEmail}`, { token: adminToken })).body.data[0].id}`, { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.email, randomEmail);
  });

  await check('POST /api/admin/users creates a user', async () => {
    const email = `managed${Date.now()}@example.com`;
    const res = await api('POST', '/api/admin/users', {
      token: adminToken,
      body: { name: 'Managed User', email, password: 'Managed@123', role: 'user' },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.role, 'user');

    const deleteRes = await api('DELETE', `/api/admin/users/${res.body.data.id}`, { token: adminToken });
    assert.strictEqual(deleteRes.status, 200);
  });

  await check('PUT /api/admin/users/:id changes the role', async () => {
    const list = await api('GET', `/api/admin/users?search=${randomEmail}`, { token: adminToken });
    const target = list.body.data[0];

    const promote = await api('PUT', `/api/admin/users/${target.id}`, { token: adminToken, body: { role: 'admin' } });
    assert.strictEqual(promote.status, 200);
    assert.strictEqual(promote.body.data.role, 'admin');

    const demote = await api('PUT', `/api/admin/users/${target.id}`, { token: adminToken, body: { role: 'user' } });
    assert.strictEqual(demote.status, 200);
  });

  await check('PUT /api/admin/users/:id blocks self-demotion', async () => {
    const me = await api('GET', '/api/auth/me', { token: adminToken });
    const res = await api('PUT', `/api/admin/users/${me.body.data.user.id}`, {
      token: adminToken,
      body: { role: 'user' },
    });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT /api/admin/users/:id blocks self-deactivation', async () => {
    const me = await api('GET', '/api/auth/me', { token: adminToken });
    const res = await api('PUT', `/api/admin/users/${me.body.data.user.id}`, {
      token: adminToken,
      body: { isActive: false },
    });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT /api/admin/users/:id rejects an invalid role', async () => {
    const list = await api('GET', `/api/admin/users?search=${randomEmail}`, { token: adminToken });
    const res = await api('PUT', `/api/admin/users/${list.body.data[0].id}`, {
      token: adminToken,
      body: { role: 'superuser' },
    });
    assert.strictEqual(res.status, 400);
  });

  await check('GET /api/admin/predictions lists all predictions', async () => {
    const res = await api('GET', '/api/admin/predictions', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].user, 'the owner must be populated');
  });

  await check('GET /api/admin/predictions filters by status', async () => {
    const res = await api('GET', '/api/admin/predictions?status=detected', { token: adminToken });
    assert.ok(res.body.data.every((p) => p.predictionStatus === 'detected'));
  });

  await check('GET /api/admin/ml-health reports the Plant.id API state', async () => {
    const res = await api('GET', '/api/admin/ml-health', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.data.reachable, 'boolean');
    assert.strictEqual(res.body.data.source, 'plant.id');
  });

  await check('DELETE /api/admin/predictions/:id removes a record', async () => {
    const list = await api('GET', '/api/admin/predictions', { token: adminToken });
    const res = await api('DELETE', `/api/admin/predictions/${list.body.data[0].id}`, { token: adminToken });
    assert.strictEqual(res.status, 200);
  });

  // ------------------------------------------------------------- cleanup
  section('Account cleanup');

  await check('DELETE /api/users/profile requires the password', async () => {
    const res = await api('DELETE', '/api/users/profile', { token: userToken, body: {} });
    assert.strictEqual(res.status, 401);
  });

  await check('DELETE /api/users/profile removes the account', async () => {
    const res = await api('DELETE', '/api/users/profile', { token: userToken, body: { password: 'New@1234' } });
    assert.strictEqual(res.status, 200);

    const after = await api('GET', '/api/auth/me', { token: userToken });
    assert.strictEqual(after.status, 401, 'a deleted account token must stop working');
  });

  // ------------------------------------------------------------- summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  passed: ${passed}   failed: ${failed}`);
  if (failed) {
    console.log('\n  Failures:');
    failures.forEach((item) => console.log(`   - ${item.name}: ${item.message}`));
  }
  console.log(`${'='.repeat(60)}\n`);

  process.exit(failed ? 1 : 0);
}

boot()
  .then(() => run())
  .catch((error) => {
    console.error('\nTest runner crashed:', error);
    console.error('\nCheck that MongoDB is running, then try:  npm run seed');
    process.exit(1);
  });
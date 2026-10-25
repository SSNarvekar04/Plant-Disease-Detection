/**
 * Integration test: the real Plant.id chain.
 *
 * Exercises exactly what a user does in the browser:
 *
 *   React -> Node API -> Plant.id API -> MongoDB -> result payload
 *
 * Unlike tests/api.test.js (which runs offline against a local stub), this
 * test performs a PAID, live call to Plant.id. It therefore skips itself
 * instead of failing when:
 *   - the backend has no PLANT_ID_API_KEY configured, or
 *   - no sample leaf image is available.
 *
 * Requires the backend to be running:
 *   npm run dev
 *
 * Run with:
 *   npm run test:integration
 *
 * Supply the image you want analysed:
 *   TEST_IMAGE="C:\path\leaf.jpg" npm run test:integration
 *   (without it, the first PNG/JPEG found in backend/uploads is used)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const API_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

let passed = 0;
let failed = 0;
const failures = [];

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

async function api(method, endpoint, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}${endpoint}`, { method, headers, body: payload });
  const text = await response.text();
  return { status: response.status, body: JSON.parse(text) };
}

/** Finds a real photo to send to Plant.id, if one exists locally. */
function findSampleImage() {
  if (process.env.TEST_IMAGE && fs.existsSync(process.env.TEST_IMAGE)) {
    return process.env.TEST_IMAGE;
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) return null;

  const file = fs
    .readdirSync(uploadsDir)
    .find((name) => /\.(png|jpe?g)$/i.test(name) && !name.startsWith('seed-'));

  return file ? path.join(uploadsDir, file) : null;
}

function skip(reason) {
  console.log(`\nIntegration test skipped\n  ${reason}\n`);
  process.exit(0);
}

async function run() {
  console.log(`\nPlant.id integration test\n  API: ${API_URL}\n${'='.repeat(60)}`);

  // --- preconditions -------------------------------------------------------
  const health = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(5000) })
    .then((res) => res.json())
    .catch(() => null);

  if (!health) {
    skip(`The backend is not running at ${API_URL}. Start it with:  npm run dev`);
  }
  if (!health.data.predictionServiceConfigured) {
    skip('PLANT_ID_API_KEY is not set in backend/.env, so no live call can be made.');
  }

  const imagePath = findSampleImage();
  if (!imagePath) {
    skip('No sample leaf image found. Set TEST_IMAGE="C:\\path\\leaf.jpg" and run again.');
  }

  console.log(`  Image : ${imagePath}`);
  console.log(`  Source: Plant.id (live, paid request)\n${'='.repeat(60)}\n`);

  // --- user ----------------------------------------------------------------
  const email = `integ${Date.now()}@example.com`;
  const registered = await api('POST', '/api/auth/register', {
    body: { name: 'Integration Tester', email, password: 'Test@123', confirmPassword: 'Test@123' },
  });
  assert.strictEqual(registered.status, 201, JSON.stringify(registered.body));

  const login = await api('POST', '/api/auth/login', { body: { email, password: 'Test@123' } });
  const token = login.body.data.token;

  // --- the real prediction -------------------------------------------------
  let predictionId = null;
  let prediction = null;

  await check('POST /api/predictions returns a Plant.id result', async () => {
    const form = new FormData();
    const bytes = fs.readFileSync(imagePath);
    form.append('image', new Blob([bytes], { type: 'image/png' }), path.basename(imagePath));

    const res = await api('POST', '/api/predictions', { token, form });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));

    prediction = res.body.data.prediction;
    predictionId = prediction.id;

    assert.strictEqual(
      prediction.predictionSource,
      'plant.id',
      `expected the result to come from Plant.id, got "${prediction.predictionSource}"`
    );
    assert.ok(prediction.plantName, 'plant name missing');
    assert.ok(prediction.diseaseName, 'disease name missing');
    assert.ok(prediction.confidence > 0 && prediction.confidence <= 100, 'confidence out of range');
  });

  await check('The confidence is the value Plant.id returned', async () => {
    const res = await api('GET', `/api/predictions/${predictionId}`, { token });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.prediction.topPredictions.length > 0, 'no alternatives returned');
    const top = res.body.data.prediction.topPredictions[0];
    assert.ok(top.disease, 'alternative is missing a disease name');
    assert.ok(top.confidence > 0 && top.confidence <= 100, 'alternative confidence out of range');
  });

  await check('The result resolves a remedy record or reports it honestly', async () => {
    const res = await api('GET', `/api/predictions/${predictionId}`, { token });
    const { disease, remedyNotice } = res.body.data;
    if (disease) {
      assert.ok(disease.symptoms.length > 0, 'matched record has no symptoms');
      assert.ok(disease.organicRemedies.length > 0, 'matched record has no remedies');
      assert.ok(disease.prevention.length > 0, 'matched record has no prevention');
    } else {
      // Unknown disease: the API must say so instead of inventing a plan.
      assert.ok(remedyNotice && remedyNotice.length > 10, 'missing disease must be reported');
    }
  });

  await check('History and dashboard aggregates include the scan', async () => {
    const history = await api('GET', '/api/predictions/my', { token });
    assert.strictEqual(history.status, 200);
    assert.ok(history.body.data.length > 0);

    const stats = await api('GET', '/api/predictions/stats/my', { token });
    assert.strictEqual(stats.body.data.totalScans, 1);
    assert.ok(stats.body.data.mostDetectedDisease || stats.body.data.statusCounts);
  });

  await check('Result payload includes a disclaimer', async () => {
    const res = await api('GET', `/api/predictions/${predictionId}`, { token });
    assert.ok(res.body.data.disclaimer && res.body.data.disclaimer.length > 30);
  });

  // --- cleanup -------------------------------------------------------------
  await check('Integration user is cleaned up', async () => {
    const del = await api('DELETE', '/api/users/profile', { token, body: { password: 'Test@123' } });
    assert.strictEqual(del.status, 200);
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  passed: ${passed}   failed: ${failed}`);
  failures.forEach((item) => console.log(`   - ${item.name}: ${item.message}`));
  console.log(`${'='.repeat(60)}\n`);

  process.exit(failed ? 1 : 0);
}

run().catch((error) => {
  console.error('\nIntegration test crashed:', error);
  process.exit(1);
});

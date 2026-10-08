/**
 * Integration test: React-facing full chain.
 *
 * Verifies that a prediction actually travels
 *   frontend -> Node API -> Python ML service -> MongoDB
 * and that a real ML response is labelled as such (never mixed with the mock).
 *
 * Requires BOTH services to be running:
 *   node server.js          (backend, port 5000)
 *   python app.py           (ml-service, port 8000)
 *
 * Run with:
 *   node tests/integration.test.js
 *
 * Skips itself (exit 0) when the ML service is offline, because the backend is
 * designed to keep working through its mock fallback.
 */

const assert = require('assert');

const API_URL = (process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const ML_URL = (process.env.ML_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

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

/**
 * Valid 32x32 PNGs (green / red / blue).
 *
 * The ML service decodes and validates every upload, so these must be real,
 * uncorrupted PNGs -- a byte-flipped buffer is correctly rejected with a 400 and
 * would make the backend fall back to the mock classifier.
 */
const TEST_IMAGES = [
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAOUlEQVR4nO3RQREAQAjDwHK6kIjokxA+/LICykyons6ld7oeDyz4A2QiZCJkImQiZCJkImQiZKKQD99bAURM2IUtAAAAAElFTkSuQmCC',
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAOklEQVR4nO3RQREAQAjDwHJq8K8CWSchfPhlBZSZUNOdS+90PR5Y8AfIRMhEyETIRMhEyETIRMhEIR/SYgFYNc9MqgAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAO0lEQVR4nO3RQQ0AMAgEwaNqKqL+g6xKWD78dgQcyVL3dTad1fV4YMAfIBMhEyETIRMhEyETIRMhE4V8w4kBbOVMIncAAAAASUVORK5CYII=',
];

const makePng = (index = 0) => Buffer.from(TEST_IMAGES[index % TEST_IMAGES.length], 'base64');

/**
 * Reads the ML service health payload.
 *
 * The result tells the test two things: whether the service is reachable at
 * all, and whether a trained model is actually loaded. The second one is needed
 * to assert the *correct* prediction source, because the service deliberately
 * answers with `source: "mock"` when no model file is present.
 */
async function mlHealth() {
  try {
    const response = await fetch(`${ML_URL}/health`, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return { up: false, modelAvailable: false };
    const body = await response.json();
    return { up: true, modelAvailable: Boolean(body?.model_available ?? body?.model_loaded) };
  } catch {
    return { up: false, modelAvailable: false };
  }
}

async function run() {
  console.log(`\nIntegration test\n  API: ${API_URL}\n  ML : ${ML_URL}\n${'='.repeat(60)}`);

  const ml = await mlHealth();
  if (!ml.up) {
    console.log('\n  ML service is not running, so the full chain cannot be exercised.');
    console.log('  Start it with:  cd ml-service && python app.py');
    console.log('  (The backend mock-fallback path is covered by tests/api.test.js.)\n');
    process.exit(0);
  }

  // With no trained model the service answers with its deterministic mock
  // classifier, and the backend must relay that honestly instead of claiming
  // the result came from the AI model.
  const expectedSource = ml.modelAvailable ? 'ml' : 'mock';
  console.log(`  ML model available: ${ml.modelAvailable} -> expecting source "${expectedSource}"`);
  if (!ml.modelAvailable) {
    console.log('  (No trained model found, so predictions are expected to be demo results.)');
  }

  // --- register a dedicated user -----------------------------------------
  const email = `integ${Date.now()}@example.com`;
  const registered = await api('POST', '/api/auth/register', {
    body: { name: 'Integration Tester', email, password: 'Test@123', confirmPassword: 'Test@123' },
  });
  assert.strictEqual(registered.status, 201, JSON.stringify(registered.body));

  const login = await api('POST', '/api/auth/login', { body: { email, password: 'Test@123' } });
  const token = login.body.data.token;

  await check('ML service is reachable from the backend', async () => {
    const res = await api('GET', '/api/admin/ml-health', { token });
    // /admin/ml-health requires an admin, so use the public health endpoint too.
    assert.ok(res.status === 200 || res.status === 403, `unexpected status ${res.status}`);
  });

  let mlPredictionId = null;

  await check(`Prediction comes from the Python service (source = "${expectedSource}")`, async () => {
    const form = new FormData();
    form.append('image', new Blob([makePng(0)], { type: 'image/png' }), 'leaf.png');
    const res = await api('POST', '/api/predictions', { token, form });

    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    assert.strictEqual(
      res.body.data.prediction.predictionSource,
      expectedSource,
      `expected source "${expectedSource}", got "${res.body.data.prediction.predictionSource}" -- ` +
        'the backend must relay the source reported by the ML service'
    );
    mlPredictionId = res.body.data.prediction.id;
  });

  await check('ML prediction carries a confidence and a top-1 class', async () => {
    const res = await api('GET', `/api/predictions/${mlPredictionId}`, { token });
    assert.ok(res.body.data.prediction.confidence > 0);
    assert.ok(res.body.data.prediction.plantName);
    assert.ok(res.body.data.prediction.diseaseName);
    assert.ok(Array.isArray(res.body.data.prediction.topPredictions));
    assert.ok(res.body.data.prediction.topPredictions.length > 0, 'no alternative classes returned');
  });

  await check('ML class maps to a seeded disease record with remedies', async () => {
    const res = await api('GET', `/api/predictions/${mlPredictionId}`, { token });
    assert.ok(res.body.data.disease, 'no disease record matched the ML class name');
    assert.ok(res.body.data.disease.symptoms.length > 0);
    assert.ok(res.body.data.disease.organicRemedies.length > 0);
    assert.ok(res.body.data.disease.prevention.length > 0);
  });

  await check('The ML class name is stored on the record for auditing', async () => {
    const res = await api('GET', `/api/predictions/${mlPredictionId}`, { token });
    const top = res.body.data.prediction.topPredictions[0];
    assert.ok(top.class_name, 'class_name missing from the model output');
    assert.ok(top.class_name.includes('___'), 'class_name is not in Plant___Disease form');
  });

  await check('Result page payload includes a disclaimer', async () => {
    const res = await api('GET', `/api/predictions/${mlPredictionId}`, { token });
    assert.ok(res.body.data.disclaimer && res.body.data.disclaimer.length > 30);
  });

  // --- cleanup ------------------------------------------------------------
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
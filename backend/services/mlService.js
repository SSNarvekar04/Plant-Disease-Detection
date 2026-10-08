/**
 * ML service client.
 *
 * Talks to the Python TensorFlow service (ml-service) over HTTP. When that
 * service is unreachable the client can fall back to a *deterministic* mock
 * classifier so the whole application stays demo-able without a GPU.
 *
 * The fallback is never silently mixed with real predictions: every result
 * carries `predictionSource` ('ml' or 'mock'), which is stored on the
 * prediction document and shown in the UI.
 */

const crypto = require('crypto');
const config = require('../config/env');
const { ApiError, mockEnabled } = require('../utils/helpers');

/**
 * The class list the model predicts. Keep this aligned with the `classes.txt`
 * file used by the ML service and with the `mlLabels` values in seed.js.
 */
const MODEL_CLASSES = [
  'Apple___Apple_scab',
  'Apple___Black_rot',
  'Apple___Cedar_apple_rust',
  'Apple___healthy',
  'Corn___Cercospora_leaf_spot Gray_leaf_spot',
  'Corn___Common_rust',
  'Corn___Northern_Leaf_Blight',
  'Corn___healthy',
  'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  'Grape___healthy',
  'Pepper,_bell___Bacterial_spot',
  'Pepper,_bell___healthy',
  'Potato___Early_blight',
  'Potato___Late_blight',
  'Potato___healthy',
  'Strawberry___Leaf_scorch',
  'Strawberry___healthy',
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites Two-spotted_spider_mite',
  'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
  'Tomato___Tomato_mosaic_virus',
  'Tomato___healthy',
];

/** "Tomato___Early_blight" -> { plant: 'Tomato', label: 'Early blight', raw: ... } */
function parseModelClass(rawClass) {
  const parts = String(rawClass || '').split('___');
  const plant = parts[0] || 'Unknown';
  const label = (parts[1] || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { plant, label, raw: String(rawClass) };
}

/**
 * Requests a prediction from the Python ML service.
 * Uses fetch (built into Node 18+) with an AbortController timeout, so no
 * extra HTTP dependency is required.
 *
 * @param {{ buffer: Buffer, originalname?: string, mimetype?: string }} file
 * @returns {Promise<{plant: string, disease: string, confidence: number,
 *                    predictionSource: 'ml'|'mock', classIndex: number,
 *                    modelName: string, topPredictions: Array}>}
 */
async function predictDisease(file) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw ApiError.badRequest('No image was received for prediction');
  }

  try {
    const raw = await callMlService(file);
    // The Python service tags its own answer: `source` is "ml" only when the
    // trained Keras model produced it, and "mock" when it had to fall back to
    // the deterministic classifier (no model file present). That distinction
    // must survive into `predictionSource`, otherwise a demo result would be
    // presented to the user as a real AI diagnosis.
    return { ...raw, predictionSource: raw.source === 'ml' ? 'ml' : 'mock' };
  } catch (error) {
    // A 4xx answer means the ML service understood the request and rejected it
    // (unreadable or truncated image). That is the caller's fault, not an
    // outage, so it must surface as an error instead of silently becoming a
    // fabricated mock prediction.
    if (error.isClientError) throw error;

    console.warn(`⚠️  ML service unavailable (${error.message}). Falling back to mock classifier.`);

    if (!mockEnabled()) {
      throw new ApiError(
        503,
        'The AI prediction service is currently unavailable. Please try again in a few moments.'
      );
    }
    return mockPredict(file.buffer);
  }
}

/** Performs the actual multipart POST to the Python service. */
async function callMlService(file) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ml.timeoutMs);

  try {
    // Node's fetch understands Blob/FormData natively.
    const blob = new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, file.originalname || 'leaf.jpg');

    const response = await fetch(`${config.ml.serviceUrl}/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await readErrorDetail(response);

      // 4xx = the service rejected this specific request. Surface it as a bad
      // request rather than degrading to a mock prediction.
      if (response.status >= 400 && response.status < 500) {
        const clientError = ApiError.badRequest(
          detail || 'The uploaded image could not be read by the AI service. Please try a different image.'
        );
        clientError.isClientError = true;
        throw clientError;
      }

      throw new Error(`ML service responded with ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.disease || typeof data.confidence !== 'number') {
      throw new Error('ML service returned an unexpected payload');
    }

    const { plant, label } = parseModelClass(data.class_name || data.disease);
    const confidence = Number(data.confidence);
    const topPredictions = Array.isArray(data.top_predictions) ? data.top_predictions : [];

    return {
      plant: data.plant || plant,
      disease: data.disease || label,
      confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(2)) : 0,
      classIndex: Number.isInteger(data.class_index) ? data.class_index : -1,
      modelName: data.model_name || 'plant_disease_cnn',
      topPredictions,
      // Passed through unchanged: 'ml' (real model) or 'mock' (fallback).
      source: data.source === 'ml' ? 'ml' : 'mock',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Extracts the human readable `detail` field from a FastAPI error body. */
async function readErrorDetail(response) {
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') return body.detail;
  } catch {
    // Non-JSON error body, ignore.
  }
  return null;
}

/**
 * Deterministic mock classifier.
 *
 * Uses the SHA-256 checksum of the image bytes to pick a class, so the same
 * image always returns the same result (which makes demos and screenshots
 * reproducible). Confidence is derived from the same hash and kept in a
 * believable range.
 *
 * @param {Buffer} buffer
 */
function mockPredict(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest();
  const classIndex = hash[0] % MODEL_CLASSES.length;
  const rawClass = MODEL_CLASSES[classIndex];
  const { plant, label } = parseModelClass(rawClass);

  // 68 % - 97 %, stable for a given image.
  const confidence = Number((68 + (hash[1] / 255) * 29).toFixed(2));

  // Two "runner up" classes so the UI can show a small bar chart.
  const topPredictions = [];
  let cursor = 2;
  while (topPredictions.length < 3) {
    const index = (classIndex + cursor) % MODEL_CLASSES.length;
    if (index !== classIndex) {
      const runnerUp = parseModelClass(MODEL_CLASSES[index]);
      const share = Number((confidence * (0.45 + (hash[cursor] || 10) / 500)).toFixed(2));
      topPredictions.push({
        class_name: MODEL_CLASSES[index],
        plant: runnerUp.plant,
        disease: runnerUp.label,
        confidence: share,
      });
    }
    cursor += 1;
  }

  return {
    plant,
    disease: label,
    confidence,
    classIndex,
    modelName: 'mock-classifier (no ML service connected)',
    topPredictions,
    predictionSource: 'mock',
  };
}

/** Simple liveness check used by the admin dashboard. */
async function checkHealth() {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${config.ml.serviceUrl}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = response.ok ? await response.json() : null;
    return {
      reachable: response.ok,
      latencyMs: Date.now() - startedAt,
      details: data,
    };
  } catch (error) {
    return {
      reachable: false,
      latencyMs: Date.now() - startedAt,
      details: { error: error.message, url: config.ml.serviceUrl },
    };
  }
}

module.exports = {
  predictDisease,
  checkHealth,
  mockPredict,
  parseModelClass,
  MODEL_CLASSES,
};

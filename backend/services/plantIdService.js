/**
 * Plant.id API client.
 *
 * The only place in the backend that talks to the AI provider. It sends the
 * uploaded leaf image to Plant.id and turns the raw response into the small,
 * normalised shape the prediction controller expects.
 *
 * Contract:
 *   - `PLANT_ID_API_KEY` is read from the server-side .env and is never sent
 *     to the browser, never logged and never included in an error message.
 *   - Every result carries `predictionSource: 'plant.id'`. There is no mock
 *     fallback: if Plant.id cannot answer, the request fails with a clean
 *     503 instead of inventing a diagnosis.
 *
 * One request to POST /identification with `health: "all"` returns everything
 * we need: the plant species, the disease suggestions and the health verdict.
 */

const axios = require('axios');
const config = require('../config/env');
const { ApiError } = require('../utils/helpers');

/** Stored on every prediction so the UI can show where the answer came from. */
const PREDICTION_SOURCE = 'plant.id';

/** Exact wording required when the AI provider is unreachable. */
const SERVICE_UNAVAILABLE_MESSAGE =
  'AI prediction service is temporarily unavailable. Please try again later.';

/** Shown when the key was never configured -- never reveals the key itself. */
const API_KEY_MISSING_MESSAGE =
  'AI prediction service is not configured. Set PLANT_ID_API_KEY in backend/.env and restart the server.';

/**
 * Plant.id answers with scientific species names (for example
 * "Solanum lycopersicum"), while the disease knowledge base is organised by the
 * crop name used by farmers ("Tomato"). This maps one onto the other.
 *
 * A suggestion is matched in this order:
 *   1. exact / starts-with match against the scientific name
 *   2. the common crop word appearing anywhere in the suggestion
 *   3. whatever Plant.id returned (kept verbatim, so nothing is invented)
 */
const CROP_SYNONYMS = [
  { crop: 'Tomato', patterns: ['solanum lycopersicum', 'tomato'] },
  { crop: 'Potato', patterns: ['solanum tuberosum', 'potato'] },
  { crop: 'Apple', patterns: ['malus domestica', 'malus pumila', 'malus sieversii', 'apple'] },
  { crop: 'Grape', patterns: ['vitis vinifera', 'vitis', 'grape'] },
  {
    crop: 'Pepper',
    patterns: ['capsicum annuum', 'capsicum chinense', 'capsicum baccatum', 'bell pepper', 'pepper'],
  },
  { crop: 'Strawberry', patterns: ['fragaria', 'strawberry'] },
  { crop: 'Corn', patterns: ['zea mays', 'maize', 'corn'] },
];

/**
 * Maps a list of Plant.id classification suggestions to the crop name used by
 * the knowledge base.
 *
 * @param {Array<{name?: string, probability?: number}>} suggestions
 * @returns {{ crop: string, species: string, probability: number|null }}
 */
function resolvePlant(suggestions = []) {
  const top = suggestions[0]?.name ? suggestions[0] : null;
  const species = top ? String(top.name) : '';
  const probability = typeof top?.probability === 'number' ? Math.round(top.probability * 10000) / 100 : null;
  const haystack = species.toLowerCase();

  for (const entry of CROP_SYNONYMS) {
    // Exact scientific-name match first, so "Pepper" cannot beat "Capsicum".
    if (entry.patterns.some((pattern) => haystack === pattern)) {
      return { crop: entry.crop, species, probability };
    }
  }
  for (const entry of CROP_SYNONYMS) {
    if (entry.patterns.some((pattern) => haystack.includes(pattern))) {
      return { crop: entry.crop, species, probability };
    }
  }

  // Unknown species: show what Plant.id actually returned rather than guessing.
  return { crop: species || 'Unknown plant', species, probability };
}

/** Plant.id reports probabilities from 0-1; the UI shows a percentage. */
function toPercent(probability) {
  const value = Number(probability);
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 10000) / 100;
}

/**
 * Sends one image to Plant.id and returns a normalised prediction.
 *
 * @param {{ buffer: Buffer, originalname?: string, mimetype?: string }} file
 * @returns {Promise<{plant: string, disease: string, confidence: number,
 *   isHealthy: boolean, predictionSource: string, topPredictions: Array,
 *   plantSpecies: string, modelVersion: string, raw: object}>}
 */
async function analyseImage(file) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw ApiError.badRequest('No image was received for prediction');
  }

  if (!config.plantId.enabled) {
    throw new ApiError(503, API_KEY_MISSING_MESSAGE);
  }

  const raw = await callPlantId(file.buffer);

  const result = raw?.result;
  if (!result) {
    throw new ApiError(503, SERVICE_UNAVAILABLE_MESSAGE);
  }

  // Plant.id decided the photo does not contain a plant -- a client problem,
  // not an AI outage, so ask the user for a better image.
  if (result.is_plant && result.is_plant.binary === false) {
    throw ApiError.badRequest(
      'The uploaded image does not appear to be a plant. Please upload a clear photo of a leaf.'
    );
  }

  const { crop, species } = resolvePlant(result.classification?.suggestions);

  const diseaseSuggestions = Array.isArray(result.disease?.suggestions)
    ? result.disease.suggestions
    : [];
  const isHealthy = result.is_healthy?.binary === true;

  const topPredictions = diseaseSuggestions.map((item, index) => ({
    rank: index + 1,
    className: item.name,
    class_name: item.name,
    plant: crop,
    disease: item.name,
    confidence: toPercent(item.probability),
  }));

  // A healthy leaf has no disease class: report the health verdict as the
  // outcome, with the confidence Plant.id actually gave for it.
  const disease = isHealthy ? 'Healthy' : diseaseSuggestions[0]?.name || 'Unknown';
  const confidence = isHealthy
    ? toPercent(result.is_healthy?.probability)
    : toPercent(diseaseSuggestions[0]?.probability);

  return {
    plant: crop,
    plantSpecies: species,
    disease,
    confidence,
    isHealthy,
    predictionSource: PREDICTION_SOURCE,
    // Alternatives are shown under the headline result, so the top-1 must be first.
    topPredictions: topPredictions.length
      ? topPredictions
      : [{ rank: 1, className: disease, class_name: disease, plant: crop, disease, confidence }],
    modelVersion: raw.model_version || 'plant.id',
    raw: {
      accessToken: raw.access_token,
      modelVersion: raw.model_version,
      isPlant: result.is_plant,
      isHealthy: result.is_healthy,
      diseaseSuggestions,
      classification: result.classification,
      storageProvider: null,
    },
  };
}

/**
 * Performs the actual HTTPS call to Plant.id.
 * Maps network, timeout and provider failures onto the same honest 503 so the
 * client never sees an internal error or the API key.
 */
async function callPlantId(buffer) {
  try {
    const response = await axios.post(
      `${config.plantId.baseUrl}/identification`,
      {
        images: [buffer.toString('base64')],
        health: 'all',
        classification_level: 'species',
      },
      {
        headers: {
          'Api-Key': config.plantId.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: config.plantId.timeoutMs,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      // Bad key / no credits: an operational problem on our side.
      if (status === 401 || status === 403) {
        throw new ApiError(503, API_KEY_MISSING_MESSAGE);
      }
      if (status === 402) {
        throw new ApiError(503, 'AI prediction service quota has been exhausted. Please try again later.');
      }
      // Anything else from the provider is treated as an outage.
      throw new ApiError(503, SERVICE_UNAVAILABLE_MESSAGE);
    }

    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    console.warn(`Plant.id request failed (${timedOut ? 'timeout' : error.code || error.message})`);
    throw new ApiError(503, SERVICE_UNAVAILABLE_MESSAGE);
  }
}

/**
 * Liveness probe for the admin dashboard.
 *
 * Deliberately does NOT send an image: it only checks that the endpoint answers
 * and that a key is configured, so checking health costs nothing and cannot
 * burn API credits.
 */
async function checkHealth() {
  const keyConfigured = config.plantId.enabled;
  const startedAt = Date.now();

  if (!keyConfigured) {
    return {
      reachable: false,
      latencyMs: 0,
      details: { endpoint: config.plantId.baseUrl, apiKeyConfigured: false },
      note: 'PLANT_ID_API_KEY is not set, so predictions are disabled.',
    };
  }

  try {
    // Any HTTP answer (even 404/405) proves the network path is alive.
    await axios.get(config.plantId.baseUrl, {
      timeout: 5000,
      validateStatus: () => true,
    });
    return {
      reachable: true,
      latencyMs: Date.now() - startedAt,
      details: {
        endpoint: config.plantId.baseUrl,
        apiKeyConfigured: true,
        timeoutMs: config.plantId.timeoutMs,
      },
      note: 'Connected to the Plant.id API.',
    };
  } catch (error) {
    return {
      reachable: false,
      latencyMs: Date.now() - startedAt,
      details: {
        endpoint: config.plantId.baseUrl,
        apiKeyConfigured: true,
        error: error.message,
      },
      note: 'The Plant.id API is not reachable. Predictions are temporarily unavailable.',
    };
  }
}

module.exports = {
  analyseImage,
  checkHealth,
  resolvePlant,
  toPercent,
  PREDICTION_SOURCE,
  SERVICE_UNAVAILABLE_MESSAGE,
  API_KEY_MISSING_MESSAGE,
};

/**
 * Disease matching service.
 *
 * Bridges the AI model (which outputs class strings such as
 * `Tomato___Early_blight`) and the MongoDB knowledge base.
 *
 * Matching order:
 *   1. Exact `mlLabels` match   (most reliable, supports renaming in the DB)
 *   2. plantName + diseaseName  (case/whitespace insensitive)
 *   3. no match                 -> the prediction is still saved, but the UI
 *                                  shows a "no remedy record yet" notice.
 */

const Disease = require('../models/Disease');
const { parseModelClass } = require('./mlService');

/** "Early Blight" / "early blight" / "Early_blight" -> "early blight" */
function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the Disease document that corresponds to an ML prediction.
 * @param {{ plant: string, disease: string, classIndex?: number, topPredictions?: Array }} prediction
 * @returns {Promise<import('mongoose').Document|null>}
 */
async function findDiseaseForPrediction(prediction) {
  const { plant, disease } = prediction;

  // 1. Explicit label mapping stored on the disease document.
  const candidateLabels = [
    `${plant}___${String(disease).replace(/\s+/g, '_')}`,
    ...(prediction.topPredictions || []).map((item) => item.class_name),
  ].filter(Boolean);

  if (candidateLabels.length) {
    const byLabel = await Disease.findOne({ mlLabels: { $in: candidateLabels } });
    if (byLabel) return byLabel;
  }

  // 2. Fall back to name comparison.
  const candidates = await Disease.find({ plantName: plant }).exec();

  const targetDisease = normalise(disease);
  const exact = candidates.find((item) => normalise(item.diseaseName) === targetDisease);
  if (exact) return exact;

  const partial = candidates.find((item) => {
    const candidateName = normalise(item.diseaseName);
    return targetDisease.includes(candidateName) || candidateName.includes(targetDisease);
  });
  if (partial) return partial;

  return null;
}

/**
 * Picks the best disease for a prediction, considering the top-k class list.
 * Used so a slightly-wrong top-1 class can still resolve to a real remedy page.
 *
 * @param {{ plant: string, disease: string, topPredictions?: Array }} prediction
 */
async function findBestDiseaseMatch(prediction) {
  const direct = await findDiseaseForPrediction(prediction);
  if (direct) return direct;

  for (const alternative of prediction.topPredictions || []) {
    const matched = await findDiseaseForPrediction({
      plant: alternative.plant || prediction.plant,
      disease: alternative.disease,
      topPredictions: [alternative],
    });
    if (matched) return matched;
  }

  return null;
}

/** True when the model says the leaf looks healthy. */
function isHealthyPrediction(prediction) {
  return /healthy/i.test(prediction.disease) || /healthy/i.test(prediction.class_name || '');
}

/** Human readable message shown when no remedy record exists. */
const NO_RECORD_MESSAGE =
  'No remedy record is stored in the database for this detection yet. ' +
  'Please contact an administrator to add the treatment details for this disease.';

/** Turns a model class name into `{ plant, disease }` for reuse in controllers. */
const describeClass = parseModelClass;

module.exports = {
  findDiseaseForPrediction,
  findBestDiseaseMatch,
  isHealthyPrediction,
  describeClass,
  normalise,
  NO_RECORD_MESSAGE,
};
